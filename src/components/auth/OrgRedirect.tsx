import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import Landing from "@/pages/Landing";

/**
 * Component that redirects to the user's organization workspace
 * Used at the root "/" path to redirect authenticated users to /org/{slug}
 * Also handles completing pending signup after email confirmation
 */
export function OrgRedirect() {
  const { organization, isLoading, user, authError, clearAuthError } = useAuth();
  const location = useLocation();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Form state for creating org
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [userName, setUserName] = useState("");
  const [hasPendingData, setHasPendingData] = useState(false);

  // Check if this is an auth callback (has hash with access_token)
  const isAuthCallback = location.hash.includes("access_token");

  // Try to complete pending signup when we have a user but no org
  useEffect(() => {
    let isMounted = true;

    const tryCompleteSignup = async () => {
      if (!user || organization || isLoading || isSettingUp) return;

      let pendingData: string | null = null;
      try {
        pendingData = localStorage.getItem("pending_signup");
      } catch {
        // Storage unavailable
      }
      if (!pendingData) {
        return;
      }

      if (!isMounted) return;

      setHasPendingData(true);
      setIsSettingUp(true);
      setSetupError(null);

      try {
        const data = JSON.parse(pendingData);

        // Pre-fill form fields in case the RPC fails
        setUserName(data.name || "");
        setOrgName(data.org_name || "");
        setOrgSlug(data.org_slug || "");

        const { data: result, error: rpcError } = await supabase.rpc("handle_new_user_signup", {
          p_user_id: user.id,
          p_email: data.email,
          p_name: data.name,
          p_org_name: data.org_name,
          p_org_slug: data.org_slug,
        });

        if (!isMounted) return;

        if (rpcError) {
          setSetupError(rpcError.message);
          setIsSettingUp(false);
          return;
        }

        const response = result as { success: boolean; error?: string };
        if (!response?.success) {
          setSetupError(response?.error || "Failed to create organization");
          setIsSettingUp(false);
          return;
        }

        try {
          localStorage.removeItem("pending_signup");
        } catch {
          // Ignore storage errors
        }
        // Reload to get fresh auth state
        window.location.reload();
      } catch {
        if (!isMounted) return;
        setSetupError("An error occurred while setting up your organization");
        setIsSettingUp(false);
      }
    };

    tryCompleteSignup();

    return () => {
      isMounted = false;
    };
  }, [user, organization, isLoading, isSettingUp]);

  // Handle org name change - auto-generate slug
  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setOrgSlug(slug);
  };

  // Handle creating org for existing user
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgName || !orgSlug || !userName) return;

    setIsSettingUp(true);
    setSetupError(null);

    try {
      const { data: result, error: rpcError } = await supabase.rpc("handle_new_user_signup", {
        p_user_id: user.id,
        p_email: user.email || "",
        p_name: userName,
        p_org_name: orgName,
        p_org_slug: orgSlug,
      });

      if (rpcError) {
        setSetupError(rpcError.message);
        setIsSettingUp(false);
        return;
      }

      const response = result as { success: boolean; error?: string };
      if (!response?.success) {
        setSetupError(response?.error || "Failed to create organization");
        setIsSettingUp(false);
        return;
      }

      // Reload to get fresh auth state
      window.location.reload();
    } catch {
      setSetupError("An error occurred while creating your organization");
      setIsSettingUp(false);
    }
  };

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
            <h1 className="text-xl font-semibold">Connection Error</h1>
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
              href="/login"
              className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-center"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while auth is initializing or setting up org
  if (isLoading || isSettingUp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isSettingUp ? "Setting up your organization..." : isAuthCallback ? "Confirming your email..." : "Loading..."}
        </p>
      </div>
    );
  }

  // Not logged in - show landing page
  if (!user) {
    return <Landing />;
  }

  // Have user and org - redirect to workspace
  if (organization?.slug) {
    return <Navigate to={`/org/${organization.slug}`} replace />;
  }

  // User exists but no org - show form to create one
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Complete Your Setup</h1>
          <p className="text-sm text-muted-foreground">
            Your account is ready! Create your organization to get started.
          </p>
        </div>

        {setupError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            {setupError}
          </div>
        )}

        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm font-medium">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              placeholder="John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 rounded-md bg-background"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="orgName" className="text-sm font-medium">
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="Acme Inc"
              value={orgName}
              onChange={(e) => handleOrgNameChange(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 rounded-md bg-background"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="orgSlug" className="text-sm font-medium">
              Organization URL
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">/org/</span>
              <input
                id="orgSlug"
                type="text"
                placeholder="acme"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                minLength={3}
                className="flex-1 px-3 py-2 border-2 rounded-md bg-background"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!orgName || !orgSlug || orgSlug.length < 3 || !userName}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            Create Organization
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="text-sm text-muted-foreground hover:underline"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
