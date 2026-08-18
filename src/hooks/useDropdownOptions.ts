import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type DropdownOptionRow = Tables<"dropdown_options">;

export interface DropdownOption {
  value: string;
  label: string;
  color: string | null;
  position: number;
  id?: string;
}

export type DropdownType =
  | "lead_status"
  | "crm_activity_type"
  | "ticket_type"
  | "ticket_category"
  | "ticket_priority"
  | "ticket_status"
  | "project_status"
  | "feature_status"
  | "feature_priority";

// Every customizable dropdown in the app, with its built-in options. These
// are what users see until they customize a list in Settings, and what new
// records default to. Values match the original database enum values so
// existing data keeps working.
export const DROPDOWN_REGISTRY: Record<
  DropdownType,
  { title: string; module: string; description: string; defaults: DropdownOption[] }
> = {
  lead_status: {
    title: "Lead Status",
    module: "CRM",
    description: "Statuses available for leads in the CRM",
    defaults: [
      { value: "new", label: "New", color: "#2563EB", position: 0 },
      { value: "contacted", label: "Contacted", color: "#F59E0B", position: 1 },
      { value: "qualified", label: "Qualified", color: "#9333EA", position: 2 },
      { value: "converted", label: "Converted", color: "#059669", position: 3 },
      { value: "lost", label: "Lost", color: "#DC2626", position: 4 },
    ],
  },
  crm_activity_type: {
    title: "Activity Type",
    module: "CRM",
    description: "Types for logged activities on deals",
    defaults: [
      { value: "call", label: "Call", color: null, position: 0 },
      { value: "email", label: "Email", color: null, position: 1 },
      { value: "meeting", label: "Meeting", color: null, position: 2 },
      { value: "note", label: "Note", color: null, position: 3 },
    ],
  },
  ticket_type: {
    title: "Ticket Type",
    module: "Tickets",
    description: "Work item types for tickets",
    defaults: [
      { value: "epic", label: "Epic", color: null, position: 0 },
      { value: "story", label: "Story", color: null, position: 1 },
      { value: "task", label: "Task", color: null, position: 2 },
      { value: "subtask", label: "Subtask", color: null, position: 3 },
      { value: "bug", label: "Bug", color: null, position: 4 },
    ],
  },
  ticket_category: {
    title: "Ticket Category",
    module: "Tickets",
    description: "Categories for incoming tickets",
    defaults: [
      { value: "feature", label: "Feature Request", color: null, position: 0 },
      { value: "quote", label: "Customer Quote", color: null, position: 1 },
      { value: "feedback", label: "Feedback", color: null, position: 2 },
      { value: "issue", label: "Issue", color: null, position: 3 },
    ],
  },
  ticket_priority: {
    title: "Ticket Priority",
    module: "Tickets",
    description: "Priority levels for tickets",
    defaults: [
      { value: "high", label: "High", color: "#DC2626", position: 0 },
      { value: "medium", label: "Medium", color: "#F59E0B", position: 1 },
      { value: "low", label: "Low", color: "#059669", position: 2 },
    ],
  },
  ticket_status: {
    title: "Ticket Status",
    module: "Tickets",
    description: "Workflow statuses for tickets",
    defaults: [
      { value: "open", label: "Open", color: "#2563EB", position: 0 },
      { value: "in-progress", label: "In Progress", color: "#9333EA", position: 1 },
      { value: "pending", label: "Pending", color: "#F59E0B", position: 2 },
      { value: "closed", label: "Closed", color: "#6B7280", position: 3 },
    ],
  },
  project_status: {
    title: "Project Status",
    module: "Projects",
    description: "Lifecycle statuses for projects",
    defaults: [
      { value: "pending", label: "Pending", color: "#F59E0B", position: 0 },
      { value: "active", label: "Active", color: "#059669", position: 1 },
      { value: "on_hold", label: "On Hold", color: "#6B7280", position: 2 },
      { value: "maintenance", label: "Maintenance", color: "#2563EB", position: 3 },
      { value: "completed", label: "Completed", color: "#9333EA", position: 4 },
      { value: "cancelled", label: "Cancelled", color: "#DC2626", position: 5 },
    ],
  },
  feature_status: {
    title: "Feature Status",
    module: "Features",
    description: "Statuses for feature requests",
    defaults: [
      { value: "backlog", label: "Backlog", color: "#6B7280", position: 0 },
      { value: "in-review", label: "In Review", color: "#F59E0B", position: 1 },
      { value: "planned", label: "Planned", color: "#2563EB", position: 2 },
      { value: "in-progress", label: "In Progress", color: "#9333EA", position: 3 },
      { value: "completed", label: "Completed", color: "#059669", position: 4 },
    ],
  },
  feature_priority: {
    title: "Feature Priority",
    module: "Features",
    description: "Priority levels for feature requests",
    defaults: [
      { value: "high", label: "High", color: "#DC2626", position: 0 },
      { value: "medium", label: "Medium", color: "#F59E0B", position: 1 },
      { value: "low", label: "Low", color: "#059669", position: 2 },
    ],
  },
};

