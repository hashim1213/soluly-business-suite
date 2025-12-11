import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Permissions, Permission } from "@/integrations/supabase/types";

type Organization = Tables<"organizations">;
type Role = Tables<"roles">;
type TeamMember = Tables<"team_members">;

// Default permissions for unauthenticated users (none)
const defaultPermissions: Permissions = {
  dashboard: { view: false },
  projects: { view: false, create: false, edit: false, delete: false },
  tickets: { view: false, create: false, edit: false, delete: false },
  team: { view: false, create: false, edit: false, delete: false },
  crm: { view: false, create: false, edit: false, delete: false },
  quotes: { view: false, create: false, edit: false, delete: false },
  features: { view: false, create: false, edit: false, delete: false },
  feedback: { view: false, create: false, edit: false, delete: false },
  emails: { view: false, create: false, edit: false, delete: false },
  settings: { view: false, manage_org: false, manage_users: false, manage_roles: false },
};

// Auth timeout constants
const AUTH_TIMEOUT = {
  DEFAULT: 10000,
  RPC: 15000,
  DEBOUNCE: 100,
  RETRY_DELAY: 500,
} as const;

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  member: TeamMember | null;
  organization: Organization | null;
  role: Role | null;
  permissions: Permissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, orgName: string, orgSlug: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  acceptInvitation: (token: string, password: string, name: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;

  // Permission helpers
  hasPermission: (resource: keyof Permissions, action: string) => boolean;
  canViewOwn: (resource: keyof Permissions) => boolean;

  // Refresh data
  refreshUserData: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
    ),
  ]);
}

