import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailProvider {
  slug: string;
  name: string;
}

function getCallbackUrl() {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8080/auth/composio/callback";
  }
  return `${window.location.origin}/auth/composio/callback`;
}

/**
 * Hook to list email providers available through Composio
 */
export function useEmailProviders() {
  return useQuery({
    queryKey: ["composio_email_providers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("composio-email", {
        body: { action: "list_providers" },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to load providers");
      return data.providers as EmailProvider[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook to start connecting an email account via Composio.
 * Redirects the browser to a Composio Connect Link.
 */
export function useConnectEmailProvider() {
  return useMutation({
    mutationFn: async (toolkit: string) => {
      const { data, error } = await supabase.functions.invoke("composio-email", {
        body: {
          action: "connect",
          toolkit,
          callbackUrl: getCallbackUrl(),
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success || !data?.redirectUrl) {
        throw new Error(data?.error || "Failed to create connect link");
      }

      // Remember the pending connection so the callback page can finalize it
      sessionStorage.setItem("composio_pending_connection", data.connectedAccountId);
      window.location.href = data.redirectUrl;
    },
    onError: (error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });
}

/**
 * Hook to finalize a Composio connection after the user returns
 * from the Connect Link (registers the email account).
 */
export function useFinalizeEmailConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectedAccountId: string) => {
      const { data, error } = await supabase.functions.invoke("composio-email", {
        body: { action: "finalize", connectedAccountId },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to finalize connection");
      return data as { accountId: string; email: string; provider: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
    },
  });
}

/**
 * Hook to sync a Composio-connected email account
 */
export function useSyncComposioAccount() {
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
      const { data, error } = await supabase.functions.invoke("composio-email", {
        body: {
          action: "sync",
          accountId,
          maxResults,
          fromDate: fromDate?.toISOString(),
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Sync failed");
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
 * Hook to disconnect a Composio-connected email account
 */
export function useDisconnectComposioAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke("composio-email", {
        body: { action: "disconnect", accountId },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Email account disconnected");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
