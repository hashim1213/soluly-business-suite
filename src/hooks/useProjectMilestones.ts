import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectMilestone {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectMilestoneInput {
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
}

export interface UpdateProjectMilestoneInput {
  id: string;
  title?: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
}

/**
 * Hook to fetch all milestones for a project
 */
export function useProjectMilestones(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_milestones", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as ProjectMilestone[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to create a new project milestone
 */
export function useCreateProjectMilestone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectMilestoneInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_milestones")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          title: input.title,
          description: input.description || null,
          due_date: input.due_date,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.project_id] });
      toast.success("Milestone created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create milestone: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing project milestone
 */
export function useUpdateProjectMilestone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateProjectMilestoneInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { id, completed, ...updates } = input;

      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // If marking as completed, set completed_at
      if (completed !== undefined) {
        updateData.completed = completed;
        updateData.completed_at = completed ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from("project_milestones")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
      toast.success("Milestone updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });
}

/**
 * Hook to toggle milestone completion status
 */
export function useToggleProjectMilestone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_milestones")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a project milestone
 */
export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase
        .from("project_milestones")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
      toast.success("Milestone deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });
}