function rowToOption(row: DropdownOptionRow): DropdownOption {
  return {
    id: row.id,
    value: row.value,
    label: row.label,
    color: row.color,
    position: row.position,
  };
}

// Fetch one dropdown's options, falling back to the built-in defaults when
// the organization has not customized that list.
export function useDropdownOptions(type: DropdownType) {
  const { organization } = useAuth();
  const defaults = DROPDOWN_REGISTRY[type].defaults;

  return useQuery({
    queryKey: ["dropdown-options", organization?.id, type],
    queryFn: async () => {
      if (!organization?.id) return defaults;

      const { data, error } = await supabase
        .from("dropdown_options")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("option_type", type)
        .order("position");

      if (error) throw error;
      if (!data || data.length === 0) return defaults;
      return data.map(rowToOption);
    },
    enabled: !!organization?.id,
    placeholderData: defaults,
  });
}

export function optionLabel(options: DropdownOption[] | undefined, value: string): string {
  return options?.find((o) => o.value === value)?.label || value;
}

export function optionColor(options: DropdownOption[] | undefined, value: string): string | null {
  return options?.find((o) => o.value === value)?.color ?? null;
}

// Copies a dropdown's defaults into org-owned rows so they can be edited.
export function useInitializeDropdownOptions() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (type: DropdownType) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("dropdown_options")
        .insert(
          DROPDOWN_REGISTRY[type].defaults.map((o) => ({
            organization_id: organization.id,
            option_type: type,
            value: o.value,
            label: o.label,
            color: o.color,
            position: o.position,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-options", organization?.id, type] });
    },
    onError: (error) => {
      toast.error("Failed to enable customization: " + error.message);
    },
  });
}

export function useCreateDropdownOption() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: { type: DropdownType; label: string; color?: string | null; position: number }) => {
      if (!organization?.id) throw new Error("No organization found");

      const value = input.label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (!value) throw new Error("Option label is required");

      const { data, error } = await supabase
        .from("dropdown_options")
        .insert({
          organization_id: organization.id,
          option_type: input.type,
          value,
          label: input.label,
          color: input.color ?? null,
          position: input.position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-options", organization?.id, input.type] });
      toast.success("Option added");
    },
    onError: (error) => {
      toast.error("Failed to add option: " + error.message);
    },
  });
}

export function useUpdateDropdownOption() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, type, ...updates }: { id: string; type: DropdownType; label?: string; color?: string | null; position?: number }) => {
      const { error } = await supabase
        .from("dropdown_options")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return { type };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-options", organization?.id, result.type] });
    },
    onError: (error) => {
      toast.error("Failed to update option: " + error.message);
    },
  });
}

export function useDeleteDropdownOption() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: DropdownType }) => {
      const { error } = await supabase.from("dropdown_options").delete().eq("id", id);
      if (error) throw error;
      return { type };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dropdown-options", organization?.id, result.type] });
      toast.success("Option removed");
    },
    onError: (error) => {
      toast.error("Failed to remove option: " + error.message);
    },
  });
}
