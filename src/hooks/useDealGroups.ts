import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type DealGroup = Tables<"deal_groups">;
export type DealGroupInsert = TablesInsert<"deal_groups">;
export type DealGroupUpdate = TablesUpdate<"deal_groups">;

// Fetch all deal groups for the current organization
export function useDealGroups() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["deal-groups", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("deal_groups")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (error) throw error;
      return data as DealGroup[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateDealGroup() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (group: Omit<DealGroupInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("deal_groups")
        .insert({ ...group, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data as DealGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-groups"] });
      toast.success("Deal created");
    },
    onError: (error) => {
      toast.error("Failed to create deal: " + error.message);
    },
  });
}

export function useUpdateDealGroup() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DealGroupUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("deal_groups")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as DealGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-groups"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      toast.error("Failed to update deal: " + error.message);
    },
  });
}

export function useDeleteDealGroup() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("deal_groups")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-groups"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Deal deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete deal: " + error.message);
    },
  });
}
