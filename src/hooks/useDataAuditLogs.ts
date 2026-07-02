/**
 * Data Audit Logs Hook
 * Queries the audit_logs business-data audit trail (insert/update/delete
 * triggers across business tables) for compliance and monitoring.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DataAuditAction = "insert" | "update" | "delete";

export interface DataAuditEntry {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  team_member_id: string | null;
  action: DataAuditAction;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  // Joined data
  team_member?: {
    name: string;
    email: string;
  } | null;
}

export interface DataAuditFilters {
  action?: DataAuditAction | "all";
  resourceType?: string | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

const FETCH_LIMIT = 200;

/**
 * Fetch business-data audit entries, org-scoped, newest first (max 200).
 * Server-side filters: action, resourceType, dateFrom/dateTo.
 * Client-side filter: search (resource type, member name, resource id).
 */
export function useDataAuditLogs(filters: DataAuditFilters = {}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: [
      "data_audit_logs",
      organization?.id,
      filters.action || "all",
      filters.resourceType || "all",
      filters.dateFrom || "",
      filters.dateTo || "",
    ],
    queryFn: async (): Promise<DataAuditEntry[]> => {
      if (!organization?.id) return [];

      let query = supabase
        .from("audit_logs")
        .select(
          `
          *,
          team_member:team_members!team_member_id(name, email)
        `
        )
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(FETCH_LIMIT);

      if (filters.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }

      if (filters.resourceType && filters.resourceType !== "all") {
        query = query.eq("resource_type", filters.resourceType);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59.999Z");
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as unknown as DataAuditEntry[];
    },
    // Search is applied client-side so typing doesn't refetch
    select: (entries: DataAuditEntry[]) => {
      if (!filters.search?.trim()) return entries;
      const q = filters.search.trim().toLowerCase();
      return entries.filter(
        (entry) =>
          entry.resource_type.toLowerCase().includes(q) ||
          (entry.team_member?.name || "").toLowerCase().includes(q) ||
          (entry.resource_id || "").toLowerCase().includes(q)
      );
    },
    enabled: !!organization?.id,
  });
}

/**
 * Action display configuration (colors consistent with app badge styling)
 */
export const dataAuditActionConfig: Record<
  DataAuditAction,
  { label: string; color: string; bgColor: string }
> = {
  insert: { label: "Created", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  update: { label: "Updated", color: "text-blue-600", bgColor: "bg-blue-100" },
  delete: { label: "Deleted", color: "text-red-600", bgColor: "bg-red-100" },
};

/** Fields that are noise in change diffs */
const IGNORED_DIFF_FIELDS = new Set(["updated_at"]);

export interface AuditFieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Diff old_values/new_values of an update entry.
 * Returns only fields whose values actually changed (ignoring updated_at).
 */
export function getChangedFields(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): AuditFieldChange[] {
  if (!oldValues || !newValues) return [];

  const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  const changes: AuditFieldChange[] = [];

  for (const key of keys) {
    if (IGNORED_DIFF_FIELDS.has(key)) continue;
    const oldValue = oldValues[key];
    const newValue = newValues[key];
    if (JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null)) {
      changes.push({ field: key, oldValue, newValue });
    }
  }

  return changes.sort((a, b) => a.field.localeCompare(b.field));
}

/**
 * Render an audit value for display (stringify objects, truncate long values)
 */
export function formatAuditValue(value: unknown, maxLength = 100): string {
  if (value === null || value === undefined || value === "") return "—";
  const str =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

/**
 * "team_members" -> "Team Members"
 */
export function formatResourceType(resourceType: string): string {
  return resourceType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
