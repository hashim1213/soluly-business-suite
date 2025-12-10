import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

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

// Fetch all quotes
export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
  });
}

// Fetch quote with all relations
export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          client:crm_clients(*)
        `)
        .eq("id", id)
        .single();

      if (quoteError) throw quoteError;

      const { data: activities, error: activitiesError } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("quote_id", id)
        .order("activity_date", { ascending: false });

      if (activitiesError) throw activitiesError;

      const { data: tasks, error: tasksError } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("quote_id", id)
        .order("due_date", { ascending: true });

      if (tasksError) throw tasksError;

      return {
        ...quote,
        activities: activities || [],
        tasks: tasks || [],
      } as QuoteWithRelations;
    },
    enabled: !!id,
  });
}

// Fetch quote by display_id
export function useQuoteByDisplayId(displayId: string | undefined) {
  return useQuery({
    queryKey: ["quotes", "display", displayId],
    queryFn: async () => {
      if (!displayId) return null;

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          client:crm_clients(*)
        `)
        .eq("display_id", displayId)
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
    enabled: !!displayId,
  });
}

// Create quote
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quote: Omit<QuoteInsert, "display_id"> & { display_id?: string }) => {
      if (!quote.display_id) {
        const { count } = await supabase
          .from("quotes")
          .select("*", { count: "exact", head: true });
        quote.display_id = `QTE-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("quotes")
        .insert(quote as QuoteInsert)
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

  return useMutation({
    mutationFn: async ({ id, ...updates }: QuoteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id)
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

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id);

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

  return useMutation({
    mutationFn: async (activity: Omit<CrmActivityInsert, "display_id"> & { display_id?: string }) => {
      if (!activity.display_id) {
        const { count } = await supabase
          .from("crm_activities")
          .select("*", { count: "exact", head: true });
        activity.display_id = `ACT-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("crm_activities")
        .insert(activity as CrmActivityInsert)
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

  return useMutation({
    mutationFn: async (task: Omit<CrmTaskInsert, "display_id"> & { display_id?: string }) => {
      if (!task.display_id) {
        const { count } = await supabase
          .from("crm_tasks")
          .select("*", { count: "exact", head: true });
        task.display_id = `TSK-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("crm_tasks")
        .insert(task as CrmTaskInsert)
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

  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmTaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("crm_tasks")
        .update(updates)
        .eq("id", id)
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

// Fetch all tasks
export function useTasks() {
  return useQuery({
    queryKey: ["crm_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_tasks")
        .select(`
          *,
          quote:quotes(title, company_name)
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
