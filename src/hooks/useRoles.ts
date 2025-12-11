import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Permissions } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Role = Tables<"roles">;
export type RoleInsert = TablesInsert<"roles">;
export type RoleUpdate = TablesUpdate<"roles">;

// Fetch all roles for the current organization
export function useRoles() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["roles", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("organization_id", organization.id)
        .order("is_system", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Role[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch a single role by ID
export function useRole(roleId: string | undefined) {
  return useQuery({
    queryKey: ["roles", roleId],
    queryFn: async () => {
      if (!roleId) return null;

      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("id", roleId)
        .single();

      if (error) throw error;
      return data as Role;
    },
    enabled: !!roleId,
  });
}

// Create a new role
export function useCreateRole() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (role: Omit<RoleInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("roles")
        .insert({
          ...role,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create role: " + error.message);
    },
  });
}

// Update a role
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: RoleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Role;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", data.id] });
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });
}

// Delete a role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      // Check if role is a system role
      const { data: role } = await supabase
        .from("roles")
        .select("is_system")
        .eq("id", roleId)
        .single();

      if (role?.is_system) {
        throw new Error("Cannot delete system roles");
      }

      // Check if any team members are using this role
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("role_id", roleId);

      if (count && count > 0) {
        throw new Error("Cannot delete role that is assigned to team members");
      }

      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Default permissions template for creating new roles
export const defaultPermissions: Permissions = {
  dashboard: { view: true },
  projects: { view: true, create: false, edit: false, delete: false },
  tickets: { view: true, create: true, edit: false, delete: false },
  team: { view: true, create: false, edit: false, delete: false },
  crm: { view: false, create: false, edit: false, delete: false },
  quotes: { view: false, create: false, edit: false, delete: false },
  features: { view: true, create: false, edit: false, delete: false },
  feedback: { view: true, create: false, edit: false, delete: false },
  emails: { view: false, create: false, edit: false, delete: false },
  settings: { view: true, manage_org: false, manage_users: false, manage_roles: false },
};
