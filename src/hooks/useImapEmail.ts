import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase.functions.invoke("imap-email", {
        body: { action: "test", ...credentials },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Connection test failed");
      return data as { totalMessages: number };
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
      const { data, error } = await supabase.functions.invoke("imap-email", {
        body: { action: "add", ...credentials },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to add account");
      return data as { accountId: string; email: string; totalMessages: number };
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
      const { data, error } = await supabase.functions.invoke("imap-email", {
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