// Safe localStorage operations
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refs to prevent duplicate operations
  const isInitialized = useRef(false);
  const isFetchingUserData = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch user's team member, organization, and role data
  const fetchUserData = useCallback(async (userId: string): Promise<boolean> => {
    // Prevent duplicate fetches for the same user
    if (isFetchingUserData.current && lastFetchedUserId.current === userId) {
      return false;
    }

    isFetchingUserData.current = true;
    lastFetchedUserId.current = userId;

    try {
      // Get team member linked to this auth user with timeout
      const { data: memberData, error: memberError } = await withTimeout(
        supabase
          .from("team_members")
          .select("*")
          .eq("auth_user_id", userId)
          .maybeSingle(),
        AUTH_TIMEOUT.DEFAULT
      );

      if (memberError) {
        setAuthError("Failed to load user data. Please try again.");
        return false;
      }

      if (!memberData) {
        // This is not an error - user might need to create an org
        return false;
      }

      setMember(memberData);

      // Get organization
      if (memberData.organization_id) {
        const { data: orgData, error: orgError } = await withTimeout(
          supabase
            .from("organizations")
            .select("*")
            .eq("id", memberData.organization_id)
            .maybeSingle(),
          AUTH_TIMEOUT.DEFAULT
        );

        if (!orgError && orgData) {
          setOrganization(orgData);
        }
      }

      // Get role and permissions
      if (memberData.role_id) {
        const { data: roleData, error: roleError } = await withTimeout(
          supabase
            .from("roles")
            .select("*")
            .eq("id", memberData.role_id)
            .maybeSingle(),
          AUTH_TIMEOUT.DEFAULT
        );

        if (!roleError && roleData) {
          setRole(roleData);
          setPermissions(roleData.permissions as Permissions);
        }
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "Operation timed out") {
        setAuthError("Request timed out. Please check your connection and try again.");
      } else {
        setAuthError("Failed to load user data. Please try again.");
      }
      return false;
    } finally {
      isFetchingUserData.current = false;
    }
  }, []);

  // Complete pending signup after email confirmation
  const completePendingSignup = useCallback(async (userId: string): Promise<boolean> => {
    const pendingData = safeStorage.getItem("pending_signup");

    if (!pendingData) {
      return false;
    }

    try {
      const data = JSON.parse(pendingData);

      // Check if org already exists for this user
      const { data: existingMember } = await withTimeout(
        supabase
          .from("team_members")
          .select("id, organization_id")
          .eq("auth_user_id", userId)
          .maybeSingle(),
        AUTH_TIMEOUT.DEFAULT
      );

      if (existingMember) {
        safeStorage.removeItem("pending_signup");
        return true;
      }

      const { data: result, error: rpcError } = await withTimeout(
        supabase.rpc("handle_new_user_signup", {
          p_user_id: userId,
          p_email: data.email,
          p_name: data.name,
          p_org_name: data.org_name,
          p_org_slug: data.org_slug,
        }),
        AUTH_TIMEOUT.RPC
      );

      if (rpcError) {
        return false;
      }

      const response = result as { success: boolean; error?: string; organization_id?: string };
      if (!response?.success) {
        return false;
      }

      safeStorage.removeItem("pending_signup");
      return true;
    } catch {
      return false;
    }
  }, []);

  // Initialize auth state - only runs once
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT.DEFAULT
        );

        if (error) {
          setAuthError("Failed to initialize authentication.");
          setIsLoading(false);
          return;
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Try to complete any pending signup first
          await completePendingSignup(session.user.id);
          // Then fetch user data
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Operation timed out") {
          setAuthError("Connection timed out. Please refresh the page.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - use a debounced handler to prevent rapid updates
    let authChangeTimeout: NodeJS.Timeout | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Clear any pending auth change handling
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }

      // Debounce auth state changes to prevent rapid updates
      authChangeTimeout = setTimeout(async () => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // On SIGNED_IN, try to complete pending signup
          if (event === "SIGNED_IN") {
            await completePendingSignup(newSession.user.id);
          }
          await fetchUserData(newSession.user.id);
        } else {
          // Clear user data on sign out
          setMember(null);
          setOrganization(null);
          setRole(null);
          setPermissions(defaultPermissions);
          lastFetchedUserId.current = null;
        }

        setIsLoading(false);
      }, AUTH_TIMEOUT.DEBOUNCE);
    });

    return () => {
      mounted = false;
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserData, completePendingSignup]);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT.RPC
      );

      if (error) {
        setIsLoading(false);

        if (error.message === "Invalid login credentials") {
          return { error: "Invalid email or password. Please check your credentials and try again." };
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: "Please check your email and click the confirmation link before signing in." };
        }
        return { error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { error: "Failed to sign in" };
      }

      // Fetch user data with retries
      let success = false;
      for (let i = 0; i < 3; i++) {
        success = await fetchUserData(data.user.id);
        if (success) break;
        await new Promise(resolve => setTimeout(resolve, AUTH_TIMEOUT.RETRY_DELAY));
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);

      if (error instanceof Error && error.message === "Operation timed out") {
        return { error: "Sign in timed out. Please check your connection and try again." };
      }
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  };

  // Sign up and create organization
  const signUp = async (
    email: string,
    password: string,
    name: string,
    orgName: string,
    orgSlug: string
  ): Promise<{ error: string | null }> => {
    setAuthError(null);

    try {
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, org_name: orgName, org_slug: orgSlug },
          },
        }),
        AUTH_TIMEOUT.RPC
      );

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: "Failed to create account" };
      }

      // Store pending signup data
      safeStorage.setItem("pending_signup", JSON.stringify({
        user_id: authData.user.id,
        email,
        name,
        org_name: orgName,
        org_slug: orgSlug,
      }));

      // Try to create org immediately
      try {
        const { data: result, error: rpcError } = await withTimeout(
          supabase.rpc("handle_new_user_signup", {
            p_user_id: authData.user.id,
            p_email: email,
            p_name: name,
            p_org_name: orgName,
            p_org_slug: orgSlug,
          }),
          AUTH_TIMEOUT.RPC
        );

        if (!rpcError) {
          const response = result as { success: boolean };
          if (response?.success) {
            safeStorage.removeItem("pending_signup");
          }
        }
      } catch {
        // Org will be created after email confirmation
      }

      return { error: null };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation timed out") {
        return { error: "Sign up timed out. Please check your connection and try again." };
      }
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  };

  // Accept invitation and create account
  const acceptInvitation = async (
    token: string,
    password: string,
    name: string
  ): Promise<{ error: string | null }> => {
    setAuthError(null);

    try {
      // Get invitation by token
      const { data: invitation, error: invError } = await withTimeout(
        supabase
          .from("invitations")
          .select("email, expires_at")
          .eq("token", token)
          .is("accepted_at", null)
          .single(),
        AUTH_TIMEOUT.DEFAULT
      );

      if (invError || !invitation) {
        return { error: "Invalid or expired invitation" };
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return { error: "This invitation has expired" };
      }

      // Create auth user
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({ email: invitation.email, password }),
        AUTH_TIMEOUT.RPC
      );

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: "Failed to create account" };
      }

      // Accept invitation via RPC
      const { data: result, error: rpcError } = await withTimeout(
        supabase.rpc("handle_invitation_acceptance", {
          p_user_id: authData.user.id,
          p_token: token,
          p_name: name,
        }),
        AUTH_TIMEOUT.RPC
      );

      if (rpcError) {
        return { error: rpcError.message || "Failed to accept invitation" };
      }

      const response = result as { success: boolean; error?: string };
      if (!response || !response.success) {
        return { error: response?.error || "Failed to accept invitation" };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation timed out") {
        return { error: "Request timed out. Please try again." };
      }
      return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Continue with state cleanup even if signOut fails
    }

    // Always clear state
    setUser(null);
    setSession(null);
    setMember(null);
    setOrganization(null);
    setRole(null);
    setPermissions(defaultPermissions);
    setAuthError(null);
    lastFetchedUserId.current = null;
  };

  // Reset password (send email)
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        AUTH_TIMEOUT.RPC
      );

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation timed out") {
        return { error: "Request timed out. Please try again." };
      }
      return { error: "An unexpected error occurred" };
    }
  };

  // Update password
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        AUTH_TIMEOUT.RPC
      );

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation timed out") {
        return { error: "Request timed out. Please try again." };
      }
      return { error: "An unexpected error occurred" };
    }
  };

  // Check if user has permission for a resource action
  const hasPermission = (resource: keyof Permissions, action: string): boolean => {
    const resourcePerms = permissions[resource];
    if (!resourcePerms) return false;

    const permission = (resourcePerms as Record<string, Permission>)[action];
    if (permission === undefined) return false;

    return permission === true || permission === "own";
  };

  // Check if user can only view their own records
  const canViewOwn = (resource: keyof Permissions): boolean => {
    const resourcePerms = permissions[resource];
    if (!resourcePerms) return false;

    return (resourcePerms as Record<string, Permission>).view === "own";
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    member,
    organization,
    role,
    permissions,
    isLoading,
    authError,
    isAuthenticated: !!user && !!member && !!organization,
    signIn,
    signUp,
    signOut,
    acceptInvitation,
    resetPassword,
    updatePassword,
    hasPermission,
    canViewOwn,
    refreshUserData,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
