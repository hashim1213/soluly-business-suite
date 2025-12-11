import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type TimeEntry = Tables<"time_entries">;
export type TimeEntryInsert = TablesInsert<"time_entries">;
export type TimeEntryUpdate = TablesUpdate<"time_entries">;

// Extended time entry with project info
export type TimeEntryWithProject = TimeEntry & {
  project?: { name: string; display_id: string } | null;
};

// Extended type for project time entries
export type TimeEntryWithTeamMember = TimeEntry & {
  team_member?: { name: string; avatar: string | null; hourly_rate: number } | null;
};

// Fetch all time entries for a team member
export function useTimeEntriesByMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ["time_entries", "member", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          project:projects(name, display_id)
        `)
        .eq("team_member_id", memberId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TimeEntryWithProject[];
    },
    enabled: !!memberId,
  });
}

// Fetch time entries for a project
export function useTimeEntriesByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["time_entries", "project", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          team_member:team_members(name, avatar, hourly_rate)
        `)
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as TimeEntryWithTeamMember[];
    },
    enabled: !!projectId,
  });
}

// Create time entry
export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: TimeEntryInsert) => {
      const { data, error } = await supabase
        .from("time_entries")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;

      // Update team member's total_hours
      const { data: memberData } = await supabase
        .from("team_members")
        .select("total_hours")
        .eq("id", entry.team_member_id)
        .single();

      if (memberData) {
        await supabase
          .from("team_members")
          .update({ total_hours: memberData.total_hours + entry.hours })
          .eq("id", entry.team_member_id);
      }

      // Update project_team_members hours_logged if project is assigned
      if (entry.project_id) {
        const { data: ptmData } = await supabase
          .from("project_team_members")
          .select("hours_logged")
          .eq("project_id", entry.project_id)
          .eq("team_member_id", entry.team_member_id)
          .single();

        if (ptmData) {
          await supabase
            .from("project_team_members")
            .update({ hours_logged: ptmData.hours_logged + entry.hours })
            .eq("project_id", entry.project_id)
            .eq("team_member_id", entry.team_member_id);
        }
      }

      return data as TimeEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["project_team_members"] });
      toast.success("Time entry added");
    },
    onError: (error) => {
      toast.error("Failed to add time entry: " + error.message);
    },
  });
}

// Update time entry
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, oldHours, ...updates }: TimeEntryUpdate & { id: string; oldHours?: number }) => {
      const { data, error } = await supabase
        .from("time_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update team member's total_hours if hours changed
      if (oldHours !== undefined && updates.hours !== undefined) {
        const hoursDiff = updates.hours - oldHours;
        if (hoursDiff !== 0) {
          const { data: memberData } = await supabase
            .from("team_members")
            .select("total_hours")
            .eq("id", data.team_member_id)
            .single();

          if (memberData) {
            await supabase
              .from("team_members")
              .update({ total_hours: memberData.total_hours + hoursDiff })
              .eq("id", data.team_member_id);
          }
        }
      }

      return data as TimeEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Time entry updated");
    },
    onError: (error) => {
      toast.error("Failed to update time entry: " + error.message);
    },
  });
}

// Delete time entry
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, memberId, hours, projectId }: { id: string; memberId: string; hours: number; projectId?: string | null }) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update team member's total_hours
      const { data: memberData } = await supabase
        .from("team_members")
        .select("total_hours")
        .eq("id", memberId)
        .single();

      if (memberData) {
        await supabase
          .from("team_members")
          .update({ total_hours: Math.max(0, memberData.total_hours - hours) })
          .eq("id", memberId);
      }

      // Update project_team_members hours_logged if project was assigned
      if (projectId) {
        const { data: ptmData } = await supabase
          .from("project_team_members")
          .select("hours_logged")
          .eq("project_id", projectId)
          .eq("team_member_id", memberId)
          .single();

        if (ptmData) {
          await supabase
            .from("project_team_members")
            .update({ hours_logged: Math.max(0, ptmData.hours_logged - hours) })
            .eq("project_id", projectId)
            .eq("team_member_id", memberId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["project_team_members"] });
      toast.success("Time entry deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete time entry: " + error.message);
    },
  });
}
