/**
 * Audit Log Hook
 * Queries security events for compliance and monitoring
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "password_change"
  | "password_reset_request"
  | "password_reset_complete"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_backup_code_used"
  | "mfa_backup_codes_regenerated"
  | "api_token_created"
  | "api_token_revoked"
  | "role_assigned"
  | "role_removed"
  | "permission_changed"
  | "member_invited"
  | "member_removed"
  | "organization_settings_changed"
  | "data_export_requested"
  | "suspicious_activity_detected"
  | "session_revoked"
  | "all_sessions_revoked";

export interface SecurityEvent {
  id: string;
  organization_id: string;
  user_id: string | null;
  team_member_id: string | null;
  event_type: SecurityEventType;
  event_details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  risk_level: RiskLevel;
  created_at: string;
  // Joined data
  team_member?: {
    name: string;
    email: string;
  } | null;
}

export interface AuditLogFilters {
  eventType?: SecurityEventType | "all";
  riskLevel?: RiskLevel | "all";
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
}

/**
 * Fetch audit log events with filtering and pagination
 */
export function useAuditLog(
  filters: AuditLogFilters = {},
  pagination: AuditLogPagination = { page: 1, pageSize: 50 }
) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["audit_log", organization?.id, filters, pagination],
    queryFn: async (): Promise<{
      events: SecurityEvent[];
      total: number;
    }> => {
      if (!organization?.id) {
        return { events: [], total: 0 };
      }

      let query = supabase
        .from("security_events")
        .select(
          `
          *,
          team_member:team_members(name, email)
        `,
          { count: "exact" }
        )
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.eventType && filters.eventType !== "all") {
        query = query.eq("event_type", filters.eventType);
      }

      if (filters.riskLevel && filters.riskLevel !== "all") {
        query = query.eq("risk_level", filters.riskLevel);
      }

      if (filters.userId) {
        query = query.eq("team_member_id", filters.userId);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59.999Z");
      }

      // Pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        events: (data || []) as SecurityEvent[],
        total: count || 0,
      };
    },
    enabled: !!organization?.id,
  });
}

/**
 * Get audit log summary stats
 */
export function useAuditLogStats() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["audit_log_stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        return {
          total: 0,
          byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
          last24Hours: 0,
          last7Days: 0,
        };
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get total count
      const { count: total } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      // Get counts by risk level
      const { data: riskData } = await supabase
        .from("security_events")
        .select("risk_level")
        .eq("organization_id", organization.id);

      const byRiskLevel = { low: 0, medium: 0, high: 0, critical: 0 };
      riskData?.forEach((event) => {
        if (event.risk_level in byRiskLevel) {
          byRiskLevel[event.risk_level as RiskLevel]++;
        }
      });

      // Get last 24 hours
      const { count: last24Hours } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", oneDayAgo.toISOString());

      // Get last 7 days
      const { count: last7Days } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      return {
        total: total || 0,
        byRiskLevel,
        last24Hours: last24Hours || 0,
        last7Days: last7Days || 0,
      };
    },
    enabled: !!organization?.id,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Event type labels for display
 */
export const eventTypeLabels: Record<SecurityEventType, string> = {
  login_success: "Successful Login",
  login_failure: "Failed Login",
  logout: "Logout",
  password_change: "Password Changed",
  password_reset_request: "Password Reset Requested",
  password_reset_complete: "Password Reset Completed",
  mfa_enabled: "MFA Enabled",
  mfa_disabled: "MFA Disabled",
  mfa_backup_code_used: "MFA Backup Code Used",
  mfa_backup_codes_regenerated: "MFA Backup Codes Regenerated",
  api_token_created: "API Token Created",
  api_token_revoked: "API Token Revoked",
  role_assigned: "Role Assigned",
  role_removed: "Role Removed",
  permission_changed: "Permission Changed",
  member_invited: "Member Invited",
  member_removed: "Member Removed",
  organization_settings_changed: "Organization Settings Changed",
  data_export_requested: "Data Export Requested",
  suspicious_activity_detected: "Suspicious Activity Detected",
  session_revoked: "Session Revoked",
  all_sessions_revoked: "All Sessions Revoked",
};

/**
 * Risk level configuration
 */
export const riskLevelConfig: Record<
  RiskLevel,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "text-green-600", bgColor: "bg-green-100" },
  medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
  critical: { label: "Critical", color: "text-red-600", bgColor: "bg-red-100" },
};

/**
 * Export audit log to CSV
 */
export async function exportAuditLogCSV(
  organizationId: string,
  filters: AuditLogFilters = {}
): Promise<string> {
  let query = supabase
    .from("security_events")
    .select(
      `
      *,
      team_member:team_members(name, email)
    `
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.eventType && filters.eventType !== "all") {
    query = query.eq("event_type", filters.eventType);
  }
  if (filters.riskLevel && filters.riskLevel !== "all") {
    query = query.eq("risk_level", filters.riskLevel);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo + "T23:59:59.999Z");
  }

  const { data, error } = await query;
  if (error) throw error;

  // Build CSV
  const headers = [
    "Timestamp",
    "Event Type",
    "User",
    "Email",
    "Risk Level",
    "IP Address",
    "Details",
  ];

  const rows = (data || []).map((event: SecurityEvent) => [
    new Date(event.created_at).toISOString(),
    eventTypeLabels[event.event_type] || event.event_type,
    event.team_member?.name || "System",
    event.team_member?.email || "",
    event.risk_level,
    event.ip_address || "",
    JSON.stringify(event.event_details),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
