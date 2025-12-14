import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailProcessRequest {
  emailId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  let userOrgId: string | null = null;
  const isServiceRoleCall = token === supabaseKey;

  // If not a service role call, validate user authentication
  if (!isServiceRoleCall) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's organization
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (memberError || !teamMember) {
      return new Response(JSON.stringify({ error: "User is not a member of any organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    userOrgId = teamMember.organization_id;
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { emailId }: EmailProcessRequest = await req.json();

    if (!emailId) {
      throw new Error("emailId is required");
    }

    // Fetch the email from database
    let query = supabase.from("emails").select("*").eq("id", emailId);

    // If user call, validate org access
    if (!isServiceRoleCall && userOrgId) {
      query = query.eq("organization_id", userOrgId);
    }

    const { data: email, error: fetchError } = await query.single();

    if (fetchError || !email) {
      throw new Error("Email not found");
    }

    console.log("Processing email:", { emailId, subject: email.subject, sender: email.sender_email });

    const systemPrompt = `You are an AI assistant that categorizes business emails for a consulting company.
Analyze the email and categorize it into one of these categories:
- ticket: Customer reporting an issue, bug, problem, or support request
- feature_request: Customer asking for new features or improvements
- customer_quote: Customer requesting a quote, pricing, or proposal
- feedback: Customer providing feedback, complaints, praise, or general comments
- other: Emails that don't fit the above categories (newsletters, spam, personal, etc.)

Also extract relevant data based on the category:
- For ticket: extract issue_type, urgency (low/medium/high/critical), description
- For feature_request: extract the feature name, urgency, and description
- For customer_quote: extract project name, estimated budget if mentioned, timeline
- For feedback: extract sentiment (positive/negative/neutral), topic

Respond ONLY with valid JSON in this exact format:
{
  "category": "ticket" | "feature_request" | "customer_quote" | "feedback" | "other",
  "confidence": 0.0-1.0,
  "summary": "Brief 1-2 sentence summary",
  "suggested_title": "Short title for creating a record",
  "suggested_priority": "low" | "medium" | "high" | "critical",
  "extracted_data": { ... relevant extracted fields based on category }
}`;

    const userPrompt = `Analyze and categorize this email:

From: ${email.sender_name || email.sender_email}
Subject: ${email.subject}

Body:
${email.body}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ success: false, error: "Invalid OpenAI API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    console.log("AI response:", content);

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from AI
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      parsed = {
        category: "other",
        confidence: 0.5,
        summary: "Unable to categorize email",
        suggested_title: email.subject,
        suggested_priority: "medium",
        extracted_data: {}
      };
    }

    // Update the email in database
    const { error: updateError } = await supabase
      .from("emails")
      .update({
        status: "processed",
        category: parsed.category,
        confidence_score: parsed.confidence,
        ai_summary: parsed.summary,
        ai_suggested_title: parsed.suggested_title,
        ai_confidence: parsed.confidence,
        extracted_data: parsed.extracted_data,
        processed_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      category: parsed.category,
      confidence: parsed.confidence,
      summary: parsed.summary,
      suggested_title: parsed.suggested_title,
      suggested_priority: parsed.suggested_priority,
      extracted_data: parsed.extracted_data,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in process-email function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
