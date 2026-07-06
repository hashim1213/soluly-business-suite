import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type TemplateCategory = "consulting" | "supply_chain" | "maintenance" | "software" | "general";

export interface TemplateStatus {
  name: string;
  category: "todo" | "in_progress" | "done";
  color: string;
}

export interface TemplateMilestone {
  title: string;
  description?: string;
  offset_days: number;
}

export interface TemplateTask {
  title: string;
  priority: "high" | "medium" | "low";
}

export interface ProjectTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  default_statuses: TemplateStatus[];
  default_milestones: TemplateMilestone[];
  default_tasks: TemplateTask[];
  settings: Record<string, unknown>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export const SYSTEM_TEMPLATES: Omit<ProjectTemplate, "id" | "organization_id" | "created_at" | "updated_at">[] = [
  {
    name: "Consulting Engagement",
    description: "Standard consulting project with discovery, delivery, and handoff phases",
    category: "consulting",
    is_system: true,
    default_statuses: [
      { name: "Backlog", category: "todo", color: "#DFE1E6" },
      { name: "Discovery", category: "in_progress", color: "#6554C0" },
      { name: "In Progress", category: "in_progress", color: "#0052CC" },
      { name: "Client Review", category: "in_progress", color: "#FF991F" },
      { name: "Delivered", category: "done", color: "#36B37E" },
    ],
    default_milestones: [
      { title: "Discovery Complete", description: "Initial assessment and requirements gathering", offset_days: 14 },
      { title: "Solution Design Approved", description: "Client signs off on approach", offset_days: 28 },
      { title: "Implementation Complete", description: "Core deliverables ready", offset_days: 60 },
      { title: "Knowledge Transfer", description: "Training and documentation handoff", offset_days: 75 },
      { title: "Project Close", description: "Final sign-off and retro", offset_days: 90 },
    ],
    default_tasks: [
      { title: "Stakeholder interviews", priority: "high" },
      { title: "Current state assessment", priority: "high" },
      { title: "Gap analysis", priority: "medium" },
      { title: "Solution design document", priority: "high" },
      { title: "Implementation plan", priority: "medium" },
      { title: "Training materials", priority: "medium" },
      { title: "Handoff documentation", priority: "low" },
    ],
    settings: { default_sprint_length_weeks: 2, billable: true },
  },
  {
    name: "Supply Chain Implementation",
    description: "End-to-end supply chain process implementation with phased rollout",
    category: "supply_chain",
    is_system: true,
    default_statuses: [
      { name: "Backlog", category: "todo", color: "#DFE1E6" },
      { name: "Analysis", category: "in_progress", color: "#6554C0" },
      { name: "Design", category: "in_progress", color: "#0052CC" },
      { name: "Implementation", category: "in_progress", color: "#00B8D9" },
      { name: "Testing", category: "in_progress", color: "#FF991F" },
      { name: "Deployed", category: "done", color: "#36B37E" },
    ],
    default_milestones: [
      { title: "Process Mapping Complete", offset_days: 21 },
      { title: "System Requirements Signed Off", offset_days: 35 },
      { title: "Integration Architecture Approved", offset_days: 49 },
      { title: "UAT Complete", offset_days: 84 },
      { title: "Go-Live", offset_days: 98 },
      { title: "Hypercare Complete", offset_days: 112 },
    ],
    default_tasks: [
      { title: "Map current supply chain processes", priority: "high" },
      { title: "Identify bottlenecks and waste", priority: "high" },
      { title: "Define KPIs and metrics", priority: "high" },
      { title: "Vendor evaluation", priority: "medium" },
      { title: "Integration requirements", priority: "high" },
      { title: "Data migration plan", priority: "medium" },
      { title: "Change management plan", priority: "medium" },
      { title: "Training curriculum", priority: "medium" },
      { title: "Go-live checklist", priority: "high" },
      { title: "Hypercare runbook", priority: "low" },
    ],
    settings: { default_sprint_length_weeks: 2, billable: true, requires_change_management: true },
  },
  {
    name: "Maintenance Retainer",
    description: "Ongoing support and maintenance engagement",
    category: "maintenance",
    is_system: true,
    default_statuses: [
      { name: "Reported", category: "todo", color: "#DFE1E6" },
      { name: "Triaged", category: "todo", color: "#FFAB00" },
      { name: "In Progress", category: "in_progress", color: "#0052CC" },
      { name: "Awaiting Client", category: "in_progress", color: "#FF991F" },
      { name: "Resolved", category: "done", color: "#36B37E" },
    ],
    default_milestones: [
      { title: "Monthly Review", offset_days: 30 },
      { title: "Quarterly Business Review", offset_days: 90 },
    ],
    default_tasks: [
      { title: "SLA compliance review", priority: "high" },
      { title: "Incident report preparation", priority: "medium" },
      { title: "Capacity planning review", priority: "low" },
    ],
    settings: { default_sprint_length_weeks: 1, billable: true, is_retainer: true },
  },
  {
    name: "Software Development",
    description: "Agile software development project with standard SDLC workflow",
    category: "software",
    is_system: true,
    default_statuses: [
      { name: "Backlog", category: "todo", color: "#DFE1E6" },
      { name: "Ready", category: "todo", color: "#B3D4FF" },
      { name: "In Development", category: "in_progress", color: "#0052CC" },
      { name: "Code Review", category: "in_progress", color: "#6554C0" },
      { name: "QA", category: "in_progress", color: "#FF991F" },
      { name: "Done", category: "done", color: "#36B37E" },
    ],
    default_milestones: [
      { title: "Sprint 1 Complete", offset_days: 14 },
      { title: "MVP Release", offset_days: 42 },
      { title: "Beta Release", offset_days: 70 },
      { title: "Production Release", offset_days: 84 },
    ],
    default_tasks: [
      { title: "Technical architecture", priority: "high" },
      { title: "Development environment setup", priority: "high" },
      { title: "CI/CD pipeline", priority: "medium" },
      { title: "Testing strategy", priority: "medium" },
      { title: "Release plan", priority: "low" },
    ],
    settings: { default_sprint_length_weeks: 2, billable: false },
  },
];

export function useProjectTemplates() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project-templates", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("organization_id", organization.id)
        .order("category", { ascending: true });

      if (error) throw error;
      return data as ProjectTemplate[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateProjectTemplate() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<ProjectTemplate, "id" | "organization_id" | "created_at" | "updated_at">) => {
      if (!organization?.id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("project_templates")
        .insert({ ...input, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast.success("Template created");
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });
}

export function useSeedSystemTemplates() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization");

      const existing = await supabase
        .from("project_templates")
        .select("name")
        .eq("organization_id", organization.id)
        .eq("is_system", true);

      if (existing.error) throw existing.error;
      const existingNames = new Set((existing.data || []).map((t) => t.name));

      const toInsert = SYSTEM_TEMPLATES
        .filter((t) => !existingNames.has(t.name))
        .map((t) => ({ ...t, organization_id: organization.id }));

      if (toInsert.length === 0) return [];

      const { data, error } = await supabase
        .from("project_templates")
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data as ProjectTemplate[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
    },
  });
}
