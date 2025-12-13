import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  organization_id: string;
  feedback_id: string | null;
  feature_request_id: string | null;
  ticket_id: string | null;
  content: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
  } | null;
}

type EntityType = "feedback" | "feature_request" | "ticket";

interface UseCommentsOptions {
  entityType: EntityType;
  entityId: string | undefined;
}

// Fetch comments for a specific entity
export function useComments({ entityType, entityId }: UseCommentsOptions) {
  const { organization } = useAuth();

  const foreignKey = entityType === "feedback"
    ? "feedback_id"
    : entityType === "feature_request"
      ? "feature_request_id"
      : "ticket_id";

  return useQuery({
    queryKey: ["comments", entityType, entityId, organization?.id],
    queryFn: async () => {
      if (!entityId || !organization?.id) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:team_members(id, name)
        `)
        .eq(foreignKey, entityId)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!entityId && !!organization?.id,
  });
}

// Create a comment
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      content,
    }: {
      entityType: EntityType;
      entityId: string;
      content: string;
    }) => {
      if (!organization?.id) throw new Error("No organization found");
      if (!member?.id) throw new Error("No member found");

      const foreignKey = entityType === "feedback"
        ? "feedback_id"
        : entityType === "feature_request"
          ? "feature_request_id"
          : "ticket_id";

      const { data, error } = await supabase
        .from("comments")
        .insert({
          organization_id: organization.id,
          [foreignKey]: entityId,
          content,
          author_id: member.id,
        })
        .select(`
          *,
          author:team_members(id, name)
        `)
        .single();

      if (error) throw error;
      return { data, entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    },
  });
}

// Update a comment
export function useUpdateComment() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      entityType,
      entityId,
    }: {
      id: string;
      content: string;
      entityType: EntityType;
      entityId: string;
    }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return { data, entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success("Comment updated");
    },
    onError: (error) => {
      toast.error("Failed to update comment: " + error.message);
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      entityType,
      entityId,
    }: {
      id: string;
      entityType: EntityType;
      entityId: string;
    }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
      return { entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete comment: " + error.message);
    },
  });
}
