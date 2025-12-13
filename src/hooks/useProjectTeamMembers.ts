import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ProjectTeamMember = Tables<"project_team_members">;
export type ProjectTeamMemberInsert = TablesInsert<"project_team_members">;

// Extended type with team member details
export type ProjectTeamMemberWithDetails = ProjectTeamMember & {
  team_member: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    hourly_rate: number;
    salary: number;
    contract_type: string;
    department: string;
    status: string;
  } | null;
};

// Fetch all team members for a project
export function useProjectTeamMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_team_members", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_team_members")
        .select(`
          *,
          team_member:team_members(
            id,
            name,
            email,
            role,
            avatar,
            hourly_rate,
            salary,
            contract_type,
            department,
            status
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProjectTeamMemberWithDetails[];
    },
    enabled: !!projectId,
  });
}

// Add team member to project
export function useAddProjectTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, teamMemberId }: { projectId: string; teamMemberId: string }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Verify team member belongs to this organization
      const { data: teamMember, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", teamMemberId)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !teamMember) {
        throw new Error("Team member not found");
      }

      // Verify project belongs to this organization
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("organization_id", organization.id)
        .single();

      if (projectError || !project) {
        throw new Error("Project not found");
      }

      // Check if already exists (with org filter)
      const { data: existing } = await supabase
        .from("project_team_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("team_member_id", teamMemberId)
        .eq("organization_id", organization.id)
        .single();

      if (existing) {
        throw new Error("Team member is already assigned to this project");
      }

      const { data, error } = await supabase
        .from("project_team_members")
        .insert({
          project_id: projectId,
          team_member_id: teamMemberId,
          organization_id: organization.id,
        })
        .select(`
          *,
          team_member:team_members(
            id,
            name,
            email,
            role,
            avatar,
            hourly_rate,
            salary,
            contract_type,
            department,
            status
          )
        `)
        .single();

      if (error) throw error;
      return data as ProjectTeamMemberWithDetails;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_team_members"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success(`${data.team_member?.name || "Team member"} added to project`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Remove team member from project
export function useRemoveProjectTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, teamMemberId }: { projectId: string; teamMemberId: string }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase
        .from("project_team_members")
        .delete()
        .eq("project_id", projectId)
        .eq("team_member_id", teamMemberId)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_team_members"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member removed from project");
    },
    onError: (error) => {
      toast.error("Failed to remove team member: " + error.message);
    },
  });
}

// Update hours logged for a team member on a project
export function useUpdateProjectTeamMemberHours() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, teamMemberId, hoursLogged }: { projectId: string; teamMemberId: string; hoursLogged: number }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_team_members")
        .update({ hours_logged: hoursLogged })
        .eq("project_id", projectId)
        .eq("team_member_id", teamMemberId)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_team_members"] });
    },
    onError: (error) => {
      toast.error("Failed to update hours: " + error.message);
    },
  });
}
