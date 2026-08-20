import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeEdgeFunction } from "@/lib/supabase-functions";
import { toast } from "sonner";

export interface ImapCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  displayName?: string;
  syncFolder?: string;
}

/**
 * Hook to test IMAP credentials without saving them
 */
export function useTestImapConnection() {
  return useMutation({
    mutationFn: async (credentials: ImapCredentials) => {
      return invokeEdgeFunction<{ totalMessages: number }>("imap-email", {
        action: "test",
        ...credentials,
      });
    },
  });
}

/**
 * Hook to add a private (IMAP) email account
 */
export function useAddImapAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: ImapCredentials) => {
      return invokeEdgeFunction<{ accountId: string; email: string; totalMessages: number }>(
        "imap-email",
        { action: "add", ...credentials }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success(`${data.email} connected`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook to sync an IMAP email account
 */
export function useSyncImapAccount() {
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
      return invokeEdgeFunction<{ newEmails: number; processedForAI: number; totalMessages: number }>(
        "imap-email",
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
