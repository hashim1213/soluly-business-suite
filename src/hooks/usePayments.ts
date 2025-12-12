import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;
export type PaymentUpdate = TablesUpdate<"payments">;
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// Fetch all payments for a team member (validates member belongs to org)
export function usePaymentsByMember(memberId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["payments", "member", memberId, organization?.id],
    queryFn: async () => {
      if (!memberId || !organization?.id) return [];

      // First verify the team member belongs to this organization
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", memberId)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) return [];

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("team_member_id", memberId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!memberId && !!organization?.id,
  });
}

// Fetch payment summary for a team member (validates member belongs to org)
export function usePaymentSummary(memberId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["payments", "summary", memberId, organization?.id],
    queryFn: async () => {
      if (!memberId || !organization?.id) return { totalPaid: 0, pending: 0 };

      // First verify the team member belongs to this organization
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", memberId)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) return { totalPaid: 0, pending: 0 };

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
    enabled: !!memberId && !!organization?.id,
  });
}

// Create payment (validates team member belongs to org)
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (payment: PaymentInsert) => {
      if (!organization?.id) throw new Error("No organization found");

      // Verify the team member belongs to this organization
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", payment.team_member_id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) {
        throw new Error("Team member not found in your organization");
      }

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

// Update payment (validates payment belongs to org via team member)
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PaymentUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      // Get the payment and verify the team member belongs to this organization
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("team_member_id")
        .eq("id", id)
        .single();

      if (paymentError || !payment) {
        throw new Error("Payment not found");
      }

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", payment.team_member_id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) {
        throw new Error("Payment not found in your organization");
      }

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

// Delete payment (validates payment belongs to org via team member)
export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      // Get the payment and verify the team member belongs to this organization
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("team_member_id")
        .eq("id", id)
        .single();

      if (paymentError || !payment) {
        throw new Error("Payment not found");
      }

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", payment.team_member_id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) {
        throw new Error("Payment not found in your organization");
      }

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

// Mark payment as paid (validates payment belongs to org via team member)
export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      // Get the payment and verify the team member belongs to this organization
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("team_member_id")
        .eq("id", id)
        .single();

      if (paymentError || !payment) {
        throw new Error("Payment not found");
      }

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("id", payment.team_member_id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member) {
        throw new Error("Payment not found in your organization");
      }

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
