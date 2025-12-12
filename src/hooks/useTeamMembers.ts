import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type TeamMember = Tables<"team_members">;
export type TeamMemberInsert = TablesInsert<"team_members">;
export type TeamMemberUpdate = TablesUpdate<"team_members">;

export type ProjectTeamMember = Tables<"project_team_members">;

// Extended team member with project assignments
export type TeamMemberWithProjects = TeamMember & {
  projects: Array<{
    project_id: string;
    hours_logged: number;
    project: { name: string; display_id: string } | null;
  }>;
};

// Fetch all team members for the current organization
export function useTeamMembers() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_members", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch team members with their project assignments
export function useTeamMembersWithProjects() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_members", "with-projects", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (membersError) throw membersError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("project_team_members")
        .select(`
          project_id,
          team_member_id,
          hours_logged,
          project:projects(name, display_id)
        `);

      if (assignmentsError) throw assignmentsError;

      // Group assignments by team member
      const memberProjects = new Map<string, typeof assignments>();
      assignments?.forEach((assignment) => {
        const existing = memberProjects.get(assignment.team_member_id) || [];
        existing.push(assignment);
        memberProjects.set(assignment.team_member_id, existing);
      });

      return (members || []).map((member) => ({
        ...member,
        projects: memberProjects.get(member.id) || [],
      })) as TeamMemberWithProjects[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single team member (filtered by organization)
export function useTeamMember(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_members", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError) throw memberError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("project_team_members")
        .select(`
          project_id,
          hours_logged,
          project:projects(name, display_id)
        `)
        .eq("team_member_id", id);

      if (assignmentsError) throw assignmentsError;

      return {
        ...member,
        projects: assignments || [],
      } as TeamMemberWithProjects;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch team members by project (filtered by organization)
export function useTeamMembersByProject(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_members", "project", projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      // Verify project belongs to organization
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("organization_id", organization.id)
        .single();

      if (projectError || !project) return [];

      const { data, error } = await supabase
        .from("project_team_members")
        .select(`
          hours_logged,
          team_member:team_members(*)
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data?.map((d) => ({
        ...d.team_member,
        hours_on_project: d.hours_logged,
      })) || [];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

// Create team member (for invitations - regular team members are created via auth)
export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (member: Omit<TeamMemberInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      // Generate avatar from name
      if (!member.avatar && member.name) {
        member.avatar = member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }

      const { data, error } = await supabase
        .from("team_members")
        .insert({ ...member, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add team member: " + error.message);
    },
  });
}

// Update team member (filtered by organization)
export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TeamMemberUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["team_members", data.id] });
      toast.success("Team member updated");
    },
    onError: (error) => {
      toast.error("Failed to update team member: " + error.message);
    },
  });
}

// Delete team member (filtered by organization)
export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member removed");
    },
    onError: (error) => {
      toast.error("Failed to remove team member: " + error.message);
    },
  });
}

// Assign team member to project
export function useAssignTeamMemberToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      teamMemberId,
      hoursLogged = 0,
    }: {
      projectId: string;
      teamMemberId: string;
      hoursLogged?: number;
    }) => {
      const { data, error } = await supabase
        .from("project_team_members")
        .insert({
          project_id: projectId,
          team_member_id: teamMemberId,
          hours_logged: hoursLogged,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Team member assigned to project");
    },
    onError: (error) => {
      toast.error("Failed to assign team member: " + error.message);
    },
  });
}

// Remove team member from project
export function useRemoveTeamMemberFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      teamMemberId,
    }: {
      projectId: string;
      teamMemberId: string;
    }) => {
      const { error } = await supabase
        .from("project_team_members")
        .delete()
        .eq("project_id", projectId)
        .eq("team_member_id", teamMemberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Team member removed from project");
    },
    onError: (error) => {
      toast.error("Failed to remove team member from project: " + error.message);
    },
  });
}
