import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapClient } from "./imap-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImapRequest {
  action: "test" | "add" | "sync";
  // for test/add
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useSsl?: boolean;
  displayName?: string;
  syncFolder?: string;
  // for sync
  accountId?: string;
  maxResults?: number;
  fromDate?: string;
}

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

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  return { name: "", email: from.trim() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const body: ImapRequest = await req.json();

    // --- Test connection credentials (and optionally save the account) ---
    if (body.action === "test" || body.action === "add") {
      const { host, port = 993, username, password, useSsl = true } = body;
      if (!host || !username || !password) {
        throw new Error("host, username, and password are required");
      }

      const client = new ImapClient();
      try {
        await client.connect({ host, port, username, password, useSsl });
        await client.login(username, password);
        const totalMessages = await client.select(body.syncFolder || "INBOX");

        if (body.action === "test") {
          await client.logout();
          return new Response(JSON.stringify({ success: true, totalMessages }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await client.logout();
        const emailAddress = username.includes("@") ? username : `${username}@${host.replace(/^(imap|mail)\./, "")}`;

        const { data: existing } = await supabase
          .from("email_accounts")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("email_address", emailAddress)
          .maybeSingle();
        if (existing) {
          throw new Error("An account with this email address already exists");
        }

        const { data: inserted, error: insertError } = await supabase
          .from("email_accounts")
          .insert({
            organization_id: organizationId,
            display_name: body.displayName || emailAddress,
            email_address: emailAddress,
            oauth_provider: "imap",
            provider_slug: "imap",
            imap_host: host,
            imap_port: port,
            imap_username: username,
            imap_password: password,
            imap_use_ssl: useSsl,
            sync_folder: body.syncFolder || "INBOX",
            auto_categorize: true,
            auto_create_records: false,
            status: "active",
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          console.error("Insert error:", insertError);
          throw new Error("Failed to save email account");
        }

        return new Response(
          JSON.stringify({ success: true, accountId: inserted.id, email: emailAddress, totalMessages }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        await client.logout();
        throw e;
      }
    }

    // --- Sync via IMAP ---
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
      if (account.oauth_provider !== "imap") {
        throw new Error("Account is not an IMAP account");
      }

      await supabase
        .from("email_accounts")
        .update({ status: "syncing", last_error: null })
        .eq("id", account.id);

      const client = new ImapClient();
      let messages;
      try {
        await client.connect({
          host: account.imap_host,
          port: account.imap_port,
          username: account.imap_username,
          password: account.imap_password,
          useSsl: account.imap_use_ssl,
        });
        await client.login(account.imap_username, account.imap_password);
        await client.select(account.sync_folder || "INBOX");

        const since = body.fromDate ? new Date(body.fromDate) : null;
        let uids = await client.searchSince(since);

        // Skip already-synced UIDs, newest first, capped at maxResults
        const lastUid = account.last_sync_uid ? parseInt(account.last_sync_uid, 10) : 0;
        uids = uids
          .filter((u) => u > lastUid)
          .sort((a, b) => b - a)
          .slice(0, maxResults);

        messages = await client.fetchMessages(uids);
        await client.logout();
      } catch (e) {
        await client.logout();
        await supabase
          .from("email_accounts")
          .update({ status: "error", last_error: e instanceof Error ? e.message : "IMAP sync failed" })
          .eq("id", account.id);
        throw e;
      }

      const allowedSenders = parseJsonbArray(account.allowed_senders);
      const blockedSenders = parseJsonbArray(account.blocked_senders);
      let effectiveFilterMode = account.filter_mode || "all";
      if (allowedSenders.length > 0 && effectiveFilterMode === "all") {
        effectiveFilterMode = "whitelist";
      }

      let newEmails = 0;
      let processedForAI = 0;
      let maxSeenUid = account.last_sync_uid ? parseInt(account.last_sync_uid, 10) : 0;
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

      for (const msg of messages) {
        if (msg.uid > maxSeenUid) maxSeenUid = msg.uid;
        const { name: senderName, email: senderEmail } = parseFromHeader(msg.from);
        if (!senderEmail) continue;
        if (!shouldProcessSender(senderEmail, effectiveFilterMode, allowedSenders, blockedSenders)) {
          continue;
        }

        const messageId = msg.messageId || `imap-${account.id}-${msg.uid}`;
        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("message_id", messageId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (existing) continue;

        const receivedAt = msg.date && !isNaN(Date.parse(msg.date))
          ? new Date(msg.date).toISOString()
          : new Date().toISOString();

        const { data: newEmail, error: insertError } = await supabase
          .from("emails")
          .insert({
            organization_id: organizationId,
            email_account_id: account.id,
            message_id: messageId,
            imap_uid: String(msg.uid),
            sender_email: senderEmail,
            sender_name: senderName,
            subject: msg.subject || "(No Subject)",
            body: msg.bodyText.substring(0, 50000),
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
        .update({
          status: "active",
          last_sync_at: new Date().toISOString(),
          last_sync_uid: maxSeenUid > 0 ? String(maxSeenUid) : account.last_sync_uid,
          last_error: null,
        })
        .eq("id", account.id);

      return new Response(
        JSON.stringify({ success: true, newEmails, processedForAI, totalMessages: messages.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("IMAP email error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
