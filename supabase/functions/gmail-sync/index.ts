import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  accountId: string;
  maxResults?: number;
  fromDate?: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  internalDate: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
    parts?: { mimeType: string; body?: { data?: string }; parts?: any[] }[];
  };
  snippet: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { accountId, maxResults = 50, fromDate }: SyncRequest = await req.json();

    if (!accountId) {
      throw new Error("accountId is required");
    }

    // Get the email account with OAuth tokens (with org validation)
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("organization_id", teamMember.organization_id)
      .single();

    if (accountError || !account) {
      throw new Error("Email account not found");
    }

    if (account.oauth_provider !== "google") {
      throw new Error("Account is not a Gmail account");
    }

    // Update status to syncing
    await supabase
      .from("email_accounts")
      .update({ status: "syncing", last_error: null })
      .eq("id", accountId);

    // Check if token needs refresh
    let accessToken = account.oauth_access_token;
    const tokenExpiry = new Date(account.oauth_token_expires_at);

    if (tokenExpiry <= new Date()) {
      console.log("Token expired, refreshing...");

      // Refresh the token
      const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
      const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth credentials not configured");
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: account.oauth_refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        await supabase
          .from("email_accounts")
          .update({ status: "error", last_error: "Token refresh failed - please reconnect" })
          .eq("id", accountId);
        throw new Error("Failed to refresh token");
      }

      const tokens = await tokenResponse.json();
      accessToken = tokens.access_token;
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase
        .from("email_accounts")
        .update({
          oauth_access_token: accessToken,
          oauth_token_expires_at: expiresAt,
        })
        .eq("id", accountId);
    }

    // Build Gmail API query
    let query = "in:inbox";
    if (fromDate) {
      const date = new Date(fromDate);
      const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      query += ` after:${formattedDate}`;
    }

    // List messages from Gmail
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", maxResults.toString());
    listUrl.searchParams.set("q", query);

    const listResponse = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error("Gmail API error:", errorText);

      if (listResponse.status === 401) {
        await supabase
          .from("email_accounts")
          .update({ status: "error", last_error: "Authorization failed - please reconnect" })
          .eq("id", accountId);
        throw new Error("Gmail authorization failed");
      }
      throw new Error(`Gmail API error: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const messages: GmailMessage[] = listData.messages || [];

    console.log(`Found ${messages.length} messages to process`);

    let newEmails = 0;
    let processedForAI = 0;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    for (const msg of messages) {
      try {
        // Check if we already have this message
        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("message_id", msg.id)
          .eq("organization_id", account.organization_id)
          .maybeSingle();

        if (existing) {
          continue; // Skip existing
        }

        // Fetch full message details
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!messageResponse.ok) {
          console.error(`Failed to fetch message ${msg.id}`);
          continue;
        }

        const messageDetail: GmailMessageDetail = await messageResponse.json();

        // Extract headers
        const headers = messageDetail.payload.headers.reduce((acc, h) => {
          acc[h.name.toLowerCase()] = h.value;
          return acc;
        }, {} as Record<string, string>);

        const subject = headers["subject"] || "(No Subject)";
        const from = headers["from"] || "";
        const date = headers["date"];

        // Parse sender
        const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from];
        const senderName = fromMatch[1]?.trim().replace(/^"|"$/g, "") || "";
        const senderEmail = fromMatch[2]?.trim() || from;

        // Extract body
        let body = "";
        const getBody = (payload: any): string => {
          if (payload.body?.data) {
            return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
          if (payload.parts) {
            // Prefer plain text
            const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
            if (textPart) return getBody(textPart);

            // Fallback to HTML
            const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
            if (htmlPart) {
              const html = getBody(htmlPart);
              return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            }

            // Check nested parts
            for (const part of payload.parts) {
              const nested = getBody(part);
              if (nested) return nested;
            }
          }
          return "";
        };

        body = getBody(messageDetail.payload) || messageDetail.snippet;

        // Parse date
        const receivedAt = date
          ? new Date(date).toISOString()
          : new Date(parseInt(messageDetail.internalDate)).toISOString();

        // Insert email
        const { data: newEmail, error: insertError } = await supabase
          .from("emails")
          .insert({
            organization_id: account.organization_id,
            email_account_id: account.id,
            message_id: msg.id,
            sender_email: senderEmail,
            sender_name: senderName,
            subject,
            body: body.substring(0, 50000), // Limit body size
            received_at: receivedAt,
            status: "pending",
            review_status: account.auto_create_records ? "approved" : "pending",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          continue;
        }

        newEmails++;
        console.log(`Inserted email: ${subject}`);

        // Process with AI if enabled
        if (newEmail && account.auto_categorize && OPENAI_API_KEY) {
          try {
            const processResponse = await fetch(`${supabaseUrl}/functions/v1/process-email`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ emailId: newEmail.id }),
            });

            if (processResponse.ok) {
              processedForAI++;
            }
          } catch (processError) {
            console.error("AI processing error:", processError);
          }
        }
      } catch (msgError) {
        console.error("Error processing message:", msgError);
      }
    }

    // Update account status
    await supabase
      .from("email_accounts")
      .update({
        status: "active",
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", accountId);

    console.log(`Sync complete: ${newEmails} new emails, ${processedForAI} processed with AI`);

    return new Response(
      JSON.stringify({
        success: true,
        newEmails,
        processedForAI,
        totalMessages: messages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Gmail sync error:", error);
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
