import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = "comment" | "ticket" | "feature_request" | "feedback" | "mention" | "assignment";
type EntityType = "ticket" | "feature_request" | "feedback" | "project";

interface CreateNotificationRequest {
  organizationId: string;
  recipientIds?: string[]; // Optional: specific team member IDs to notify (for assignments)
  projectIds?: string[]; // Optional: project IDs to filter recipients by access
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
  entityDisplayId?: string;
  actorId?: string; // The team member who triggered the notification
  excludeActorFromNotification?: boolean; // Default true - don't notify the person who triggered it
}

// Helper to check if a team member has access to any of the given projects
function hasProjectAccess(
  memberAllowedProjectIds: string[] | null,
  projectIds: string[]
): boolean {
  // If member has null allowed_project_ids, they have access to all projects
  if (memberAllowedProjectIds === null) return true;

  // If member has empty array, they have no project access
  if (memberAllowedProjectIds.length === 0) return false;

  // Check if member has access to at least one of the specified projects
  return projectIds.some(projectId => memberAllowedProjectIds.includes(projectId));
}

function getNotificationPreferenceKey(type: NotificationType): string {
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

function getEntityUrl(entityType: EntityType | undefined, displayId: string | undefined): string {
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

function getEntityTypeLabel(entityType: EntityType | undefined): string {
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

function getNotificationIcon(type: NotificationType): string {
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

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "comment":
      return "#3b82f6";
    case "mention":
      return "#8b5cf6";
    case "ticket":
      return "#f59e0b";
    case "feature_request":
      return "#10b981";
    case "feedback":
      return "#6366f1";
    case "assignment":
      return "#ec4899";
    default:
      return "#6b7280";
  }
}

function generateEmailHtml(
  type: NotificationType,
  title: string,
  message: string,
  entityType: EntityType | undefined,
  entityDisplayId: string | undefined,
  entityTitle: string | null,
  fullEntityUrl: string,
  orgName: string
): string {
  const icon = getNotificationIcon(type);
  const color = getNotificationColor(type);
  const entityTypeLabel = getEntityTypeLabel(entityType);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fafafa;">
  <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <img src="https://app.soluly.com/logo.png" alt="Soluly" style="height: 40px; width: auto; margin-bottom: 16px;" />
      <div style="display: inline-block; background: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; margin-bottom: 12px;">
        ${icon} ${type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">${title}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; margin: 0 0 24px 0; color: #4a4a4a;">
        ${message}
      </p>

      ${entityTitle && entityDisplayId ? `
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 0 0 24px 0; border-left: 3px solid ${color};">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
          ${entityTypeLabel}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #888;">
          ${entityDisplayId}
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
        You received this email because you're a member of ${orgName}.
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
  title: string,
  message: string,
  entityType: EntityType | undefined,
  entityDisplayId: string | undefined,
  entityTitle: string | null,
  fullEntityUrl: string,
  orgName: string
): string {
  const entityTypeLabel = getEntityTypeLabel(entityType);

  return `
${title}

${message}

${entityTitle && entityDisplayId ? `
${entityTypeLabel}: ${entityDisplayId}
${entityTitle}
` : ""}
${fullEntityUrl ? `View it here: ${fullEntityUrl}` : ""}

---
You received this email because you're a member of ${orgName}.
Manage your notification preferences in your account settings.
  `.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
  const isServiceRoleCall = token === serviceRoleKey;

  // If not a service role call, validate user authentication
  if (!isServiceRoleCall) {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's organization
    const { data: teamMember, error: memberError } = await supabaseClient
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
    const {
      organizationId,
      recipientIds,
      projectIds,
      type,
      title,
      message,
      entityType,
      entityId,
      entityDisplayId,
      actorId,
      excludeActorFromNotification = true,
    } = (await req.json()) as CreateNotificationRequest;

    if (!organizationId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: "organizationId, type, title, and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If user call, verify they can only create notifications for their own org
    if (!isServiceRoleCall && userOrgId !== organizationId) {
      return new Response(
        JSON.stringify({ error: "Access denied: cannot create notifications for other organizations" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch organization details
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name, slug")
      .eq("id", organizationId)
      .single();

    // Fetch all team members in the organization with their project access
    const { data: allTeamMembers, error: membersError } = await supabaseClient
      .from("team_members")
      .select("id, name, auth_user_id, email_notifications_enabled, notification_preferences, allowed_project_ids")
      .eq("organization_id", organizationId);

    if (membersError || !allTeamMembers) {
      console.error("Error fetching team members:", membersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch team members" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine final recipient IDs based on project access
    let eligibleRecipients = allTeamMembers;

    // If specific recipientIds are provided (e.g., for assignments), use those
    if (recipientIds && recipientIds.length > 0) {
      eligibleRecipients = allTeamMembers.filter(m => recipientIds.includes(m.id));
    }
    // Otherwise, if projectIds are provided, filter by project access
    else if (projectIds && projectIds.length > 0) {
      eligibleRecipients = allTeamMembers.filter(m =>
        hasProjectAccess(m.allowed_project_ids, projectIds)
      );
    }
    // If neither is provided, all team members are eligible (org-wide notification)

    // Filter out the actor if requested
    if (excludeActorFromNotification && actorId) {
      eligibleRecipients = eligibleRecipients.filter(m => m.id !== actorId);
    }

    if (eligibleRecipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No recipients after filtering", notificationCount: 0, emailCount: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const finalRecipientIds = eligibleRecipients.map(m => m.id);

    // Create in-app notifications for all eligible recipients
    const notificationInserts = finalRecipientIds.map(recipientId => ({
      organization_id: organizationId,
      recipient_id: recipientId,
      type,
      title,
      message,
      entity_type: entityType || null,
      entity_id: entityId || null,
      entity_display_id: entityDisplayId || null,
      actor_id: actorId || null,
    }));

    const { data: notifications, error: notifError } = await supabaseClient
      .from("notifications")
      .insert(notificationInserts)
      .select("id");

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      return new Response(
        JSON.stringify({ error: "Failed to create notifications", details: notifError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the already fetched eligible recipients for email filtering
    const recipients = eligibleRecipients;

    // Filter recipients who have email notifications enabled
    const prefKey = getNotificationPreferenceKey(type);
    const recipientsWithEmailEnabled = recipients.filter(r => {
      const emailEnabled = r.email_notifications_enabled !== false;
      const prefs = r.notification_preferences as Record<string, boolean> | null;
      const typeEnabled = prefs?.[prefKey] !== false;
      return emailEnabled && typeEnabled;
    });

    if (recipientsWithEmailEnabled.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created, no emails to send (all users have email disabled)",
          notificationCount: notifications?.length || 0,
          emailCount: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get email addresses
    const authUserIds = recipientsWithEmailEnabled.map(r => r.auth_user_id).filter(Boolean);
    const { data: users } = await supabaseClient.auth.admin.listUsers();

    if (!users) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created but could not fetch user emails",
          notificationCount: notifications?.length || 0,
          emailCount: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailsToNotify = users.users
      .filter(u => authUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    if (emailsToNotify.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created, no valid emails found",
          notificationCount: notifications?.length || 0,
          emailCount: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch entity title if applicable
    let entityTitle: string | null = null;
    if (entityType && entityId) {
      let table = "";
      switch (entityType) {
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
          .eq("id", entityId)
          .single();

        if (entity) {
          entityTitle = (entity as { title?: string; name?: string }).title ||
                       (entity as { title?: string; name?: string }).name || null;
        }
      }
    }

    // Build full URL
    const appUrl = Deno.env.get("APP_URL") || "https://app.soluly.com";
    const entityPath = getEntityUrl(entityType, entityDisplayId);
    const fullEntityUrl = entityPath ? `${appUrl}/org/${org?.slug || ""}${entityPath}` : "";

    // Generate email content
    const emailHtml = generateEmailHtml(
      type,
      title,
      message,
      entityType,
      entityDisplayId,
      entityTitle,
      fullEntityUrl,
      org?.name || "the organization"
    );

    const emailText = generateEmailText(
      title,
      message,
      entityType,
      entityDisplayId,
      entityTitle,
      fullEntityUrl,
      org?.name || "the organization"
    );

    // Send email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created but email service not configured",
          notificationCount: notifications?.length || 0,
          emailCount: 0,
        }),
        {
          status: 200,
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
        to: emailsToNotify,
        subject: title,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notifications created but email sending failed",
          notificationCount: notifications?.length || 0,
          emailCount: 0,
          emailError: errorData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        notificationCount: notifications?.length || 0,
        emailCount: emailsToNotify.length,
        emailId: emailResult.id,
      }),
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
