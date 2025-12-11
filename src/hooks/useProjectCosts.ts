import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectCost {
  id: string;
  organization_id: string;
  project_id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectCostInput {
  project_id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  recurring?: boolean;
}

export interface UpdateProjectCostInput {
  id: string;
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
  recurring?: boolean;
}

// Common cost categories
export const COST_CATEGORIES = [
  "Infrastructure",
  "Software",
  "External Services",
  "Travel",
  "Equipment",
  "Labor",
  "Marketing",
  "Legal",
  "Other",
] as const;

/**
 * Hook to fetch all costs for a project
 */
export function useProjectCosts(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_costs", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as ProjectCost[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to fetch all costs across all projects (for Financials page)
 */
export function useAllProjectCosts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_costs", organization?.id, "all"],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("project_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as ProjectCost[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new project cost
 */
export function useCreateProjectCost() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectCostInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_costs")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          description: input.description,
          category: input.category,
          amount: input.amount,
          date: input.date,
          recurring: input.recurring || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_costs"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.project_id] });
      toast.success("Cost added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add cost: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing project cost
 */
export function useUpdateProjectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectCostInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("project_costs")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_costs"] });
      toast.success("Cost updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update cost: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a project cost
 */
export function useDeleteProjectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_costs"] });
      toast.success("Cost deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete cost: ${error.message}`);
    },
  });
}
