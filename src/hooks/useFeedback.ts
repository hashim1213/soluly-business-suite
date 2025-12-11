import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Feedback = Tables<"feedback">;
export type FeedbackInsert = TablesInsert<"feedback">;
export type FeedbackUpdate = TablesUpdate<"feedback">;

// Fetch all feedback for the current organization
export function useFeedback() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["feedback", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Feedback & { project?: { name: string; display_id: string } | null })[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single feedback
export function useFeedbackItem(id: string | undefined) {
  return useQuery({
    queryKey: ["feedback", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Feedback & { project?: { name: string; display_id: string } | null };
    },
    enabled: !!id,
  });
}

// Fetch feedback by display_id (filtered by organization)
export function useFeedbackByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["feedback", "display", displayId, organization?.id],
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
      return data as Feedback & { project?: { name: string; display_id: string } | null };
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Create feedback
export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

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
      return data as Feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback logged successfully");
    },
    onError: (error) => {
      toast.error("Failed to log feedback: " + error.message);
    },
  });
}

// Update feedback
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FeedbackUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("feedback")
        .update(updates)
        .eq("id", id)
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

// Delete feedback
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", id);

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
