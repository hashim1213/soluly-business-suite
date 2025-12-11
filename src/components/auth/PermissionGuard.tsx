import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Permissions } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  resource: keyof Permissions;
  action: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function PermissionGuard({
  children,
  resource,
  action,
  fallback,
  redirectTo,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  // While loading, show nothing or a placeholder
  if (isLoading) {
    return null;
  }

  // Check if user has permission
  if (!hasPermission(resource, action)) {
    // If redirect is specified, redirect there
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // If fallback is provided, show it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback: access denied message
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// HOC version for wrapping entire components
export function withPermission<P extends object>(
  resource: keyof Permissions,
  action: string,
  redirectTo?: string
) {
  return function(Component: React.ComponentType<P>) {
    return function PermissionProtectedComponent(props: P) {
      return (
        <PermissionGuard resource={resource} action={action} redirectTo={redirectTo}>
          <Component {...props} />
        </PermissionGuard>
      );
    };
  };
}

// Component to conditionally render based on permission
interface CanProps {
  children: ReactNode;
  resource: keyof Permissions;
  action: string;
  fallback?: ReactNode;
}

export function Can({ children, resource, action, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Component to conditionally render for "own" permission level
interface CanOwnProps {
  children: ReactNode;
  resource: keyof Permissions;
  ownerId: string | null | undefined;
  fallback?: ReactNode;
}

export function CanOwn({ children, resource, ownerId, fallback = null }: CanOwnProps) {
  const { hasPermission, canViewOwn, member } = useAuth();

  // If user has full permission, show the content
  if (hasPermission(resource, "view") && !canViewOwn(resource)) {
    return <>{children}</>;
  }

  // If user can only view own, check if they own this resource
  if (canViewOwn(resource) && ownerId && member && ownerId === member.id) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
