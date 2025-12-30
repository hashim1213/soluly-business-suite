/**
 * Session Management Hook
 * Handles viewing and revoking user sessions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  is_current: boolean;
}

/**
 * Parse user agent string to get device/browser info
 */
export function parseUserAgent(userAgent: string | null): {
  browser: string;
  os: string;
  device: string;
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  }

  // Simple parsing - in production you might use a library like ua-parser-js
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Browser detection
  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  }

  // OS detection
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
    device = "Mobile";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
    device = userAgent.includes("iPad") ? "Tablet" : "Mobile";
  }

  return { browser, os, device };
}

/**
 * Get all active sessions for current user
 */
export function useUserSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_sessions", user?.id],
    queryFn: async (): Promise<UserSession[]> => {
      if (!user?.id) return [];

      // Get current session token for comparison
      const { data: sessionData } = await supabase.auth.getSession();
      const currentToken = sessionData?.session?.access_token?.slice(-8) || "";

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("last_activity_at", { ascending: false });

      if (error) throw error;

      // Mark current session
      return (data || []).map((session) => ({
        ...session,
        is_current: session.session_token?.endsWith(currentToken) || false,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Create a new session record on login
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error("No active session");

      // Get session token (last 8 chars for identification)
      const sessionToken = sessionData.session.access_token.slice(-8);
      const expiresAt = new Date(
        sessionData.session.expires_at! * 1000
      ).toISOString();

      // Insert or update session record
      const { error } = await supabase.from("user_sessions").upsert(
        {
          user_id: user.id,
          session_token: sessionToken,
          ip_address: null, // Would need server-side to get real IP
          user_agent: navigator.userAgent,
          last_activity_at: new Date().toISOString(),
          expires_at: expiresAt,
        },
        {
          onConflict: "session_token",
        }
      );

      if (error) throw error;

      // Log security event
      await supabase.rpc("log_security_event", {
        p_event_type: "login_success",
        p_event_details: {
          user_agent: navigator.userAgent,
          session_token: sessionToken,
        },
        p_risk_level: "low",
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_sessions"] });
    },
  });
}

/**
 * Update session activity timestamp
 */
export function useUpdateSessionActivity() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const sessionToken = sessionData.session.access_token.slice(-8);

      await supabase
        .from("user_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("session_token", sessionToken);
    },
  });
}

/**
 * Revoke a specific session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Delete the session record
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Log security event
      await supabase.rpc("log_security_event", {
        p_event_type: "session_revoked",
        p_event_details: { session_id: sessionId },
        p_risk_level: "medium",
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_sessions"] });
      toast.success("Session revoked successfully");
    },
    onError: (error) => {
      toast.error("Failed to revoke session: " + error.message);
    },
  });
}

/**
 * Revoke all sessions except current
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error("No active session");

      const currentToken = sessionData.session.access_token.slice(-8);

      // Delete all sessions except current
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", user.id)
        .neq("session_token", currentToken);

      if (error) throw error;

      // Log security event
      await supabase.rpc("log_security_event", {
        p_event_type: "all_sessions_revoked",
        p_event_details: {},
        p_risk_level: "high",
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_sessions"] });
      toast.success("All other sessions have been signed out");
    },
    onError: (error) => {
      toast.error("Failed to revoke sessions: " + error.message);
    },
  });
}
