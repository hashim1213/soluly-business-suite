import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Feedback = Tables<"feedback">;
export type FeedbackInsert = TablesInsert<"feedback">;
export type FeedbackUpdate = TablesUpdate<"feedback">;

// Fetch all feedback for the current organization (filtered by project access)
export function useFeedback() {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feedback", organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("feedback")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("organization_id", organization.id);

      // If user has project restrictions, filter feedback by allowed projects
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        if (allowedProjectIds.length === 0) {
          return []; // No projects allowed = no feedback
        }
        query = query.in("project_id", allowedProjectIds);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Feedback & { project?: { name: string; display_id: string } | null })[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single feedback (filtered by organization and project access)
export function useFeedbackItem(id: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feedback", id, organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!id || !organization?.id) return null;
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;

      // Check project access - if user has restricted access, verify they can access this feedback's project
      if (!hasFullProjectAccess() && allowedProjectIds !== null && data?.project_id) {
        if (!allowedProjectIds.includes(data.project_id)) {
          // User doesn't have access to this feedback's project
          return null;
        }
      }

      return data as Feedback & { project?: { name: string; display_id: string } | null };
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch feedback by display_id (filtered by organization and project access)
export function useFeedbackByDisplayId(displayId: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feedback", "display", displayId, organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;

      // Check project access - if user has restricted access, verify they can access this feedback's project
      if (!hasFullProjectAccess() && allowedProjectIds !== null && data?.project_id) {
        if (!allowedProjectIds.includes(data.project_id)) {
          // User doesn't have access to this feedback's project
          return null;
        }
      }

      return data as Feedback & { project?: { name: string; display_id: string } | null };
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Create feedback
export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async (feedback: Omit<FeedbackInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!feedback.display_id) {
        const { count } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true });
        feedback.display_id = `FBK-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("feedback")
        .insert({ ...feedback, organization_id: organization.id } as FeedbackInsert)
        .select()
        .single();

      if (error) throw error;

      return {
        feedback: data as Feedback,
      };
    },
    onSuccess: async ({ feedback }) => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback logged successfully");

      // Send notification for new feedback (filtered by project access if project_id exists)
      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            organizationId: feedback.organization_id,
            projectIds: feedback.project_id ? [feedback.project_id] : undefined, // Only notify users with access to this project
            type: "feedback",
            title: "New Feedback Received",
            message: `${member?.name || "Someone"} logged feedback ${feedback.display_id}: "${feedback.title}"`,
            entityType: "feedback",
            entityId: feedback.id,
            entityDisplayId: feedback.display_id,
            actorId: member?.id,
            excludeActorFromNotification: true,
          },
        });
      } catch (error) {
        console.error("Failed to send feedback notification:", error);
      }
    },
    onError: (error) => {
      toast.error("Failed to log feedback: " + error.message);
    },
  });
}

// Update feedback (filtered by organization)
export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FeedbackUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("feedback")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Feedback;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      queryClient.invalidateQueries({ queryKey: ["feedback", data.id] });
      toast.success("Feedback updated");
    },
    onError: (error) => {
      toast.error("Failed to update feedback: " + error.message);
    },
  });
}

// Delete feedback (filtered by organization)
export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete feedback: " + error.message);
    },
  });
}
