import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables, TablesInsert, TablesUpdate, Database } from "@/integrations/supabase/types";

type Email = Tables<"emails">;
type EmailInsert = TablesInsert<"emails">;
type EmailUpdate = TablesUpdate<"emails">;
type EmailCategory = Database["public"]["Enums"]["email_category"];
type EmailStatus = Database["public"]["Enums"]["email_status"];

export interface EmailFilters {
  fromDate?: Date;
  toDate?: Date;
  emailAccountId?: string;
  category?: EmailCategory | null;
  status?: EmailStatus;
  reviewStatus?: "pending" | "approved" | "dismissed";
  search?: string;
  linkedProjectId?: string;
}

export function useEmails(filters: EmailFilters = {}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["emails", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("emails")
        .select(`
          *,
          email_account:email_accounts(display_name, email_address),
          linked_project:projects(id, name, display_id)
        `)
        .eq("organization_id", organization.id)
        .order("received_at", { ascending: false });

      // Apply date filters
      if (filters.fromDate) {
        query = query.gte("received_at", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        query = query.lte("received_at", filters.toDate.toISOString());
      }

      // Apply account filter
      if (filters.emailAccountId) {
        query = query.eq("email_account_id", filters.emailAccountId);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      // Apply status filter
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      // Apply review status filter
      if (filters.reviewStatus) {
        query = query.eq("review_status", filters.reviewStatus);
      }

      // Apply project filter
      if (filters.linkedProjectId) {
        query = query.eq("linked_project_id", filters.linkedProjectId);
      }

      // Apply search
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,sender_email.ilike.%${filters.search}%,sender_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useEmail(id: string | null) {
  return useQuery({
    queryKey: ["email", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("emails")
        .select(`
          *,
          email_account:email_accounts(display_name, email_address),
          linked_project:projects(id, name, display_id),
          linked_ticket:tickets(id, title, display_id),
          linked_feature_request:feature_requests(id, title, display_id),
          linked_quote:quotes(id, title, display_id),
          linked_feedback:feedback(id, title, display_id)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: EmailUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("emails")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEmailCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: EmailCategory }) => {
      const { data, error } = await supabase
        .from("emails")
        .update({ category })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email"] });
      toast.success("Category updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useLinkEmailToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emailId, projectId }: { emailId: string; projectId: string | null }) => {
      const { data, error } = await supabase
        .from("emails")
        .update({ linked_project_id: projectId })
        .eq("id", emailId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email"] });
      toast.success("Project linked");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDismissEmail() {
  const queryClient = useQueryClient();
  const { teamMember } = useAuth();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { data, error } = await supabase
        .from("emails")
        .update({
          review_status: "dismissed",
          reviewed_by: teamMember?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", emailId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email"] });
      toast.success("Email dismissed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateRecordFromEmail() {
  const queryClient = useQueryClient();
  const { teamMember } = useAuth();

  return useMutation({
    mutationFn: async ({
      emailId,
      category,
      title,
      priority,
      projectId,
    }: {
      emailId: string;
      category: "ticket" | "feature_request" | "customer_quote" | "feedback";
      title: string;
      priority?: "low" | "medium" | "high" | "critical";
      projectId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-from-email", {
        body: {
          emailId,
          category,
          title,
          priority,
          projectId,
          reviewedBy: teamMember?.id,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to create record");

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success(`Created ${data.category.replace("_", " ")}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Stats hook for dashboard
export function useEmailStats() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["email_stats", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data: emails, error } = await supabase
        .from("emails")
        .select("status, review_status, category")
        .eq("organization_id", organization.id);

      if (error) throw error;

      const total = emails.length;
      const pending = emails.filter((e) => e.status === "pending").length;
      const processed = emails.filter((e) => e.status === "processed").length;
      const needsReview = emails.filter((e) => e.review_status === "pending" && e.status === "processed").length;
      const approved = emails.filter((e) => e.review_status === "approved").length;
      const dismissed = emails.filter((e) => e.review_status === "dismissed").length;

      const byCategory = {
        ticket: emails.filter((e) => e.category === "ticket").length,
        feature_request: emails.filter((e) => e.category === "feature_request").length,
        customer_quote: emails.filter((e) => e.category === "customer_quote").length,
        feedback: emails.filter((e) => e.category === "feedback").length,
        other: emails.filter((e) => e.category === "other").length,
      };

      return {
        total,
        pending,
        processed,
        needsReview,
        approved,
        dismissed,
        byCategory,
      };
    },
    enabled: !!organization?.id,
  });
}
