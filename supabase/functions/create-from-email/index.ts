import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateFromEmailRequest {
  emailId: string;
  category: 'ticket' | 'feature_request' | 'customer_quote' | 'feedback';
  title: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  reviewedBy?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const {
      emailId,
      category,
      title,
      priority = 'medium',
      projectId,
      reviewedBy,
    }: CreateFromEmailRequest = await req.json();

    console.log("Creating record from email:", { emailId, category, title });

    // Get email details
    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (emailError || !email) {
      throw new Error("Email not found");
    }

    let recordId: string | null = null;
    let linkedColumn: string | null = null;

    // Create the appropriate record based on category
    switch (category) {
      case 'ticket': {
        // Generate display_id for ticket
        const { data: maxTicket } = await supabase
          .from("tickets")
          .select("display_id")
          .eq("organization_id", email.organization_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNum = 1;
        if (maxTicket?.display_id) {
          const match = maxTicket.display_id.match(/TKT-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            organization_id: email.organization_id,
            display_id: `TKT-${String(nextNum).padStart(4, '0')}`,
            title: title,
            description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${email.body}`,
            status: "open",
            priority: priority,
            project_id: projectId || null,
            source_email_id: emailId,
          })
          .select("id")
          .single();

        if (ticketError) throw ticketError;
        recordId = ticket?.id || null;
        linkedColumn = "linked_ticket_id";
        break;
      }

      case 'feature_request': {
        // Generate display_id for feature request
        const { data: maxFeature } = await supabase
          .from("feature_requests")
          .select("display_id")
          .eq("organization_id", email.organization_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNum = 1;
        if (maxFeature?.display_id) {
          const match = maxFeature.display_id.match(/FTR-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        const { data: feature, error: featureError } = await supabase
          .from("feature_requests")
          .insert({
            organization_id: email.organization_id,
            display_id: `FTR-${String(nextNum).padStart(4, '0')}`,
            title: title,
            description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${email.body}`,
            status: "pending",
            priority: priority,
            project_id: projectId || null,
            requester_email: email.sender_email,
            requester_name: email.sender_name,
          })
          .select("id")
          .single();

        if (featureError) throw featureError;
        recordId = feature?.id || null;
        linkedColumn = "linked_feature_request_id";
        break;
      }

      case 'customer_quote': {
        // Generate display_id for quote
        const { data: maxQuote } = await supabase
          .from("quotes")
          .select("display_id")
          .eq("organization_id", email.organization_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNum = 1;
        if (maxQuote?.display_id) {
          const match = maxQuote.display_id.match(/QTE-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        const { data: quote, error: quoteError } = await supabase
          .from("quotes")
          .insert({
            organization_id: email.organization_id,
            display_id: `QTE-${String(nextNum).padStart(4, '0')}`,
            title: title,
            description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${email.body}`,
            status: "pending",
            project_id: projectId || null,
            client_email: email.sender_email,
            client_name: email.sender_name,
          })
          .select("id")
          .single();

        if (quoteError) throw quoteError;
        recordId = quote?.id || null;
        linkedColumn = "linked_quote_id";
        break;
      }

      case 'feedback': {
        // Generate display_id for feedback
        const { data: maxFeedback } = await supabase
          .from("feedback")
          .select("display_id")
          .eq("organization_id", email.organization_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNum = 1;
        if (maxFeedback?.display_id) {
          const match = maxFeedback.display_id.match(/FBK-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        // Determine sentiment from extracted_data if available
        const sentiment = email.extracted_data?.sentiment || 'neutral';

        const { data: feedback, error: feedbackError } = await supabase
          .from("feedback")
          .insert({
            organization_id: email.organization_id,
            display_id: `FBK-${String(nextNum).padStart(4, '0')}`,
            title: title,
            content: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${email.body}`,
            status: "new",
            sentiment: sentiment,
            project_id: projectId || null,
            submitter_email: email.sender_email,
            submitter_name: email.sender_name,
          })
          .select("id")
          .single();

        if (feedbackError) throw feedbackError;
        recordId = feedback?.id || null;
        linkedColumn = "linked_feedback_id";
        break;
      }
    }

    // Update email with link to created record
    if (recordId && linkedColumn) {
      const updateData: Record<string, any> = {
        [linkedColumn]: recordId,
        review_status: "approved",
        reviewed_at: new Date().toISOString(),
      };

      if (projectId) {
        updateData.linked_project_id = projectId;
      }

      if (reviewedBy) {
        updateData.reviewed_by = reviewedBy;
      }

      await supabase
        .from("emails")
        .update(updateData)
        .eq("id", emailId);
    }

    return new Response(JSON.stringify({
      success: true,
      recordId,
      category,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating from email:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
