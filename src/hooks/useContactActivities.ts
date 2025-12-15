import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ContactActivity,
  ContactActivityType,
  CallOutcome,
  EmailDirection,
  ActivityTaskStatus,
  ActivityTaskPriority,
  MeetingAttendee,
} from "@/types/crm";

export interface CreateActivityInput {
  contact_id: string;
  activity_type: ContactActivityType;
  title?: string;
  description?: string;
  activity_date?: string;
  // Call fields
  call_duration?: number;
  call_outcome?: CallOutcome;
  // Email fields
  email_subject?: string;
  email_direction?: EmailDirection;
  // Meeting fields
  meeting_location?: string;
  meeting_attendees?: MeetingAttendee[];
  meeting_outcome?: string;
  meeting_start_time?: string;
  meeting_end_time?: string;
  // Task fields
  task_due_date?: string;
  task_status?: ActivityTaskStatus;
  task_priority?: ActivityTaskPriority;
}

export interface UpdateActivityInput extends Partial<Omit<CreateActivityInput, 'contact_id'>> {
  id: string;
}

/**
 * Hook to fetch all activities for a contact
 */
export function useContactActivities(contactId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contact-activities", contactId],
    queryFn: async () => {
      if (!organization?.id || !contactId) return [];

      const { data, error } = await supabase
        .from("contact_activities")
        .select(`
          *,
          creator:team_members!created_by(id, name, avatar)
        `)
        .eq("organization_id", organization.id)
        .eq("contact_id", contactId)
        .order("activity_date", { ascending: false });

      if (error) throw error;
      return data as ContactActivity[];
    },
    enabled: !!organization?.id && !!contactId,
  });
}

/**
 * Hook to fetch all activities for the organization (for reports)
 */
export function useAllActivities(filters?: {
  activityType?: ContactActivityType;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["all-activities", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("contact_activities")
        .select(`
          *,
          creator:team_members!created_by(id, name, avatar),
          contact:contacts!contact_id(id, name, email)
        `)
        .eq("organization_id", organization.id)
        .order("activity_date", { ascending: false });

      if (filters?.activityType) {
        query = query.eq("activity_type", filters.activityType);
      }
      if (filters?.dateFrom) {
        query = query.gte("activity_date", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("activity_date", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to fetch pending tasks
 */
export function usePendingTasks() {
  const { organization, member } = useAuth();

  return useQuery({
    queryKey: ["pending-tasks", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("contact_activities")
        .select(`
          *,
          creator:team_members!created_by(id, name, avatar),
          contact:contacts!contact_id(id, name, email)
        `)
        .eq("organization_id", organization.id)
        .eq("activity_type", "task")
        .in("task_status", ["pending", "in_progress"])
        .order("task_due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("contact_activities")
        .insert({
          organization_id: organization.id,
          contact_id: input.contact_id,
          activity_type: input.activity_type,
          title: input.title || null,
          description: input.description || null,
          activity_date: input.activity_date || new Date().toISOString(),
          created_by: member?.id || null,
          // Call fields
          call_duration: input.call_duration || null,
          call_outcome: input.call_outcome || null,
          // Email fields
          email_subject: input.email_subject || null,
          email_direction: input.email_direction || null,
          // Meeting fields
          meeting_location: input.meeting_location || null,
          meeting_attendees: input.meeting_attendees || null,
          meeting_outcome: input.meeting_outcome || null,
          meeting_start_time: input.meeting_start_time || null,
          meeting_end_time: input.meeting_end_time || null,
          // Task fields
          task_due_date: input.task_due_date || null,
          task_status: input.task_status || (input.activity_type === 'task' ? 'pending' : null),
          task_priority: input.task_priority || (input.activity_type === 'task' ? 'medium' : null),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ContactActivity;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-activities", variables.contact_id] });
      queryClient.invalidateQueries({ queryKey: ["all-activities"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      const typeLabels: Record<ContactActivityType, string> = {
        call: "Call",
        email: "Email",
        meeting: "Meeting",
        note: "Note",
        task: "Task",
      };
      toast.success(`${typeLabels[variables.activity_type]} logged successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to log activity: ${error.message}`);
    },
  });
}

/**
 * Hook to update an activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateActivityInput) => {
      if (!organization?.id) throw new Error("No organization found");

      const { id, ...updates } = input;

      // Handle task completion
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.task_status === 'completed') {
        updateData.task_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("contact_activities")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as ContactActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contact-activities", data.contact_id] });
      queryClient.invalidateQueries({ queryKey: ["all-activities"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tasks"] });
      toast.success("Activity updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("contact_activities")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
      return { contactId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contact-activities", result.contactId] });
      queryClient.invalidateQueries({ queryKey: ["all-activities"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tasks"] });
      toast.success("Activity deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
    },
  });
}

/**
 * Hook to complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("contact_activities")
        .update({
          task_status: 'completed',
          task_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, contactId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contact-activities", result.contactId] });
      queryClient.invalidateQueries({ queryKey: ["all-activities"] });
      queryClient.invalidateQueries({ queryKey: ["pending-tasks"] });
      toast.success("Task completed");
    },
    onError: (error) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });
}
