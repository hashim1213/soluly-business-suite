import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

const CSRF_HEADER = 'x-csrf-token';

// Validate CSRF token format (64-character hex string)
function validateCsrfTokenFormat(token: string | null): boolean {
  if (!token || token.length !== 64) return false;
  return /^[0-9a-f]+$/i.test(token);
}

interface CreateFromEmailRequest {
  emailId: string;
  category: 'ticket' | 'feature_request' | 'customer_quote' | 'feedback';
  title: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  reviewedBy?: string;
}

// Truncate description to prevent UI overflow issues
function truncateDescription(body: string, maxLength: number = 2000): string {
  if (!body) return "";
  if (body.length <= maxLength) return body;
  return body.substring(0, maxLength) + "\n\n[Content truncated - see original email for full text]";
}

serve(async (req) => {
  console.log("create-from-email called");
  console.log("Method:", req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Log all headers for debugging
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')
      ? `${value.substring(0, 20)}...`
      : value;
  });
  console.log("Headers:", JSON.stringify(headers));

  // Validate CSRF token for state-changing requests
  const csrfToken = req.headers.get(CSRF_HEADER) || req.headers.get('X-CSRF-Token');
  console.log("CSRF Token present:", !!csrfToken, "Length:", csrfToken?.length);

  if (!validateCsrfTokenFormat(csrfToken)) {
    console.log("CSRF validation failed");
    return new Response(JSON.stringify({ error: "Invalid or missing CSRF token" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("CSRF validation passed");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify user authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
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

    // Get email details (with org validation)
    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .eq("organization_id", teamMember.organization_id)
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
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNum = 1;
        if (maxTicket?.display_id) {
          const match = maxTicket.display_id.match(/TKT-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }

        const emailBody = truncateDescription(email.body);
        const ticketData = {
          organization_id: email.organization_id,
          display_id: `TKT-${String(nextNum).padStart(4, '0')}`,
          title: title,
          description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${emailBody}`,
          status: "open",
          priority: priority,
          project_id: projectId || null,
        };

        console.log("Creating ticket with data:", ticketData);

        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .insert(ticketData)
          .select("id")
          .single();

        if (ticketError) {
          console.error("Ticket creation error:", ticketError);
          throw ticketError;
        }

        console.log("Ticket created:", ticket);
        recordId = ticket?.id || null;
        linkedColumn = "linked_ticket_id";
        break;
      }

      case 'feature_request': {
        // Create a ticket with category "feature" instead of a separate feature request
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

        const featureEmailBody = truncateDescription(email.body);
        const featureTicketData = {
          organization_id: email.organization_id,
          display_id: `TKT-${String(nextNum).padStart(4, '0')}`,
          title: title,
          description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${featureEmailBody}`,
          status: "open",
          priority: priority,
          category: "feature",
          project_id: projectId || null,
        };

        console.log("Creating feature ticket with data:", featureTicketData);

        const { data: featureTicket, error: featureError } = await supabase
          .from("tickets")
          .insert(featureTicketData)
          .select("id")
          .single();

        if (featureError) {
          console.error("Feature ticket creation error:", featureError);
          throw featureError;
        }

        console.log("Feature ticket created:", featureTicket);
        recordId = featureTicket?.id || null;
        linkedColumn = "linked_ticket_id";
        break;
      }

      case 'customer_quote': {
        // Create a ticket with category "quote"
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

        const quoteEmailBody = truncateDescription(email.body);
        const quoteTicketData = {
          organization_id: email.organization_id,
          display_id: `TKT-${String(nextNum).padStart(4, '0')}`,
          title: title,
          description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${quoteEmailBody}`,
          status: "open",
          priority: priority,
          category: "quote",
          project_id: projectId || null,
        };

        console.log("Creating quote ticket with data:", quoteTicketData);

        const { data: quoteTicket, error: quoteError } = await supabase
          .from("tickets")
          .insert(quoteTicketData)
          .select("id")
          .single();

        if (quoteError) {
          console.error("Quote ticket creation error:", quoteError);
          throw quoteError;
        }

        console.log("Quote ticket created:", quoteTicket);
        recordId = quoteTicket?.id || null;
        linkedColumn = "linked_ticket_id";
        break;
      }

      case 'feedback': {
        // Create a ticket with category "feedback"
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

        const feedbackEmailBody = truncateDescription(email.body);
        const feedbackTicketData = {
          organization_id: email.organization_id,
          display_id: `TKT-${String(nextNum).padStart(4, '0')}`,
          title: title,
          description: `**From Email:** ${email.sender_name || email.sender_email}\n**Subject:** ${email.subject}\n\n${feedbackEmailBody}`,
          status: "open",
          priority: priority,
          category: "feedback",
          project_id: projectId || null,
        };

        console.log("Creating feedback ticket with data:", feedbackTicketData);

        const { data: feedbackTicket, error: feedbackError } = await supabase
          .from("tickets")
          .insert(feedbackTicketData)
          .select("id")
          .single();

        if (feedbackError) {
          console.error("Feedback ticket creation error:", feedbackError);
          throw feedbackError;
        }

        console.log("Feedback ticket created:", feedbackTicket);
        recordId = feedbackTicket?.id || null;
        linkedColumn = "linked_ticket_id";
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
