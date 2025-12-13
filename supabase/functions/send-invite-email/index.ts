import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
};

const CSRF_HEADER = 'x-csrf-token';

// Validate CSRF token format (64-character hex string)
function validateCsrfTokenFormat(token: string | null): boolean {
  if (!token || token.length !== 64) return false;
  return /^[0-9a-f]+$/i.test(token);
}

interface InviteEmailRequest {
  invitationId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate CSRF token for state-changing requests
  const csrfToken = req.headers.get(CSRF_HEADER);
  if (!validateCsrfTokenFormat(csrfToken)) {
    return new Response(JSON.stringify({ error: "Invalid or missing CSRF token" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { invitationId } = (await req.json()) as InviteEmailRequest;

    if (!invitationId) {
      return new Response(JSON.stringify({ error: "invitationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invitation details
    const { data: invitation, error: invError } = await supabaseClient
      .from("invitations")
      .select(`
        id,
        email,
        token,
        expires_at,
        organization:organizations(name, slug),
        role:roles(name),
        inviter:team_members!invitations_invited_by_fkey(name)
      `)
      .eq("id", invitationId)
      .is("accepted_at", null)
      .single();

    if (invError || !invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const org = invitation.organization as { name: string; slug: string } | null;
    const role = invitation.role as { name: string } | null;
    const inviter = invitation.inviter as { name: string } | null;

    // Build invite URL
    const appUrl = Deno.env.get("APP_URL") || "https://app.soluly.com";
    const inviteUrl = `${appUrl}/invite/${invitation.token}`;

    // Format expiry date
    const expiryDate = new Date(invitation.expires_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${inviter?.name ? `<strong>${inviter.name}</strong> has` : "You've been"} invited you to join
      <strong>${org?.name || "an organization"}</strong> on Soluly.
    </p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Organization:</strong> ${org?.name || "N/A"}</p>
      <p style="margin: 0 0 10px 0;"><strong>Your Role:</strong> ${role?.name || "Team Member"}</p>
      <p style="margin: 0;"><strong>Expires:</strong> ${expiryDate}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 25px;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; word-break: break-all; color: #667eea;">
      ${inviteUrl}
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.<br>
      This invitation will expire on ${expiryDate}.
    </p>
  </div>

  <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
    Powered by <a href="https://soluly.com" style="color: #667eea;">Soluly</a>
  </p>
</body>
</html>
    `;

    const emailText = `
You're Invited to ${org?.name || "an organization"}!

${inviter?.name ? `${inviter.name} has` : "You've been"} invited you to join ${org?.name || "an organization"} on Soluly.

Organization: ${org?.name || "N/A"}
Your Role: ${role?.name || "Team Member"}
Expires: ${expiryDate}

Accept your invitation by visiting:
${inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Soluly <noreply@soluly.com>",
        to: [invitation.email],
        subject: `You're invited to join ${org?.name || "an organization"} on Soluly`,
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
