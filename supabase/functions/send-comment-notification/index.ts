import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
};

interface CommentNotificationRequest {
  commentId: string;
  entityType: "feedback" | "feature_request" | "ticket";
  entityId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { commentId, entityType, entityId } = (await req.json()) as CommentNotificationRequest;

    if (!commentId || !entityType || !entityId) {
      return new Response(JSON.stringify({ error: "commentId, entityType, and entityId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch comment details with author
    const { data: comment, error: commentError } = await supabaseClient
      .from("comments")
      .select(`
        id,
        content,
        organization_id,
        author:team_members!comments_author_id_fkey(id, name, auth_user_id)
      `)
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      console.error("Comment not found:", commentError);
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const author = comment.author as { id: string; name: string; auth_user_id: string } | null;

    // Fetch entity details based on type
    let entityTitle = "";
    let entityDisplayId = "";
    let entityUrl = "";

    if (entityType === "feedback") {
      const { data: feedback } = await supabaseClient
        .from("feedback")
        .select("title, display_id")
        .eq("id", entityId)
        .single();
      if (feedback) {
        entityTitle = feedback.title;
        entityDisplayId = feedback.display_id;
        entityUrl = `/feedback/${feedback.display_id}`;
      }
    } else if (entityType === "feature_request") {
      const { data: feature } = await supabaseClient
        .from("feature_requests")
        .select("title, display_id")
        .eq("id", entityId)
        .single();
      if (feature) {
        entityTitle = feature.title;
        entityDisplayId = feature.display_id;
        entityUrl = `/features/${feature.display_id}`;
      }
    } else if (entityType === "ticket") {
      const { data: ticket } = await supabaseClient
        .from("tickets")
        .select("title, display_id")
        .eq("id", entityId)
        .single();
      if (ticket) {
        entityTitle = ticket.title;
        entityDisplayId = ticket.display_id;
        entityUrl = `/tickets/${ticket.display_id}`;
      }
    }

    // Get organization details
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name, slug")
      .eq("id", comment.organization_id)
      .single();

    // Define helper variables early
    const entityTypeLabel = entityType === "feature_request" ? "Feature Request" :
                           entityType.charAt(0).toUpperCase() + entityType.slice(1);

    const truncatedContent = comment.content.length > 200
      ? comment.content.substring(0, 200) + "..."
      : comment.content;

    // Get all team members in the org to notify (excluding the comment author)
    const { data: teamMembers, error: membersError } = await supabaseClient
      .from("team_members")
      .select("id, name, auth_user_id, email_notifications_enabled, notification_preferences")
      .eq("organization_id", comment.organization_id)
      .neq("id", author?.id || "");

    if (membersError || !teamMembers || teamMembers.length === 0) {
      console.log("No team members to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No team members to notify" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create in-app notifications for all team members
    const notificationInserts = teamMembers.map(member => ({
      organization_id: comment.organization_id,
      recipient_id: member.id,
      type: "comment",
      title: `New comment on ${entityTypeLabel}`,
      message: `${author?.name || "Someone"} commented on ${entityDisplayId}: "${truncatedContent}"`,
      entity_type: entityType === "feature_request" ? "feature_request" : entityType,
      entity_id: entityId,
      entity_display_id: entityDisplayId,
      actor_id: author?.id || null,
    }));

    const { error: notifError } = await supabaseClient
      .from("notifications")
      .insert(notificationInserts);

    if (notifError) {
      console.error("Error creating in-app notifications:", notifError);
    }

    // Filter team members who have email notifications enabled
    const membersWithEmailEnabled = teamMembers.filter(m => {
      // Default to true if not set
      const emailEnabled = m.email_notifications_enabled !== false;
      // Check specific preference for comments
      const prefs = m.notification_preferences as { comments?: boolean } | null;
      const commentsEnabled = prefs?.comments !== false;
      return emailEnabled && commentsEnabled;
    });

    // Get email addresses for team members with notifications enabled
    const authUserIds = membersWithEmailEnabled.map(m => m.auth_user_id).filter(Boolean);

    if (authUserIds.length === 0) {
      console.log("No team members have email notifications enabled");
      return new Response(
        JSON.stringify({ success: true, message: "In-app notifications created, no email notifications to send" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch user emails" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailsToNotify = users.users
      .filter(u => authUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    if (emailsToNotify.length === 0) {
      console.log("No email addresses to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No email addresses to notify" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const appUrl = Deno.env.get("APP_URL") || "https://app.soluly.com";
    const fullEntityUrl = `${appUrl}/org/${org?.slug || ""}${entityUrl}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <img src="https://app.soluly.com/logo.png" alt="Soluly" style="height: 40px; width: auto; margin-bottom: 16px;" />
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">New Comment</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; margin: 0 0 24px 0; color: #4a4a4a;">
        <strong style="color: #1a1a1a;">${author?.name || "Someone"}</strong> commented on ${entityTypeLabel}:
      </p>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
          ${entityDisplayId}
        </p>
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">
          ${entityTitle}
        </p>
        <p style="margin: 0; font-size: 15px; color: #4a4a4a; white-space: pre-wrap; line-height: 1.5;">"${truncatedContent}"</p>
      </div>

      <div style="text-align: center;">
        <a href="${fullEntityUrl}"
           style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
          View ${entityTypeLabel}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 32px; background: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="font-size: 13px; color: #888; margin: 0;">
        You received this email because you're a member of ${org?.name || "the organization"}.
      </p>
    </div>
  </div>

  <p style="font-size: 12px; color: #999; text-align: center; margin-top: 24px;">
    <a href="https://soluly.com" style="color: #666; text-decoration: none;">Soluly</a>
  </p>
</body>
</html>
    `;

    const emailText = `
New Comment on ${entityTypeLabel}

${author?.name || "Someone"} commented on ${entityDisplayId} - ${entityTitle}:

"${truncatedContent}"

View it here: ${fullEntityUrl}

---
You received this email because you're a member of ${org?.name || "the organization"}.
    `;

    // Send email to all team members (batch send)
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Soluly <noreply@soluly.com>",
        to: emailsToNotify,
        subject: `New comment on ${entityDisplayId}: ${entityTitle}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id, notifiedCount: emailsToNotify.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
