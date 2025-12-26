import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OAuthRequest {
  action: "get_auth_url" | "exchange_code" | "refresh_token";
  code?: string;
  redirectUri?: string;
  organizationId?: string;
  accountId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    console.log("Gmail OAuth function called");
    console.log("Has GOOGLE_CLIENT_ID:", !!GOOGLE_CLIENT_ID);
    console.log("Has GOOGLE_CLIENT_SECRET:", !!GOOGLE_CLIENT_SECRET);

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials");
      throw new Error("Google OAuth credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body: OAuthRequest = await req.json();
    const { action, code, redirectUri, organizationId, accountId } = body;

    console.log("Action:", action);
    console.log("RedirectUri:", redirectUri);

    // Action: Get OAuth URL
    if (action === "get_auth_url") {
      console.log("Building OAuth URL...");
      const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri || "");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");

      // Pass organizationId in state for later use
      if (organizationId) {
        authUrl.searchParams.set("state", organizationId);
      }

      const authUrlString = authUrl.toString();
      console.log("Generated OAuth URL:", authUrlString.substring(0, 100) + "...");

      return new Response(
        JSON.stringify({ success: true, authUrl: authUrlString }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Exchange authorization code for tokens
    if (action === "exchange_code") {
      if (!code || !redirectUri) {
        throw new Error("Code and redirectUri are required");
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokens = await tokenResponse.json();
      console.log("Tokens received:", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });

      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userInfo = await userInfoResponse.json();
      console.log("User info:", { email: userInfo.email, name: userInfo.name });

      // Get the user's organization from Supabase
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("organization_id")
        .eq("auth_user_id", userId)
        .single();

      if (teamError || !teamMember) {
        throw new Error("Could not find user's organization");
      }

      // Calculate token expiry time
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Check if email account already exists
      const { data: existingAccount } = await supabase
        .from("email_accounts")
        .select("id")
        .eq("organization_id", teamMember.organization_id)
        .eq("email_address", userInfo.email)
        .single();

      if (existingAccount) {
        // Update existing account
        const { error: updateError } = await supabase
          .from("email_accounts")
          .update({
            display_name: userInfo.name || userInfo.email,
            oauth_provider: "google",
            oauth_access_token: tokens.access_token,
            oauth_refresh_token: tokens.refresh_token || null,
            oauth_token_expires_at: expiresAt,
            status: "active",
            last_error: null,
            // Keep existing settings
          })
          .eq("id", existingAccount.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw new Error("Failed to update email account");
        }

        return new Response(
          JSON.stringify({
            success: true,
            accountId: existingAccount.id,
            email: userInfo.email,
            updated: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new email account
      const { data: newAccount, error: insertError } = await supabase
        .from("email_accounts")
        .insert({
          organization_id: teamMember.organization_id,
          display_name: userInfo.name || userInfo.email,
          email_address: userInfo.email,
          oauth_provider: "google",
          oauth_access_token: tokens.access_token,
          oauth_refresh_token: tokens.refresh_token || null,
          oauth_token_expires_at: expiresAt,
          // Placeholder IMAP fields (required by schema but not used for OAuth)
          imap_host: "imap.gmail.com",
          imap_port: 993,
          imap_username: userInfo.email,
          imap_password: "oauth",
          imap_use_ssl: true,
          sync_folder: "INBOX",
          auto_categorize: true,
          auto_create_records: false,
          status: "active",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to create email account");
      }

      return new Response(
        JSON.stringify({
          success: true,
          accountId: newAccount.id,
          email: userInfo.email,
          created: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Refresh access token
    if (action === "refresh_token") {
      if (!accountId) {
        throw new Error("Account ID is required");
      }

      // Get the account's refresh token
      const { data: account, error: accountError } = await supabase
        .from("email_accounts")
        .select("oauth_refresh_token")
        .eq("id", accountId)
        .single();

      if (accountError || !account?.oauth_refresh_token) {
        throw new Error("No refresh token available");
      }

      // Refresh the token
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
        const errorData = await tokenResponse.text();
        console.error("Token refresh failed:", errorData);

        // Mark account as needing re-authorization
        await supabase
          .from("email_accounts")
          .update({ status: "error", last_error: "Token refresh failed - reauthorization needed" })
          .eq("id", accountId);

        throw new Error("Failed to refresh token");
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update the account with new token
      await supabase
        .from("email_accounts")
        .update({
          oauth_access_token: tokens.access_token,
          oauth_token_expires_at: expiresAt,
          status: "active",
          last_error: null,
        })
        .eq("id", accountId);

      return new Response(
        JSON.stringify({
          success: true,
          accessToken: tokens.access_token,
          expiresAt
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error("Gmail OAuth error:", error);
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
