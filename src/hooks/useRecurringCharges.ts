import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarMonths, endOfMonth, parseISO, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type RecurringCharge = Tables<"recurring_charges">;
export type RecurringChargeCategory =
  | "hosting"
  | "database"
  | "subscription"
  | "domain"
  | "license"
  | "other";
export type RecurringChargeFrequency = "monthly" | "quarterly" | "yearly";

const FREQUENCY_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * Whether a charge bills in the given month: the charge is active, the month
 * falls inside its start/end window, and the month lands on a billing-cycle
 * boundary counted from the charge's start month.
 */
export function isChargeDueInMonth(charge: RecurringCharge, month: Date): boolean {
  if (!charge.active) return false;
  const cycleMonths = FREQUENCY_MONTHS[charge.frequency] ?? 1;
  const monthStart = startOfMonth(month);
  const chargeStart = startOfMonth(parseISO(charge.start_date));
  if (monthStart < chargeStart) return false;
  if (charge.end_date && parseISO(charge.end_date) < monthStart) return false;
  const monthsSinceStart = differenceInCalendarMonths(monthStart, chargeStart);
  return monthsSinceStart % cycleMonths === 0;
}

/** Charges from the list that bill in the given month. */
export function chargesDueInMonth(charges: RecurringCharge[], month: Date): RecurringCharge[] {
  return charges.filter((c) => isChargeDueInMonth(c, month));
}

export { endOfMonth };

export function useRecurringCharges(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["recurring_charges", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("recurring_charges")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as RecurringCharge[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

export function useCreateRecurringCharge() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"recurring_charges">, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("recurring_charges")
        .insert({ ...input, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data as RecurringCharge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_charges"] });
      toast.success("Recurring charge added");
    },
    onError: (error) => {
      toast.error("Failed to add charge: " + error.message);
    },
  });
}

export function useUpdateRecurringCharge() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"recurring_charges"> & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("recurring_charges")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as RecurringCharge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_charges"] });
    },
    onError: (error) => {
      toast.error("Failed to update charge: " + error.message);
    },
  });
}

export function useDeleteRecurringCharge() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("recurring_charges")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_charges"] });
      toast.success("Recurring charge removed");
    },
    onError: (error) => {
      toast.error("Failed to remove charge: " + error.message);
    },
  });
}
