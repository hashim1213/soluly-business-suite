import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectContract {
  id: string;
  organization_id: string;
  project_id: string;
  display_id: string;
  name: string;
  type: string;
  status: string;
  file_url: string | null;
  file_size: string | null;
  notes: string | null;
  signed_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectContractInput {
  project_id: string;
  name: string;
  type: string;
  status?: string;
  file_url?: string;
  file_size?: string;
  notes?: string;
  signed_date?: string;
  expiry_date?: string;
}

export interface UpdateProjectContractInput {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  file_url?: string;
  file_size?: string;
  notes?: string;
  signed_date?: string;
  expiry_date?: string;
}

export const CONTRACT_TYPES = ["nda", "service", "employee", "contractor"] as const;
export const CONTRACT_STATUSES = ["draft", "pending", "signed", "active", "expired"] as const;

/**
 * Hook to fetch all contracts for a project
 */
export function useProjectContracts(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_contracts", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_contracts")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectContract[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to create a new project contract
 */
export function useCreateProjectContract() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectContractInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Generate display_id
      const { count } = await supabase
        .from("project_contracts")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      const displayId = `CON-${String((count || 0) + 1).padStart(3, "0")}`;

      const { data, error } = await supabase
        .from("project_contracts")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          display_id: displayId,
          name: input.name,
          type: input.type,
          status: input.status || "draft",
          file_url: input.file_url || null,
          file_size: input.file_size || null,
          notes: input.notes || null,
          signed_date: input.signed_date || null,
          expiry_date: input.expiry_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectContract;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_contracts"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.project_id] });
      toast.success("Contract added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add contract: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing project contract
 */
export function useUpdateProjectContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectContractInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("project_contracts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_contracts"] });
      toast.success("Contract updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update contract: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a project contract
 */
export function useDeleteProjectContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_contracts"] });
      toast.success("Contract deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });
}
