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

// Check if a sender email matches any pattern in the list
// Patterns can be:
// - Full email: "user@example.com"
// - Domain: "@example.com" or "example.com"
function matchesSenderPattern(senderEmail: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) {
    console.log(`matchesSenderPattern: No patterns provided`);
    return false;
  }

  const emailLower = senderEmail.toLowerCase().trim();
  const domain = emailLower.split("@")[1] || "";

  console.log(`matchesSenderPattern: Checking ${emailLower} (domain: ${domain}) against patterns:`, patterns);

  for (const pattern of patterns) {
    const patternLower = pattern.toLowerCase().trim();

    // Full email match
    if (patternLower === emailLower) {
      console.log(`matchesSenderPattern: Full email match with ${patternLower}`);
      return true;
    }

    // Domain match (with or without @)
    const domainPattern = patternLower.startsWith("@") ? patternLower.slice(1) : patternLower;
    if (domain === domainPattern) {
      console.log(`matchesSenderPattern: Domain match with ${domainPattern}`);
      return true;
    }

    // Subdomain match (e.g., "@company.com" matches "mail.company.com")
    if (domain.endsWith("." + domainPattern)) {
      console.log(`matchesSenderPattern: Subdomain match with ${domainPattern}`);
      return true;
    }
  }

  console.log(`matchesSenderPattern: No match found`);
  return false;
}

// Check if sender should be processed based on filter settings
function shouldProcessSender(
  senderEmail: string,
  filterMode: string,
  allowedSenders: string[],
  blockedSenders: string[]
): boolean {
  // No filtering - process all
  if (filterMode === "all" || !filterMode) {
    // Still check blocked list even in "all" mode
    if (blockedSenders && blockedSenders.length > 0) {
      if (matchesSenderPattern(senderEmail, blockedSenders)) {
        return false;
      }
    }
    return true;
  }

  // Whitelist mode - only process if in allowed list
  if (filterMode === "whitelist") {
    if (!allowedSenders || allowedSenders.length === 0) {
      return false; // No whitelist configured, don't process anything
    }
    return matchesSenderPattern(senderEmail, allowedSenders);
  }

  // Blacklist mode - process unless in blocked list
  if (filterMode === "blacklist") {
    if (!blockedSenders || blockedSenders.length === 0) {
      return true; // No blacklist configured, process everything
    }
    return !matchesSenderPattern(senderEmail, blockedSenders);
  }

  return true;
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

    // Log filter settings from database
    console.log("=== ACCOUNT FILTER SETTINGS ===");
    console.log("filter_mode:", account.filter_mode, typeof account.filter_mode);
    console.log("allowed_senders:", account.allowed_senders, typeof account.allowed_senders);
    console.log("blocked_senders:", account.blocked_senders, typeof account.blocked_senders);
    console.log("================================");

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

        // Check sender filtering
        // Parse JSONB arrays (might come as string or array)
        let allowedSenders: string[] = [];
        let blockedSenders: string[] = [];

        try {
          if (typeof account.allowed_senders === 'string') {
            allowedSenders = JSON.parse(account.allowed_senders);
          } else if (Array.isArray(account.allowed_senders)) {
            allowedSenders = account.allowed_senders;
          }
        } catch (e) {
          console.error("Error parsing allowed_senders:", e);
        }

        try {
          if (typeof account.blocked_senders === 'string') {
            blockedSenders = JSON.parse(account.blocked_senders);
          } else if (Array.isArray(account.blocked_senders)) {
            blockedSenders = account.blocked_senders;
          }
        } catch (e) {
          console.error("Error parsing blocked_senders:", e);
        }

        // Determine effective filter mode
        // If allowed_senders has values, treat as whitelist regardless of filter_mode setting
        // (workaround for filter_mode not saving properly)
        let effectiveFilterMode = account.filter_mode || "all";
        if (allowedSenders.length > 0 && effectiveFilterMode === "all") {
          console.log("Auto-switching to whitelist mode because allowed_senders has values");
          effectiveFilterMode = "whitelist";
        }

        console.log(`Filter check for ${senderEmail}:`, {
          filterMode: effectiveFilterMode,
          allowedSenders,
          blockedSenders,
        });

        const shouldProcess = shouldProcessSender(
          senderEmail,
          effectiveFilterMode,
          allowedSenders,
          blockedSenders
        );

        console.log(`Should process ${senderEmail}: ${shouldProcess}`);

        if (!shouldProcess) {
          console.log(`Skipping email from ${senderEmail} - filtered out`);
          continue;
        }

        // Extract body
        let body = "";

        // Properly decode base64 with UTF-8 support
        const decodeBase64Utf8 = (base64: string): string => {
          try {
            // Convert URL-safe base64 to standard base64
            const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
            // Decode base64 to binary string
            const binaryString = atob(standardBase64);
            // Convert binary string to Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            // Decode as UTF-8
            return new TextDecoder("utf-8").decode(bytes);
          } catch (e) {
            console.error("Error decoding base64:", e);
            return "";
          }
        };

        const getBody = (payload: any): string => {
          if (payload.body?.data) {
            return decodeBase64Utf8(payload.body.data);
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
