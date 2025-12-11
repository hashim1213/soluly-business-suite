import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectInvoice {
  id: string;
  organization_id: string;
  project_id: string;
  display_id: string;
  description: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  paid_date: string | null;
  file_url: string | null;
  file_name: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInvoiceInput {
  project_id: string;
  description: string;
  amount: number;
  status?: "draft" | "sent" | "paid" | "overdue";
  due_date?: string;
  file_url?: string;
  file_name?: string;
  invoice_number?: string;
  notes?: string;
}

export interface UpdateProjectInvoiceInput {
  id: string;
  description?: string;
  amount?: number;
  status?: "draft" | "sent" | "paid" | "overdue";
  due_date?: string;
  paid_date?: string;
  file_url?: string;
  file_name?: string;
  invoice_number?: string;
  notes?: string;
}

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

/**
 * Generate next display ID for invoices (INV-001, INV-002, etc.)
 */
async function generateDisplayId(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("project_invoices")
    .select("display_id")
    .eq("organization_id", organizationId)
    .order("display_id", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return "INV-001";
  }

  const lastId = data[0].display_id;
  const match = lastId.match(/INV-(\d+)/);
  if (!match) {
    return "INV-001";
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `INV-${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Hook to fetch all invoices for a project
 */
export function useProjectInvoices(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_invoices", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_invoices")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectInvoice[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to fetch all invoices across all projects (for Financials page)
 */
export function useAllProjectInvoices() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_invoices", organization?.id, "all"],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("project_invoices")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectInvoice[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new project invoice
 */
export function useCreateProjectInvoice() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectInvoiceInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const displayId = await generateDisplayId(organization.id);

      const { data, error } = await supabase
        .from("project_invoices")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          display_id: displayId,
          description: input.description,
          amount: input.amount,
          status: input.status || "draft",
          due_date: input.due_date || null,
          file_url: input.file_url || null,
          file_name: input.file_name || null,
          invoice_number: input.invoice_number || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_invoices"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.project_id] });
      toast.success("Invoice created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing project invoice
 */
export function useUpdateProjectInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectInvoiceInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("project_invoices")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_invoices"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a project invoice
 */
export function useDeleteProjectInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}
