import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailProcessRequest {
  emailId?: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { emailId, subject, body, senderEmail, senderName }: EmailProcessRequest = await req.json();
    console.log("Processing email:", { emailId, subject, senderEmail });

    const systemPrompt = `You are an AI assistant that categorizes business emails for a consulting company. 
Analyze the email and categorize it into one of these categories:
- feature_request: Customer asking for new features or improvements
- customer_quote: Customer requesting a quote, pricing, or proposal
- feedback: Customer providing feedback, complaints, or praise
- other: Emails that don't fit the above categories

Also extract relevant data based on the category:
- For feature_request: extract the feature name, urgency, and description
- For customer_quote: extract project name, estimated budget if mentioned, timeline
- For feedback: extract sentiment (positive/negative/neutral), topic

Respond ONLY with valid JSON in this exact format:
{
  "category": "feature_request" | "customer_quote" | "feedback" | "other",
  "confidence": 0.0-1.0,
  "summary": "Brief 1-2 sentence summary",
  "extracted_data": { ... relevant extracted fields based on category }
}`;

    const userPrompt = `Analyze and categorize this email:

From: ${senderName || senderEmail}
Subject: ${subject}

Body:
${body}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
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
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      parsed = {
        category: "other",
        confidence: 0.5,
        summary: "Unable to categorize email",
        extracted_data: {}
      };
    }

    // If emailId provided, update the database
    if (emailId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from("emails")
        .update({
          status: "processed",
          category: parsed.category,
          confidence_score: parsed.confidence,
          ai_summary: parsed.summary,
          extracted_data: parsed.extracted_data,
          processed_at: new Date().toISOString(),
        })
        .eq("id", emailId);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw updateError;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      category: parsed.category,
      confidence: parsed.confidence,
      summary: parsed.summary,
      extracted_data: parsed.extracted_data,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in process-email function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
