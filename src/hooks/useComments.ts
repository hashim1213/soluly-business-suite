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

      // Fetch entity details for the notification including project IDs
      let entityTitle = "";
      let entityDisplayId = "";
      let projectIds: string[] = [];

      if (entityType === "feedback") {
        const { data: entity } = await supabase
          .from("feedback")
          .select("title, display_id, project_id")
          .eq("id", entityId)
          .single();
        if (entity) {
          entityTitle = entity.title;
          entityDisplayId = entity.display_id;
          if (entity.project_id) {
            projectIds = [entity.project_id];
          }
        }
      } else if (entityType === "feature_request") {
        const { data: entity } = await supabase
          .from("feature_requests")
          .select("title, display_id")
          .eq("id", entityId)
          .single();
        if (entity) {
          entityTitle = entity.title;
          entityDisplayId = entity.display_id;
        }
        // Feature requests can have multiple projects
        const { data: featureProjects } = await supabase
          .from("feature_request_projects")
          .select("project_id")
          .eq("feature_request_id", entityId);
        if (featureProjects) {
          projectIds = featureProjects.map(fp => fp.project_id);
        }
      } else if (entityType === "ticket") {
        const { data: entity } = await supabase
          .from("tickets")
          .select("title, display_id, project_id")
          .eq("id", entityId)
          .single();
        if (entity) {
          entityTitle = entity.title;
          entityDisplayId = entity.display_id;
          if (entity.project_id) {
            projectIds = [entity.project_id];
          }
        }
      }

      return {
        data,
        entityType,
        entityId,
        entityTitle,
        entityDisplayId,
        projectIds,
        authorName: member.name,
      };
    },
    onSuccess: async ({
      data,
      entityType,
      entityId,
      entityTitle,
      entityDisplayId,
      projectIds,
      authorName,
    }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
      toast.success("Comment added");

      // Send notification (fire and forget - filtered by project access)
      const entityTypeLabel = entityType === "feature_request" ? "Feature Request" :
                              entityType.charAt(0).toUpperCase() + entityType.slice(1);
      const truncatedContent = data.content.length > 200
        ? data.content.substring(0, 200) + "..."
        : data.content;

      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            organizationId: data.organization_id,
            projectIds: projectIds.length > 0 ? projectIds : undefined, // Only notify users with project access
            type: "comment",
            title: `New comment on ${entityTypeLabel}`,
            message: `${authorName || "Someone"} commented on ${entityDisplayId}: "${truncatedContent}"`,
            entityType: entityType === "feature_request" ? "feature_request" : entityType,
            entityId,
            entityDisplayId,
            actorId: data.author_id,
            excludeActorFromNotification: true,
          },
        });
      } catch (error) {
        // Don't show error to user - notification is not critical
        console.error("Failed to send comment notification:", error);
      }
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
