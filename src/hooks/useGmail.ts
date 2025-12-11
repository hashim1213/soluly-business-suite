import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Get consistent redirect URI
function getRedirectUri() {
  // Always use localhost:8080 for local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080/auth/gmail/callback';
  }
  // For production, use the actual origin
  return `${window.location.origin}/auth/gmail/callback`;
}

/**
 * Hook to initiate Gmail OAuth connection
 */
export function useConnectGmail() {
  return useMutation({
    mutationFn: async () => {
      const redirectUri = getRedirectUri();
      console.log("Using redirect URI:", redirectUri);

      const { data, error } = await supabase.functions.invoke("gmail-oauth", {
        body: {
          action: "get_auth_url",
          redirectUri,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success || !data?.authUrl) {
        throw new Error(data?.error || "Failed to get OAuth URL");
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error(`Failed to connect Gmail: ${error.message}`);
    },
  });
}

/**
 * Hook to sync emails from a Gmail account
 */
export function useSyncGmailAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      maxResults = 50,
      fromDate,
    }: {
      accountId: string;
      maxResults?: number;
      fromDate?: Date;
    }) => {
      const { data, error } = await supabase.functions.invoke("gmail-sync", {
        body: {
          accountId,
          maxResults,
          fromDate: fromDate?.toISOString(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Sync failed");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });

      if (data.newEmails > 0) {
        toast.success(`Synced ${data.newEmails} new email(s)`);
      } else {
        toast.info("No new emails to sync");
      }
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

/**
 * Hook to sync all Gmail accounts
 */
export function useSyncAllGmailAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      maxResults = 50,
      fromDate,
    }: {
      maxResults?: number;
      fromDate?: Date;
    } = {}) => {
      // Get all Gmail accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("email_accounts")
        .select("id")
        .eq("oauth_provider", "google")
        .eq("status", "active");

      if (accountsError) {
        throw new Error(accountsError.message);
      }

      if (!accounts || accounts.length === 0) {
        return { total: 0, synced: 0, failed: 0, newEmails: 0 };
      }

      let synced = 0;
      let failed = 0;
      let totalNewEmails = 0;

      for (const account of accounts) {
        try {
          const { data, error } = await supabase.functions.invoke("gmail-sync", {
            body: {
              accountId: account.id,
              maxResults,
              fromDate: fromDate?.toISOString(),
            },
          });

          if (error || !data?.success) {
            failed++;
          } else {
            synced++;
            totalNewEmails += data.newEmails || 0;
          }
        } catch {
          failed++;
        }
      }

      return {
        total: accounts.length,
        synced,
        failed,
        newEmails: totalNewEmails,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });

      if (data.newEmails > 0) {
        toast.success(`Synced ${data.newEmails} email(s) from ${data.synced} account(s)`);
      } else if (data.synced > 0) {
        toast.info(`No new emails from ${data.synced} account(s)`);
      }

      if (data.failed > 0) {
        toast.warning(`${data.failed} account(s) failed to sync`);
      }
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}
