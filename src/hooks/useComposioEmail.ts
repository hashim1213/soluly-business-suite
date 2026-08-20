import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeEdgeFunction } from "@/lib/supabase-functions";
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
      const result = await invokeEdgeFunction<{ providers: EmailProvider[] }>(
        "composio-email",
        { action: "list_providers" }
      );
      return result.providers;
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
      const result = await invokeEdgeFunction<{ redirectUrl: string; connectedAccountId: string }>(
        "composio-email",
        {
          action: "connect",
          toolkit,
          callbackUrl: getCallbackUrl(),
        }
      );

      if (!result.redirectUrl) {
        throw new Error("Failed to create connect link");
      }

      sessionStorage.setItem("composio_pending_connection", result.connectedAccountId);
      window.location.href = result.redirectUrl;
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
      return invokeEdgeFunction<{ accountId: string; email: string; provider: string }>(
        "composio-email",
        { action: "finalize", connectedAccountId }
      );
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
      return invokeEdgeFunction<{ newEmails: number }>(
        "composio-email",
        {
          action: "sync",
          accountId,
          maxResults,
          fromDate: fromDate?.toISOString(),
        }
      );
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
      await invokeEdgeFunction("composio-email", { action: "disconnect", accountId });
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
