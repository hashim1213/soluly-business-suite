import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;
export type PaymentUpdate = TablesUpdate<"payments">;
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// Fetch all payments for a team member
export function usePaymentsByMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ["payments", "member", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("team_member_id", memberId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!memberId,
  });
}

// Fetch payment summary for a team member
export function usePaymentSummary(memberId: string | undefined) {
  return useQuery({
    queryKey: ["payments", "summary", memberId],
    queryFn: async () => {
      if (!memberId) return { totalPaid: 0, pending: 0 };

      const { data, error } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("team_member_id", memberId);

      if (error) throw error;

      const totalPaid = data
        ?.filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const pending = data
        ?.filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      return { totalPaid, pending };
    },
    enabled: !!memberId,
  });
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentInsert) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded");
    },
    onError: (error) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PaymentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment updated");
    },
    onError: (error) => {
      toast.error("Failed to update payment: " + error.message);
    },
  });
}

// Delete payment
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete payment: " + error.message);
    },
  });
}

// Mark payment as paid
export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("payments")
        .update({ status: "paid", payment_date: new Date().toISOString().split("T")[0] })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment marked as paid");
    },
    onError: (error) => {
      toast.error("Failed to update payment status: " + error.message);
    },
  });
}
