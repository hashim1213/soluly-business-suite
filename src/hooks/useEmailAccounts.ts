import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type EmailAccount = Tables<"email_accounts">;
type EmailAccountInsert = TablesInsert<"email_accounts">;
type EmailAccountUpdate = TablesUpdate<"email_accounts">;

export function useEmailAccounts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["email_accounts", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmailAccount[];
    },
    enabled: !!organization?.id,
  });
}

export function useEmailAccount(id: string | null) {
  return useQuery({
    queryKey: ["email_account", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EmailAccount;
    },
    enabled: !!id,
  });
}

export function useCreateEmailAccount() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (account: Omit<EmailAccountInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("email_accounts")
        .insert({
          ...account,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Email account added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEmailAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: EmailAccountUpdate & { id: string }) => {
      console.log("Updating email account:", id, update);

      const { data, error } = await supabase
        .from("email_accounts")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Update result:", data);
      return data as EmailAccount;
    },
    onSuccess: (data) => {
      console.log("Update success, new data:", data);
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Email account updated");
    },
    onError: (error) => {
      console.error("Update mutation error:", error);
      toast.error(error.message);
    },
  });
}

export function useDeleteEmailAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_accounts"] });
      toast.success("Email account removed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// useTestEmailConnection is now in useEmailSync.ts
