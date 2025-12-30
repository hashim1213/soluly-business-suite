import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectTask {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateProjectTaskInput {
  project_id: string;
  title: string;
  priority?: "high" | "medium" | "low";
  assignee_id?: string;
  due_date?: string;
}

export interface UpdateProjectTaskInput {
  id: string;
  title?: string;
  completed?: boolean;
  priority?: "high" | "medium" | "low";
  assignee_id?: string | null;
  due_date?: string | null;
}

/**
 * Hook to fetch all tasks for a project
 */
export function useProjectTasks(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_tasks", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          assignee:team_members!assignee_id(
            id,
            name,
            email
          )
        `)
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to create a new project task
 */
export function useCreateProjectTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectTaskInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          title: input.title,
          priority: input.priority || "medium",
          assignee_id: input.assignee_id || null,
          due_date: input.due_date || null,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due_today"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.project_id] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing project task
 */
export function useUpdateProjectTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateProjectTaskInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { id, ...updates } = input;

      // Update with org filter for security
      const { data, error } = await supabase
        .from("project_tasks")
        .update({
          ...updates,
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
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due_today"] });
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

/**
 * Hook to toggle task completion status
 */
export function useToggleProjectTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_tasks")
        .update({
          completed,
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
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due_today"] });
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a project task
 */
export function useDeleteProjectTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due_today"] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}
