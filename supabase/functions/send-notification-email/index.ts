import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  notificationId: string;
}

interface NotificationRecord {
  id: string;
  organization_id: string;
  recipient_id: string;
  type: "comment" | "ticket" | "feature_request" | "feedback" | "mention" | "assignment";
  title: string;
  message: string;
  entity_type: "ticket" | "feature_request" | "feedback" | "project" | null;
  entity_id: string | null;
  entity_display_id: string | null;
  actor_id: string | null;
  created_at: string;
}

function getNotificationPreferenceKey(type: string): string {
  switch (type) {
    case "comment":
    case "mention":
      return "comments";
    case "ticket":
    case "assignment":
      return "tickets";
    case "feature_request":
      return "features";
    case "feedback":
      return "feedback";
    default:
      return "comments";
  }
}

function getEntityUrl(entityType: string | null, displayId: string | null): string {
  if (!entityType || !displayId) return "";

  switch (entityType) {
    case "ticket":
      return `/tickets/${displayId}`;
    case "feature_request":
      return `/features/${displayId}`;
    case "feedback":
      return `/feedback/${displayId}`;
    case "project":
      return `/projects/${displayId}`;
    default:
      return "";
  }
}

function getEntityTypeLabel(entityType: string | null): string {
  if (!entityType) return "Item";

  switch (entityType) {
    case "ticket":
      return "Ticket";
    case "feature_request":
      return "Feature Request";
    case "feedback":
      return "Feedback";
    case "project":
      return "Project";
    default:
      return "Item";
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "comment":
      return "💬";
    case "mention":
      return "@";
    case "ticket":
      return "🎫";
    case "feature_request":
      return "✨";
    case "feedback":
      return "📝";
    case "assignment":
      return "👤";
    default:
      return "🔔";
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case "comment":
      return "#3b82f6"; // blue
    case "mention":
      return "#8b5cf6"; // purple
    case "ticket":
      return "#f59e0b"; // amber
    case "feature_request":
      return "#10b981"; // emerald
    case "feedback":
      return "#6366f1"; // indigo
    case "assignment":
      return "#ec4899"; // pink
    default:
      return "#6b7280"; // gray
  }
}

