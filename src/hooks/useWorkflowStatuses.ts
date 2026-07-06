import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type WorkflowCategory = "todo" | "in_progress" | "done";

export interface WorkflowStatus {
  id: string;
  project_id: string;
  organization_id: string;
  name: string;
  category: WorkflowCategory;
  color: string;
  position: number;
  created_at: string;
}

const DEFAULT_STATUSES: Omit<WorkflowStatus, "id" | "project_id" | "organization_id" | "created_at">[] = [
  { name: "To Do", category: "todo", color: "#DFE1E6", position: 0 },
  { name: "In Progress", category: "in_progress", color: "#0052CC", position: 1 },
  { name: "In Review", category: "in_progress", color: "#FF991F", position: 2 },
  { name: "Done", category: "done", color: "#36B37E", position: 3 },
];

export function useWorkflowStatuses(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["workflow-statuses", projectId],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      const { data, error } = await supabase
        .from("workflow_statuses")
        .select("*")
        .eq("project_id", projectId)
        .eq("organization_id", organization.id)
        .order("position");

      if (error) throw error;
      return data as WorkflowStatus[];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

export function useInitializeWorkflow() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, statuses }: { projectId: string; statuses?: typeof DEFAULT_STATUSES }) => {
      if (!organization?.id) throw new Error("No organization");

      const toInsert = (statuses || DEFAULT_STATUSES).map((s) => ({
        ...s,
        project_id: projectId,
        organization_id: organization.id,
      }));

      const { data, error } = await supabase
        .from("workflow_statuses")
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data as WorkflowStatus[];
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", vars.projectId] });
    },
  });
}

export function useUpdateWorkflowStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<WorkflowStatus> & { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("workflow_statuses")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", result.projectId] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });
}

export function useCreateWorkflowStatus() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: { projectId: string; name: string; category: WorkflowCategory; color?: string; position: number }) => {
      if (!organization?.id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("workflow_statuses")
        .insert({
          project_id: input.projectId,
          organization_id: organization.id,
          name: input.name,
          category: input.category,
          color: input.color || "#0052CC",
          position: input.position,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkflowStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", data.project_id] });
      toast.success("Status column added");
    },
    onError: () => {
      toast.error("Failed to add status");
    },
  });
}

export function useDeleteWorkflowStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("workflow_statuses").delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", result.projectId] });
      toast.success("Status column removed");
    },
    onError: () => {
      toast.error("Failed to remove status");
    },
  });
}

export function useReorderWorkflowStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, statuses }: { projectId: string; statuses: { id: string; position: number }[] }) => {
      const updates = statuses.map((s) =>
        supabase.from("workflow_statuses").update({ position: s.position }).eq("id", s.id)
      );
      await Promise.all(updates);
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", result.projectId] });
    },
  });
}

export { DEFAULT_STATUSES };
