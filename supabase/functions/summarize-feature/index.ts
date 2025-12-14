import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummarizeRequest {
  featureId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const body: SummarizeRequest = await req.json();
    const { featureId } = body;

    if (!featureId) {
      throw new Error("Feature ID is required");
    }

    // Get user's organization
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select("organization_id")
      .eq("auth_user_id", userId)
      .single();

    if (memberError || !teamMember) {
      throw new Error("User is not a member of any organization");
    }

    // Fetch the feature request (with org validation)
    const { data: feature, error: fetchError } = await supabase
      .from("feature_requests")
      .select("*")
      .eq("id", featureId)
      .eq("organization_id", teamMember.organization_id)
      .single();

    if (fetchError || !feature) {
      throw new Error("Feature request not found");
    }

    // Build content to summarize
    const contentParts = [
      `Title: ${feature.title}`,
      feature.description ? `Description: ${feature.description}` : "",
      feature.notes ? `Notes: ${feature.notes}` : "",
      `Status: ${feature.status}`,
      `Priority: ${feature.priority}`,
      feature.category ? `Category: ${feature.category}` : "",
    ].filter(Boolean);

    const contentToSummarize = contentParts.join("\n\n");

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that summarizes feature requests for a project management tool.
            Create a concise, actionable summary that captures:
            1. The core feature being requested
            2. The main benefit or problem it solves
            3. Any key requirements or constraints mentioned
            Keep the summary to 2-3 sentences maximum. Be direct and professional.`
          },
          {
            role: "user",
            content: `Please summarize this feature request:\n\n${contentToSummarize}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error("Failed to generate summary");
    }

    const openaiData = await openaiResponse.json();
    const summary = openaiData.choices[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated");
    }

    // Update the feature request with the summary
    const { error: updateError } = await supabase
      .from("feature_requests")
      .update({
        ai_summary: summary,
        summarized_at: new Date().toISOString(),
      })
      .eq("id", featureId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save summary");
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        summarizedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Summarize feature error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