function generateEmailHtml(
  notification: NotificationRecord,
  actorName: string | null,
  orgName: string | null,
  entityTitle: string | null,
  fullEntityUrl: string
): string {
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  const entityTypeLabel = getEntityTypeLabel(notification.entity_type);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <img src="https://app.soluly.com/logo.png" alt="Soluly" style="height: 40px; width: auto; margin-bottom: 16px;" />
      <div style="display: inline-block; background: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; margin-bottom: 12px;">
        ${icon} ${notification.type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">${notification.title}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; margin: 0 0 24px 0; color: #4a4a4a;">
        ${notification.message}
      </p>

      ${entityTitle && notification.entity_display_id ? `
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 0 0 24px 0; border-left: 3px solid ${color};">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
          ${entityTypeLabel}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #888;">
          ${notification.entity_display_id}
        </p>
        <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">
          ${entityTitle}
        </p>
      </div>
      ` : ""}

      ${fullEntityUrl ? `
      <div style="text-align: center;">
        <a href="${fullEntityUrl}"
           style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
          View ${entityTypeLabel}
        </a>
      </div>
      ` : ""}
    </div>

    <!-- Footer -->
    <div style="padding: 24px 32px; background: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="font-size: 13px; color: #888; margin: 0;">
        You received this email because you're a member of ${orgName || "the organization"}.
      </p>
      <p style="font-size: 12px; color: #aaa; margin: 8px 0 0 0;">
        Manage your notification preferences in your account settings.
      </p>
    </div>
  </div>

  <p style="font-size: 12px; color: #999; text-align: center; margin-top: 24px;">
    <a href="https://soluly.com" style="color: #666; text-decoration: none;">Soluly</a>
  </p>
</body>
</html>
  `;
}

function generateEmailText(
  notification: NotificationRecord,
  actorName: string | null,
  orgName: string | null,
  entityTitle: string | null,
  fullEntityUrl: string
): string {
  const entityTypeLabel = getEntityTypeLabel(notification.entity_type);

  return `
${notification.title}

${notification.message}

${entityTitle && notification.entity_display_id ? `
${entityTypeLabel}: ${notification.entity_display_id}
${entityTitle}
` : ""}
${fullEntityUrl ? `View it here: ${fullEntityUrl}` : ""}

---
You received this email because you're a member of ${orgName || "the organization"}.
Manage your notification preferences in your account settings.
  `.trim();
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

    const { notificationId } = (await req.json()) as NotificationEmailRequest;

    if (!notificationId) {
      return new Response(JSON.stringify({ error: "notificationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch notification with related data
    const { data: notification, error: notifError } = await supabaseClient
      .from("notifications")
      .select(`
        *,
        actor:team_members!notifications_actor_id_fkey(id, name),
        recipient:team_members!notifications_recipient_id_fkey(
          id,
          name,
          auth_user_id,
          email_notifications_enabled,
          notification_preferences
        ),
        organization:organizations!notifications_organization_id_fkey(id, name, slug)
      `)
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      console.error("Notification not found:", notifError);
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipient = notification.recipient as {
      id: string;
      name: string;
      auth_user_id: string;
      email_notifications_enabled: boolean;
      notification_preferences: Record<string, boolean> | null;
    };
    const actor = notification.actor as { id: string; name: string } | null;
    const org = notification.organization as { id: string; name: string; slug: string };

    // Check if recipient has email notifications enabled
    const emailEnabled = recipient.email_notifications_enabled !== false;
    const prefKey = getNotificationPreferenceKey(notification.type);
    const prefs = recipient.notification_preferences || {};
    const typeEnabled = prefs[prefKey] !== false;

    if (!emailEnabled || !typeEnabled) {
      console.log(`Email notifications disabled for recipient ${recipient.id} (emailEnabled: ${emailEnabled}, typeEnabled: ${typeEnabled})`);
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications disabled for this user/type" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get recipient's email address
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(
      recipient.auth_user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Could not get user email:", userError);
      return new Response(JSON.stringify({ error: "Could not get user email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmail = userData.user.email;

    // Fetch entity title if applicable
    let entityTitle: string | null = null;
    if (notification.entity_type && notification.entity_id) {
      let table = "";
      switch (notification.entity_type) {
        case "ticket":
          table = "tickets";
          break;
        case "feature_request":
          table = "feature_requests";
          break;
        case "feedback":
          table = "feedback";
          break;
        case "project":
          table = "projects";
          break;
      }

      if (table) {
        const { data: entity } = await supabaseClient
          .from(table)
          .select("title, name")
          .eq("id", notification.entity_id)
          .single();

        if (entity) {
          entityTitle = (entity as { title?: string; name?: string }).title ||
                       (entity as { title?: string; name?: string }).name || null;
        }
      }
    }

    // Build full URL
    const appUrl = Deno.env.get("APP_URL") || "https://app.soluly.com";
    const entityPath = getEntityUrl(notification.entity_type, notification.entity_display_id);
    const fullEntityUrl = entityPath ? `${appUrl}/org/${org.slug}${entityPath}` : "";

    // Generate email content
    const emailHtml = generateEmailHtml(
      notification as NotificationRecord,
      actor?.name || null,
      org.name,
      entityTitle,
      fullEntityUrl
    );

    const emailText = generateEmailText(
      notification as NotificationRecord,
      actor?.name || null,
      org.name,
      entityTitle,
      fullEntityUrl
    );

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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Soluly <noreply@soluly.com>",
        to: [recipientEmail],
        subject: notification.title,
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
      JSON.stringify({ success: true, emailId: emailResult.id }),
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
