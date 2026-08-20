import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPOSIO_BASE = "https://backend.composio.dev/api/v3.1";

// Email providers exposed to the UI. Slugs are Composio toolkit slugs.
const EMAIL_PROVIDERS = [
  { slug: "gmail", name: "Gmail" },
  { slug: "outlook", name: "Outlook" },
];

interface ComposioRequest {
  action: "list_providers" | "connect" | "finalize" | "sync" | "disconnect";
  toolkit?: string;
  callbackUrl?: string;
  connectedAccountId?: string;
  accountId?: string;
  maxResults?: number;
  fromDate?: string;
}

async function composioFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${COMPOSIO_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message || body?.message || `Composio API error ${res.status}`;
    const requestId = body?.error?.request_id;
    throw new Error(requestId ? `${message} (request_id: ${requestId})` : message);
  }
  return body;
}

// Find or create a Composio-managed auth config for a toolkit
async function getAuthConfigId(toolkit: string, apiKey: string): Promise<string> {
  const list = await composioFetch(`/auth_configs?toolkit_slug=${toolkit}`, apiKey);
  const existing = (list?.items || []).find(
    (c: any) => c.status !== "DISABLED" && (c.toolkit?.slug === toolkit || c.toolkit === toolkit)
  );
  if (existing?.id) return existing.id;

  const created = await composioFetch(`/auth_configs`, apiKey, {
    method: "POST",
    body: JSON.stringify({
      toolkit: { slug: toolkit },
      auth_config: { type: "use_composio_managed_auth" },
    }),
  });
  return created.auth_config.id;
}

// --- sender filter helpers (same behavior as gmail-sync) ---
function matchesSenderPattern(senderEmail: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  const emailLower = senderEmail.toLowerCase().trim();
  const domain = emailLower.split("@")[1] || "";
  for (const pattern of patterns) {
    const patternLower = pattern.toLowerCase().trim();
    if (patternLower === emailLower) return true;
    const domainPattern = patternLower.startsWith("@") ? patternLower.slice(1) : patternLower;
    if (domain === domainPattern) return true;
    if (domain.endsWith("." + domainPattern)) return true;
  }
  return false;
}

function shouldProcessSender(
  senderEmail: string,
  filterMode: string,
  allowedSenders: string[],
  blockedSenders: string[]
): boolean {
  if (filterMode === "whitelist") {
    if (!allowedSenders?.length) return false;
    return matchesSenderPattern(senderEmail, allowedSenders);
  }
  if (blockedSenders?.length && matchesSenderPattern(senderEmail, blockedSenders)) {
    return false;
  }
  return true;
}

function parseJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Normalized message shape used for inserting into the emails table
interface NormalizedEmail {
  messageId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  body: string;
  receivedAt: string;
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  return { name: "", email: from.trim() };
}

function normalizeGmailMessages(data: any): NormalizedEmail[] {
  return (data?.messages || []).map((m: any) => {
    const { name, email } = parseFromHeader(m.sender || "");
    return {
      messageId: m.messageId,
      senderEmail: email,
      senderName: name,
      subject: m.subject || "(No Subject)",
      body: m.messageText || m.preview?.body || m.preview || "",
      receivedAt: m.messageTimestamp
        ? new Date(m.messageTimestamp).toISOString()
        : new Date().toISOString(),
    };
  });
}

