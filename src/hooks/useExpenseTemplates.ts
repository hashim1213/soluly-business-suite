import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ExpenseTemplate {
  id: string;
  organization_id: string;
  name: string;
  vendor: string;
  description: string;
  category: string;
  subcategory: string | null;
  default_amount: number | null;
  payment_method: string | null;
  recurring: boolean;
  recurring_frequency: string | null;
  tax_deductible: boolean;
  notes: string | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseTemplateInput {
  name: string;
  vendor: string;
  description: string;
  category: string;
  subcategory?: string;
  default_amount?: number;
  payment_method?: string;
  recurring?: boolean;
  recurring_frequency?: string;
  tax_deductible?: boolean;
  notes?: string;
}

export interface UpdateExpenseTemplateInput extends Partial<CreateExpenseTemplateInput> {
  id: string;
}

/**
 * Hook to fetch all expense templates for the organization
 */
export function useExpenseTemplates() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["expense_templates", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("expense_templates")
        .select("*")
        .eq("organization_id", organization.id)
        .order("use_count", { ascending: false });

      if (error) throw error;
      return data as ExpenseTemplate[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new expense template
 */
export function useCreateExpenseTemplate() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateExpenseTemplateInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("expense_templates")
        .insert({
          organization_id: organization.id,
          name: input.name,
          vendor: input.vendor,
          description: input.description,
          category: input.category,
          subcategory: input.subcategory || null,
          default_amount: input.default_amount || null,
          payment_method: input.payment_method || null,
          recurring: input.recurring || false,
          recurring_frequency: input.recurring_frequency || null,
          tax_deductible: input.tax_deductible !== false,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_templates"] });
      toast.success("Expense template saved");
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing expense template
 */
export function useUpdateExpenseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExpenseTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("expense_templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_templates"] });
      toast.success("Template updated");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an expense template
 */
export function useDeleteExpenseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

/**
 * Hook to increment template use count (call when using a template)
 */
export function useIncrementTemplateUse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get current use_count
      const { data: current, error: fetchError } = await supabase
        .from("expense_templates")
        .select("use_count")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("expense_templates")
        .update({
          use_count: (current?.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_templates"] });
    },
  });
}
