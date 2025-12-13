import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectAccessUser {
  id: string; // team_member id
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  accessType: "full" | "project_scoped" | "team_assigned";
  accessSource: string; // Description of how they got access
  isOwner: boolean;
  canRemove: boolean;
}

/**
 * Hook to fetch all users who have access to a specific project
 * This includes:
 * 1. Users with full access (no project restrictions)
 * 2. Users with this project in their allowed_project_ids
 * 3. Users assigned via project_team_members table
 */
export function useProjectAccessList(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_access", projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      // Fetch all team members with their roles
      const { data: teamMembers, error: tmError } = await supabase
        .from("team_members")
        .select(`
          id,
          name,
          email,
          role,
          avatar,
          is_owner,
          allowed_project_ids,
          role_id,
          roles:roles(
            id,
            name,
            project_scope
          )
        `)
        .eq("organization_id", organization.id)
        .eq("status", "active");

      if (tmError) throw tmError;

      // Fetch project team member assignments
      const { data: projectAssignments, error: paError } = await supabase
        .from("project_team_members")
        .select("team_member_id")
        .eq("project_id", projectId);

      if (paError) throw paError;

      const assignedMemberIds = new Set(projectAssignments?.map((p) => p.team_member_id) || []);

      // Build access list
      const accessList: ProjectAccessUser[] = [];
      const addedIds = new Set<string>();

      for (const member of teamMembers || []) {
        const roleData = member.roles as { id: string; name: string; project_scope: string[] | null } | null;
        const memberProjectIds = member.allowed_project_ids as string[] | null;
        const roleProjectScope = roleData?.project_scope;

        // Determine access type
        let hasAccess = false;
        let accessType: ProjectAccessUser["accessType"] = "full";
        let accessSource = "";
        let canRemove = false;

        // Check if owner - always has full access
        if (member.is_owner) {
          hasAccess = true;
          accessType = "full";
          accessSource = "Organization Owner";
          canRemove = false;
        }
        // Check if member has specific project assignments that include this project
        else if (memberProjectIds !== null) {
          if (memberProjectIds.includes(projectId)) {
            hasAccess = true;
            accessType = "project_scoped";
            accessSource = "Direct project assignment";
            canRemove = true;
          }
        }
        // Check role's project scope
        else if (roleProjectScope !== null) {
          if (roleProjectScope.includes(projectId)) {
            hasAccess = true;
            accessType = "project_scoped";
            accessSource = `Via ${roleData?.name || "role"} (role-based)`;
            canRemove = true;
          }
        }
        // User has no restrictions - full access
        else {
          hasAccess = true;
          accessType = "full";
          accessSource = `Via ${roleData?.name || "role"} (full access)`;
          canRemove = false;
        }

        // Also check if assigned via project_team_members
        if (assignedMemberIds.has(member.id)) {
          if (!hasAccess) {
            hasAccess = true;
            accessType = "team_assigned";
            accessSource = "Assigned to project team";
            canRemove = true;
          } else if (accessSource) {
            accessSource += " + Team assignment";
          }
        }

        if (hasAccess && !addedIds.has(member.id)) {
          addedIds.add(member.id);
          accessList.push({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            avatar: member.avatar,
            accessType,
            accessSource,
            isOwner: member.is_owner,
            canRemove,
          });
        }
      }

      // Sort: owners first, then full access, then project scoped
      return accessList.sort((a, b) => {
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;
        if (a.accessType === "full" && b.accessType !== "full") return -1;
        if (a.accessType !== "full" && b.accessType === "full") return 1;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!projectId && !!organization?.id,
  });
}

/**
 * Hook to fetch team members who DON'T have access to this project
 * (for adding new access)
 */
export function useTeamMembersWithoutAccess(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_members_without_access", projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      // Fetch all team members with their roles
      const { data: teamMembers, error: tmError } = await supabase
        .from("team_members")
        .select(`
          id,
          name,
          email,
          role,
          avatar,
          is_owner,
          allowed_project_ids,
          role_id,
          roles:roles(
            id,
            name,
            project_scope
          )
        `)
        .eq("organization_id", organization.id)
        .eq("status", "active");

      if (tmError) throw tmError;

      // Find members without access to this project
      const membersWithoutAccess = [];

      for (const member of teamMembers || []) {
        const roleData = member.roles as { id: string; name: string; project_scope: string[] | null } | null;
        const memberProjectIds = member.allowed_project_ids as string[] | null;
        const roleProjectScope = roleData?.project_scope;

        // Check if they already have access
        let hasAccess = false;

        if (member.is_owner) {
          hasAccess = true;
        } else if (memberProjectIds !== null) {
          hasAccess = memberProjectIds.includes(projectId);
        } else if (roleProjectScope !== null) {
          hasAccess = roleProjectScope.includes(projectId);
        } else {
          // No restrictions = full access
          hasAccess = true;
        }

        if (!hasAccess) {
          membersWithoutAccess.push({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            avatar: member.avatar,
            roleName: roleData?.name || member.role,
          });
        }
      }

      return membersWithoutAccess;
    },
    enabled: !!projectId && !!organization?.id,
  });
}

/**
 * Grant project access to a team member by adding to their allowed_project_ids
 */
export function useGrantProjectAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamMemberId, projectId }: { teamMemberId: string; projectId: string }) => {
      // First get current allowed_project_ids
      const { data: member, error: fetchError } = await supabase
        .from("team_members")
        .select("allowed_project_ids")
        .eq("id", teamMemberId)
        .single();

      if (fetchError) throw fetchError;

      const currentIds = (member.allowed_project_ids as string[]) || [];

      // If they don't have any restrictions, we need to initialize their allowed_project_ids
      // with just this project (this restricts them to only this project)
      // But if they already have restrictions, just add this project
      const newIds = currentIds.includes(projectId)
        ? currentIds
        : [...currentIds, projectId];

      const { error: updateError } = await supabase
        .from("team_members")
        .update({ allowed_project_ids: newIds })
        .eq("id", teamMemberId);

      if (updateError) throw updateError;

      return { teamMemberId, projectId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_access", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["team_members_without_access", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Project access granted");
    },
    onError: (error) => {
      toast.error("Failed to grant access: " + error.message);
    },
  });
}

/**
 * Revoke project access from a team member
 */
export function useRevokeProjectAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamMemberId, projectId }: { teamMemberId: string; projectId: string }) => {
      // First get current allowed_project_ids
      const { data: member, error: fetchError } = await supabase
        .from("team_members")
        .select("allowed_project_ids")
        .eq("id", teamMemberId)
        .single();

      if (fetchError) throw fetchError;

      const currentIds = (member.allowed_project_ids as string[]) || [];
      const newIds = currentIds.filter((id) => id !== projectId);

      const { error: updateError } = await supabase
        .from("team_members")
        .update({ allowed_project_ids: newIds })
        .eq("id", teamMemberId);

      if (updateError) throw updateError;

      // Also remove from project_team_members if assigned
      await supabase
        .from("project_team_members")
        .delete()
        .eq("project_id", projectId)
        .eq("team_member_id", teamMemberId);

      return { teamMemberId, projectId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_access", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["team_members_without_access", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project_team_members", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Project access revoked");
    },
    onError: (error) => {
      toast.error("Failed to revoke access: " + error.message);
    },
  });
}
