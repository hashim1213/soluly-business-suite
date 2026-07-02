import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Sprint = Tables<"sprints">;
export type SprintStatus = "planned" | "active" | "completed";
type SprintInsert = TablesInsert<"sprints">;
type SprintUpdate = TablesUpdate<"sprints">;

export function useSprints() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["sprints", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("organization_id", organization.id)
        .order("start_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!organization?.id,
  });
}

export function useActiveSprint() {
  const sprints = useSprints();
  return {
    ...sprints,
    data: sprints.data?.find((s) => s.status === "active") ?? null,
  };
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (sprint: Omit<SprintInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("sprints")
        .insert({ ...sprint, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data as Sprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast.success("Sprint created");
    },
    onError: (error) => {
      toast.error("Failed to create sprint: " + error.message);
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SprintUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("sprints")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Sprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      // Sprint completion can clear tickets out of the active board view
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      toast.error("Failed to update sprint: " + error.message);
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Sprint deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete sprint: " + error.message);
    },
  });
}
