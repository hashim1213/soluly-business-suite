import { useAuth } from "@/contexts/AuthContext";
import { Permissions, Permission, ResourcePermissions, SettingsPermissions } from "@/integrations/supabase/types";

export type PermissionAction = "view" | "create" | "edit" | "delete";
export type SettingsAction = "view" | "manage_org" | "manage_users" | "manage_roles";

export function usePermissions() {
  const { teamMember, permissions } = useAuth();

  /**
   * Check if user can perform an action on a resource
   * @param resource - The resource key (e.g., "projects", "crm", "financials")
   * @param action - The action to check (e.g., "view", "create", "edit", "delete")
   * @param ownerId - Optional owner ID for "own" permission checks
   */
  const can = (
    resource: keyof Omit<Permissions, "settings">,
    action: PermissionAction,
    ownerId?: string
  ): boolean => {
    if (!permissions) return false;

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;

    // Handle dashboard which only has "view"
    if (resource === "dashboard") {
      return action === "view" && (resourcePermissions as { view: Permission }).view === true;
    }

    const permission = (resourcePermissions as ResourcePermissions)[action];

    // Permission is explicitly true
    if (permission === true) return true;

    // Permission is "own" - check if current user owns the resource
    if (permission === "own" && ownerId && teamMember?.id) {
      return ownerId === teamMember.id;
    }

    return false;
  };

  /**
   * Check settings permissions
   * @param action - The settings action to check
   */
  const canSettings = (action: SettingsAction): boolean => {
    if (!permissions) return false;
    return permissions.settings?.[action] === true;
  };

  /**
   * Check if user has any access to a resource (at least view)
   */
  const hasAccess = (resource: keyof Omit<Permissions, "settings">): boolean => {
    return can(resource, "view");
  };

  /**
   * Check if user is an admin (has manage_org permission)
   */
  const isAdmin = (): boolean => {
    return canSettings("manage_org");
  };

  /**
   * Check if user can manage roles
   */
  const canManageRoles = (): boolean => {
    return canSettings("manage_roles");
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return canSettings("manage_users");
  };

  /**
   * Get all resources the user has view access to
   */
  const getAccessibleResources = (): (keyof Omit<Permissions, "settings">)[] => {
    if (!permissions) return [];

    const resources: (keyof Omit<Permissions, "settings">)[] = [
      "dashboard",
      "projects",
      "tickets",
      "team",
      "crm",
      "quotes",
      "features",
      "feedback",
      "emails",
      "financials",
      "expenses",
    ];

    return resources.filter((resource) => hasAccess(resource));
  };

  /**
   * Check multiple permissions at once
   */
  const canAny = (
    checks: Array<{ resource: keyof Omit<Permissions, "settings">; action: PermissionAction }>
  ): boolean => {
    return checks.some(({ resource, action }) => can(resource, action));
  };

  /**
   * Check if all specified permissions are granted
   */
  const canAll = (
    checks: Array<{ resource: keyof Omit<Permissions, "settings">; action: PermissionAction }>
  ): boolean => {
    return checks.every(({ resource, action }) => can(resource, action));
  };

  return {
    can,
    canSettings,
    hasAccess,
    isAdmin,
    canManageRoles,
    canManageUsers,
    getAccessibleResources,
    canAny,
    canAll,
    permissions,
  };
}

/**
 * Permission-gated component wrapper
 */
export function PermissionGate({
  resource,
  action,
  ownerId,
  children,
  fallback = null,
}: {
  resource: keyof Omit<Permissions, "settings">;
  action: PermissionAction;
  ownerId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can } = usePermissions();

  if (can(resource, action, ownerId)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Settings permission gate
 */
export function SettingsGate({
  action,
  children,
  fallback = null,
}: {
  action: SettingsAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canSettings } = usePermissions();

  if (canSettings(action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
