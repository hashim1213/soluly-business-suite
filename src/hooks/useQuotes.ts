import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Quote = Tables<"quotes">;
export type QuoteInsert = TablesInsert<"quotes">;
export type QuoteUpdate = TablesUpdate<"quotes">;

export type CrmActivity = Tables<"crm_activities">;
export type CrmActivityInsert = TablesInsert<"crm_activities">;

export type CrmTask = Tables<"crm_tasks">;
export type CrmTaskInsert = TablesInsert<"crm_tasks">;
export type CrmTaskUpdate = TablesUpdate<"crm_tasks">;

// Quote with activities and tasks
export type QuoteWithRelations = Quote & {
  activities: CrmActivity[];
  tasks: CrmTask[];
  client?: Tables<"crm_clients"> | null;
};

// Fetch all quotes for the current organization
export function useQuotes() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["quotes", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch quote with all relations
export function useQuote(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["quotes", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          client:crm_clients(*)
        `)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (quoteError) throw quoteError;

      const { data: activities, error: activitiesError } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("quote_id", id)
        .eq("organization_id", organization.id)
        .order("activity_date", { ascending: false });

      if (activitiesError) throw activitiesError;

      const { data: tasks, error: tasksError } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("quote_id", id)
        .eq("organization_id", organization.id)
        .order("due_date", { ascending: true });

      if (tasksError) throw tasksError;

      return {
        ...quote,
        activities: activities || [],
        tasks: tasks || [],
      } as QuoteWithRelations;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch quote by display_id (filtered by organization)
export function useQuoteByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["quotes", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          client:crm_clients(*)
        `)
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (quoteError) throw quoteError;

      const { data: activities } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("quote_id", quote.id)
        .order("activity_date", { ascending: false });

      const { data: tasks } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("quote_id", quote.id)
        .order("due_date", { ascending: true });

      return {
        ...quote,
        activities: activities || [],
        tasks: tasks || [],
      } as QuoteWithRelations;
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Helper to generate unique display_id within organization
async function generateUniqueDisplayId(
  prefix: string,
  table: "quotes" | "crm_activities" | "crm_tasks",
  organizationId: string
): Promise<string> {
  // Get the highest existing display_id number within the organization
  const { data } = await supabase
    .from(table)
    .select("display_id")
    .eq("organization_id", organizationId)
    .like("display_id", `${prefix}-%`)
    .order("display_id", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const match = data[0].display_id.match(new RegExp(`${prefix}-(?:DEMO-)?(\\d+)`));
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${String(nextNum).padStart(3, "0")}`;
}

// Create quote
export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (quote: Omit<QuoteInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!quote.display_id) {
        quote.display_id = await generateUniqueDisplayId("QTE", "quotes", organization.id);
      }

      const { data, error } = await supabase
        .from("quotes")
        .insert({ ...quote, organization_id: organization.id } as QuoteInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create quote: " + error.message);
    },
  });
}

// Update quote
export function useUpdateQuote() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: QuoteUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Quote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", data.id] });
    },
    onError: (error) => {
      toast.error("Failed to update quote: " + error.message);
    },
  });
}

// Delete quote
export function useDeleteQuote() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete quote: " + error.message);
    },
  });
}

// Create activity for quote
export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (activity: Omit<CrmActivityInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!activity.display_id) {
        activity.display_id = await generateUniqueDisplayId("ACT", "crm_activities", organization.id);
      }

      const { data, error } = await supabase
        .from("crm_activities")
        .insert({ ...activity, organization_id: organization.id } as CrmActivityInsert)
        .select()
        .single();

      if (error) throw error;

      // Update quote's last_activity
      await supabase
        .from("quotes")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", activity.quote_id);

      return data as CrmActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", data.quote_id] });
      toast.success("Activity logged");
    },
    onError: (error) => {
      toast.error("Failed to log activity: " + error.message);
    },
  });
}

// Create task for quote
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (task: Omit<CrmTaskInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!task.display_id) {
        task.display_id = await generateUniqueDisplayId("TSK", "crm_tasks", organization.id);
      }

      const { data, error } = await supabase
        .from("crm_tasks")
        .insert({ ...task, organization_id: organization.id } as CrmTaskInsert)
        .select()
        .single();

      if (error) throw error;
      return data as CrmTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ["crm_tasks"] });
      toast.success("Task created");
    },
    onError: (error) => {
      toast.error("Failed to create task: " + error.message);
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmTaskUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("crm_tasks")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as CrmTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ["crm_tasks"] });
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });
}

// Fetch all tasks for the current organization
export function useTasks() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_tasks", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("crm_tasks")
        .select(`
          *,
          quote:quotes(title, company_name)
        `)
        .eq("organization_id", organization.id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}

// =====================
// QUOTE LINE ITEMS
// =====================

export type QuoteLineItem = Tables<"quote_line_items">;
export type QuoteLineItemInsert = TablesInsert<"quote_line_items">;
export type QuoteLineItemUpdate = TablesUpdate<"quote_line_items">;

// Fetch line items for a quote
export function useQuoteLineItems(quoteId: string | undefined) {
  return useQuery({
    queryKey: ["quote_line_items", quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      const { data, error } = await supabase
        .from("quote_line_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as QuoteLineItem[];
    },
    enabled: !!quoteId,
  });
}

// Create line item
export function useCreateQuoteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lineItem: QuoteLineItemInsert) => {
      const { data, error } = await supabase
        .from("quote_line_items")
        .insert(lineItem)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteLineItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quote_line_items", data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      toast.error("Failed to add line item: " + error.message);
    },
  });
}

// Update line item
export function useUpdateQuoteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: QuoteLineItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("quote_line_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as QuoteLineItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quote_line_items", data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      toast.error("Failed to update line item: " + error.message);
    },
  });
}

// Delete line item
export function useDeleteQuoteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quoteId }: { id: string; quoteId: string }) => {
      const { error } = await supabase
        .from("quote_line_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return quoteId;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["quote_line_items", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Line item removed");
    },
    onError: (error) => {
      toast.error("Failed to delete line item: " + error.message);
    },
  });
}

// Bulk update line items (for reordering or batch updates)
export function useBulkUpdateQuoteLineItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, lineItems }: { quoteId: string; lineItems: Array<QuoteLineItemInsert | (QuoteLineItemUpdate & { id: string })> }) => {
      // Delete existing line items
      await supabase
        .from("quote_line_items")
        .delete()
        .eq("quote_id", quoteId);

      // Insert new line items if any
      if (lineItems.length > 0) {
        const itemsToInsert = lineItems.map((item, index) => ({
          quote_id: quoteId,
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          sort_order: index,
        }));

        const { error } = await supabase
          .from("quote_line_items")
          .insert(itemsToInsert);

        if (error) throw error;
      }

      // Update the quote's total value
      const total = lineItems.reduce((sum, item) =>
        sum + ((item.quantity || 1) * (item.unit_price || 0)), 0
      );

      await supabase
        .from("quotes")
        .update({ value: total })
        .eq("id", quoteId);

      return quoteId;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["quote_line_items", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Line items saved");
    },
    onError: (error) => {
      toast.error("Failed to save line items: " + error.message);
    },
  });
}
