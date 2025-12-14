import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  organization_id: string;
  recipient_id: string;
  type: "comment" | "ticket" | "feature_request" | "feedback" | "mention" | "assignment";
  title: string;
  message: string;
  entity_type: "ticket" | "feature_request" | "feedback" | "project" | null;
  entity_id: string | null;
  entity_display_id: string | null;
  actor_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  actor?: {
    id: string;
    name: string;
  } | null;
}

export interface NotificationPreferences {
  comments: boolean;
  tickets: boolean;
  features: boolean;
  feedback: boolean;
}

// Fetch notifications for current user
export function useNotifications() {
  const { member, organization } = useAuth();

  return useQuery({
    queryKey: ["notifications", member?.id, organization?.id],
    queryFn: async () => {
      if (!member?.id || !organization?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:team_members!notifications_actor_id_fkey(id, name)
        `)
        .eq("recipient_id", member.id)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!member?.id && !!organization?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread notification count
export function useUnreadNotificationCount() {
  const { member, organization } = useAuth();

  return useQuery({
    queryKey: ["notifications-unread-count", member?.id, organization?.id],
    queryFn: async () => {
      if (!member?.id || !organization?.id) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", member.id)
        .eq("organization_id", organization.id)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!member?.id && !!organization?.id,
    refetchInterval: 30000,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { member, organization } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", member?.id, organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", member?.id, organization?.id] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { member, organization } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!member?.id || !organization?.id) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("recipient_id", member.id)
        .eq("organization_id", organization.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", member?.id, organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", member?.id, organization?.id] });
    },
  });
}

// Delete a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { member, organization } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", member?.id, organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", member?.id, organization?.id] });
    },
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { member, refreshUserData } = useAuth();

  return useMutation({
    mutationFn: async ({
      emailNotificationsEnabled,
      notificationPreferences,
    }: {
      emailNotificationsEnabled?: boolean;
      notificationPreferences?: NotificationPreferences;
    }) => {
      if (!member?.id) throw new Error("No member found");

      const updates: Record<string, unknown> = {};
      if (emailNotificationsEnabled !== undefined) {
        updates.email_notifications_enabled = emailNotificationsEnabled;
      }
      if (notificationPreferences !== undefined) {
        updates.notification_preferences = notificationPreferences;
      }

      const { error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", member.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshUserData();
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

// Types for sending notifications
export type NotificationType = "comment" | "ticket" | "feature_request" | "feedback" | "mention" | "assignment";
export type EntityType = "ticket" | "feature_request" | "feedback" | "project";

export interface SendNotificationParams {
  recipientIds?: string[]; // Optional: specific recipients (for assignments)
  projectIds?: string[]; // Optional: filter by project access
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
  entityDisplayId?: string;
  excludeActorFromNotification?: boolean;
}

// Send notification (creates in-app notification + sends email)
export function useSendNotification() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async (params: SendNotificationParams) => {
      if (!organization?.id) throw new Error("No organization found");

      const response = await supabase.functions.invoke("create-notification", {
        body: {
          organizationId: organization.id,
          recipientIds: params.recipientIds,
          projectIds: params.projectIds, // Filter by project access
          type: params.type,
          title: params.title,
          message: params.message,
          entityType: params.entityType,
          entityId: params.entityId,
          entityDisplayId: params.entityDisplayId,
          actorId: member?.id,
          excludeActorFromNotification: params.excludeActorFromNotification ?? true,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications cache for recipients
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

// Helper hook to get all team member IDs for org-wide notifications
export function useTeamMemberIds() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team-member-ids", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("team_members")
        .select("id")
        .eq("organization_id", organization.id);

      if (error) throw error;
      return data.map(m => m.id);
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
