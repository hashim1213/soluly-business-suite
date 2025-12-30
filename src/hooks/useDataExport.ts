/**
 * Data Export Hook
 * Generates comprehensive data exports for GDPR compliance
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export interface ExportOptions {
  includeProjects: boolean;
  includeTickets: boolean;
  includeContacts: boolean;
  includeTimeEntries: boolean;
  includeFinancials: boolean;
  includeAuditLog: boolean;
  format: "json" | "csv";
}

export interface ExportProgress {
  status: "idle" | "exporting" | "complete" | "error";
  currentStep: string;
  progress: number;
  totalSteps: number;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeProjects: true,
  includeTickets: true,
  includeContacts: true,
  includeTimeEntries: true,
  includeFinancials: true,
  includeAuditLog: true,
  format: "json",
};

/**
 * Export user/organization data
 */
export function useDataExport() {
  const { organization, member, user } = useAuth();
  const [progress, setProgress] = useState<ExportProgress>({
    status: "idle",
    currentStep: "",
    progress: 0,
    totalSteps: 0,
  });

  const mutation = useMutation({
    mutationFn: async (options: ExportOptions = DEFAULT_OPTIONS) => {
      if (!organization?.id || !member?.id) {
        throw new Error("Not authenticated");
      }

      const exportData: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        user: {
          id: user?.id,
          email: user?.email,
          memberId: member.id,
          name: member.name,
          role: member.role,
        },
      };

      const steps = Object.entries(options).filter(
        ([key, value]) => value === true && key.startsWith("include")
      );
      const totalSteps = steps.length;
      let currentStepIndex = 0;

      const updateProgress = (step: string) => {
        currentStepIndex++;
        setProgress({
          status: "exporting",
          currentStep: step,
          progress: Math.round((currentStepIndex / totalSteps) * 100),
          totalSteps,
        });
      };

      setProgress({
        status: "exporting",
        currentStep: "Starting export...",
        progress: 0,
        totalSteps,
      });

      // Export Projects
      if (options.includeProjects) {
        updateProgress("Exporting projects...");
        const { data: projects } = await supabase
          .from("projects")
          .select(`
            *,
            client:crm_clients(id, name),
            tasks:project_tasks(*),
            milestones:project_milestones(*),
            team_members:project_team_members(
              *,
              team_member:team_members(id, name)
            )
          `)
          .eq("organization_id", organization.id);
        exportData.projects = projects || [];
      }

      // Export Tickets
      if (options.includeTickets) {
        updateProgress("Exporting tickets...");
        const { data: tickets } = await supabase
          .from("tickets")
          .select(`
            *,
            project:projects(id, name, display_id),
            assignee:team_members(id, name),
            comments:comments(*)
          `)
          .eq("organization_id", organization.id);
        exportData.tickets = tickets || [];
      }

      // Export Contacts
      if (options.includeContacts) {
        updateProgress("Exporting contacts...");
        const { data: contacts } = await supabase
          .from("contacts")
          .select(`
            *,
            company:crm_clients(id, name),
            tags:contact_tags(tag:tags(*)),
            activities:contact_activities(*)
          `)
          .eq("organization_id", organization.id);
        exportData.contacts = contacts || [];

        const { data: clients } = await supabase
          .from("crm_clients")
          .select("*")
          .eq("organization_id", organization.id);
        exportData.clients = clients || [];

        const { data: leads } = await supabase
          .from("crm_leads")
          .select("*")
          .eq("organization_id", organization.id);
        exportData.leads = leads || [];
      }

      // Export Time Entries
      if (options.includeTimeEntries) {
        updateProgress("Exporting time entries...");
        const { data: timeEntries } = await supabase
          .from("time_entries")
          .select(`
            *,
            project:projects(id, name, display_id),
            team_member:team_members(id, name)
          `)
          .eq("organization_id", organization.id);
        exportData.timeEntries = timeEntries || [];
      }

      // Export Financials
      if (options.includeFinancials) {
        updateProgress("Exporting financial data...");
        const { data: quotes } = await supabase
          .from("quotes")
          .select(`
            *,
            client:crm_clients(id, name),
            line_items:quote_line_items(*)
          `)
          .eq("organization_id", organization.id);
        exportData.quotes = quotes || [];

        const { data: invoices } = await supabase
          .from("project_invoices")
          .select("*")
          .eq("organization_id", organization.id);
        exportData.invoices = invoices || [];

        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("organization_id", organization.id);
        exportData.payments = payments || [];

        const { data: expenses } = await supabase
          .from("business_costs")
          .select("*")
          .eq("organization_id", organization.id);
        exportData.expenses = expenses || [];
      }

      // Export Audit Log
      if (options.includeAuditLog) {
        updateProgress("Exporting audit log...");
        const { data: securityEvents } = await supabase
          .from("security_events")
          .select("*")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false })
          .limit(1000);
        exportData.auditLog = securityEvents || [];
      }

      // Log the export request
      await supabase.rpc("log_security_event", {
        p_event_type: "data_export_requested",
        p_event_details: {
          options,
          recordCounts: Object.fromEntries(
            Object.entries(exportData)
              .filter(([_, v]) => Array.isArray(v))
              .map(([k, v]) => [k, (v as unknown[]).length])
          ),
        },
        p_risk_level: "medium",
      });

      setProgress({
        status: "complete",
        currentStep: "Export complete",
        progress: 100,
        totalSteps,
      });

      return exportData;
    },
    onError: (error) => {
      setProgress({
        status: "error",
        currentStep: error.message,
        progress: 0,
        totalSteps: 0,
      });
      toast.error("Failed to export data: " + error.message);
    },
  });

  const downloadExport = async (options: ExportOptions = DEFAULT_OPTIONS) => {
    try {
      const data = await mutation.mutateAsync(options);

      const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
      const filename = `soluly-export-${timestamp}`;

      if (options.format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `${filename}.json`);
      } else {
        // For CSV, create a ZIP-like structure with multiple files
        // In a real implementation, you'd use a library like JSZip
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `${filename}.json`);
        toast.info("CSV export would create multiple files. Downloaded as JSON.");
      }

      toast.success("Data exported successfully");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetProgress = () => {
    setProgress({
      status: "idle",
      currentStep: "",
      progress: 0,
      totalSteps: 0,
    });
  };

  return {
    downloadExport,
    progress,
    resetProgress,
    isExporting: mutation.isPending,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Request account deletion (GDPR right to erasure)
 */
export function useRequestDeletion() {
  const { member, organization } = useAuth();

  return useMutation({
    mutationFn: async ({ reason }: { reason?: string }) => {
      if (!member?.id || !organization?.id) {
        throw new Error("Not authenticated");
      }

      // Log the deletion request
      await supabase.rpc("log_security_event", {
        p_event_type: "data_deletion_requested",
        p_event_details: {
          reason,
          requestedAt: new Date().toISOString(),
        },
        p_risk_level: "critical",
      });

      // In a real implementation, this would:
      // 1. Send notification to admin
      // 2. Start a deletion workflow with verification
      // 3. Schedule deletion after cooling-off period

      return { success: true, message: "Deletion request submitted" };
    },
    onSuccess: () => {
      toast.success(
        "Deletion request submitted. An admin will review your request."
      );
    },
    onError: (error) => {
      toast.error("Failed to submit deletion request: " + error.message);
    },
  });
}