function normalizeOutlookMessages(data: any): NormalizedEmail[] {
  return (data?.value || []).map((m: any) => {
    const addr = m.from?.emailAddress || m.sender?.emailAddress || {};
    let body = m.body?.content || m.bodyPreview || "";
    if (m.body?.contentType === "html") {
      body = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    return {
      messageId: m.id,
      senderEmail: addr.address || "",
      senderName: addr.name || "",
      subject: m.subject || "(No Subject)",
      body,
      receivedAt: m.receivedDateTime || m.sentDateTime || new Date().toISOString(),
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
    if (!COMPOSIO_API_KEY) {
      throw new Error("COMPOSIO_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate the caller and resolve their organization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: teamMember } = await supabase
      .from("team_members")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!teamMember) {
      return new Response(JSON.stringify({ success: false, error: "User is not a member of any organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = teamMember.organization_id;
    // Connections are org-scoped, matching the email_accounts table
    const composioUserId = `org_${organizationId}`;

    const body: ComposioRequest = await req.json();

    // --- List available providers ---
    if (body.action === "list_providers") {
      return new Response(JSON.stringify({ success: true, providers: EMAIL_PROVIDERS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Start a connection: return a Composio Connect Link ---
    if (body.action === "connect") {
      const toolkit = body.toolkit;
      if (!toolkit || !EMAIL_PROVIDERS.some((p) => p.slug === toolkit)) {
        throw new Error(`Unsupported provider: ${toolkit}`);
      }

      const authConfigId = await getAuthConfigId(toolkit, COMPOSIO_API_KEY);
      const link = await composioFetch(`/connected_accounts/link`, COMPOSIO_API_KEY, {
        method: "POST",
        body: JSON.stringify({
          auth_config_id: authConfigId,
          user_id: composioUserId,
          ...(body.callbackUrl ? { callback_url: body.callbackUrl } : {}),
        }),
      });

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: link.redirect_url,
          connectedAccountId: link.connected_account_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Finalize: after the user authorizes, register the email account ---
    if (body.action === "finalize") {
      if (!body.connectedAccountId) throw new Error("connectedAccountId is required");

      const account = await composioFetch(
        `/connected_accounts/${body.connectedAccountId}`,
        COMPOSIO_API_KEY
      );

      if (account.user_id !== composioUserId) {
        throw new Error("Connected account does not belong to this organization");
      }
      if (account.status !== "ACTIVE") {
        throw new Error(`Connection is not active (status: ${account.status})`);
      }

      const toolkit: string = account.toolkit?.slug || account.toolkit;

      // Fetch the mailbox address from the provider
      const profileTool = toolkit === "gmail" ? "GMAIL_GET_PROFILE" : "OUTLOOK_GET_PROFILE";
      const profile = await composioFetch(`/tools/execute/${profileTool}`, COMPOSIO_API_KEY, {
        method: "POST",
        body: JSON.stringify({
          connected_account_id: body.connectedAccountId,
          user_id: composioUserId,
          arguments: {},
        }),
      });
      if (!profile.successful) {
        throw new Error(profile.error || "Failed to fetch mailbox profile");
      }

      const emailAddress =
        profile.data?.emailAddress ||
        profile.data?.response_data?.emailAddress ||
        profile.data?.mail ||
        profile.data?.userPrincipalName ||
        profile.data?.email;
      if (!emailAddress) {
        throw new Error("Could not determine mailbox email address");
      }

      const { data: existing } = await supabase
        .from("email_accounts")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("email_address", emailAddress)
        .maybeSingle();

      const accountFields = {
        display_name: emailAddress,
        oauth_provider: "composio",
        provider_slug: toolkit,
        composio_connected_account_id: body.connectedAccountId,
        status: "active",
        last_error: null,
      };

      let accountId: string;
      if (existing) {
        const { error: updateError } = await supabase
          .from("email_accounts")
          .update(accountFields)
          .eq("id", existing.id);
        if (updateError) throw new Error("Failed to update email account");
        accountId = existing.id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("email_accounts")
          .insert({
            organization_id: organizationId,
            email_address: emailAddress,
            ...accountFields,
            // Legacy IMAP fields required by schema, unused for Composio accounts
            imap_host: "composio",
            imap_port: 0,
            imap_username: emailAddress,
            imap_password: "composio",
            imap_use_ssl: true,
            sync_folder: "INBOX",
            auto_categorize: true,
            auto_create_records: false,
          })
          .select("id")
          .single();
        if (insertError || !inserted) {
          console.error("Insert error:", insertError);
          throw new Error("Failed to create email account");
        }
        accountId = inserted.id;
      }

      return new Response(
        JSON.stringify({ success: true, accountId, email: emailAddress, provider: toolkit }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Sync emails through Composio ---
    if (body.action === "sync") {
      if (!body.accountId) throw new Error("accountId is required");
      const maxResults = body.maxResults ?? 50;

      const { data: account, error: accountError } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", body.accountId)
        .eq("organization_id", organizationId)
        .single();

      if (accountError || !account) throw new Error("Email account not found");
      if (account.oauth_provider !== "composio" || !account.composio_connected_account_id) {
        throw new Error("Account is not a Composio-connected account");
      }

      await supabase
        .from("email_accounts")
        .update({ status: "syncing", last_error: null })
        .eq("id", account.id);

      let toolSlug: string;
      let toolArguments: Record<string, unknown>;
      if (account.provider_slug === "gmail") {
        toolSlug = "GMAIL_FETCH_EMAILS";
        let query = "in:inbox";
        if (body.fromDate) {
          const d = new Date(body.fromDate);
          query += ` after:${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
        }
        toolArguments = { query, max_results: maxResults, include_payload: true };
      } else if (account.provider_slug === "outlook") {
        toolSlug = "OUTLOOK_LIST_MESSAGES";
        toolArguments = {
          folder: "inbox",
          top: Math.min(maxResults, 100),
          ...(body.fromDate ? { received_date_time_ge: new Date(body.fromDate).toISOString() } : {}),
        };
      } else {
        throw new Error(`Unsupported provider: ${account.provider_slug}`);
      }

      const result = await composioFetch(`/tools/execute/${toolSlug}`, COMPOSIO_API_KEY, {
        method: "POST",
        body: JSON.stringify({
          connected_account_id: account.composio_connected_account_id,
          user_id: composioUserId,
          arguments: toolArguments,
        }),
      });

      if (!result.successful) {
        await supabase
          .from("email_accounts")
          .update({ status: "error", last_error: result.error || "Composio tool call failed" })
          .eq("id", account.id);
        throw new Error(result.error || "Composio tool call failed");
      }

      const messages =
        account.provider_slug === "gmail"
          ? normalizeGmailMessages(result.data)
          : normalizeOutlookMessages(result.data);

      const allowedSenders = parseJsonbArray(account.allowed_senders);
      const blockedSenders = parseJsonbArray(account.blocked_senders);
      let effectiveFilterMode = account.filter_mode || "all";
      if (allowedSenders.length > 0 && effectiveFilterMode === "all") {
        effectiveFilterMode = "whitelist";
      }

      let newEmails = 0;
      let processedForAI = 0;
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

      for (const msg of messages) {
        if (!msg.messageId || !msg.senderEmail) continue;
        if (!shouldProcessSender(msg.senderEmail, effectiveFilterMode, allowedSenders, blockedSenders)) {
          continue;
        }

        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("message_id", msg.messageId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (existing) continue;

        const { data: newEmail, error: insertError } = await supabase
          .from("emails")
          .insert({
            organization_id: organizationId,
            email_account_id: account.id,
            message_id: msg.messageId,
            sender_email: msg.senderEmail,
            sender_name: msg.senderName,
            subject: msg.subject,
            body: msg.body.substring(0, 50000),
            received_at: msg.receivedAt,
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
            if (processResponse.ok) processedForAI++;
          } catch (processError) {
            console.error("AI processing error:", processError);
          }
        }
      }

      await supabase
        .from("email_accounts")
        .update({ status: "active", last_sync_at: new Date().toISOString(), last_error: null })
        .eq("id", account.id);

      return new Response(
        JSON.stringify({
          success: true,
          newEmails,
          processedForAI,
          totalMessages: messages.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Disconnect: remove the Composio connection and the account row ---
    if (body.action === "disconnect") {
      if (!body.accountId) throw new Error("accountId is required");

      const { data: account } = await supabase
        .from("email_accounts")
        .select("id, composio_connected_account_id")
        .eq("id", body.accountId)
        .eq("organization_id", organizationId)
        .single();

      if (!account) throw new Error("Email account not found");

      if (account.composio_connected_account_id) {
        try {
          await composioFetch(
            `/connected_accounts/${account.composio_connected_account_id}`,
            COMPOSIO_API_KEY,
            { method: "DELETE" }
          );
        } catch (e) {
          console.error("Failed to delete Composio connected account:", e);
        }
      }

      const { error: deleteError } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", account.id);
      if (deleteError) throw new Error("Failed to delete email account");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Composio email error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
