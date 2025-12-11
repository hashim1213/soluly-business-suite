import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Guard that validates the organization slug in the URL matches the user's org
 * This prevents users from accessing other organizations' data via URL manipulation
 */
export function OrgGuard() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, isLoading, isAuthenticated, authError, clearAuthError } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  // Show auth error with retry option
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Unable to Load Workspace</h1>
            <p className="text-muted-foreground">{authError}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                clearAuthError();
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Validate the slug matches the user's organization
  if (organization?.slug && slug !== organization.slug) {
    // Redirect to the user's actual organization
    return <Navigate to={`/org/${organization.slug}`} replace />;
  }

  return <Outlet />;
}
