import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Ticket = Tables<"tickets">;
export type TicketInsert = TablesInsert<"tickets">;
export type TicketUpdate = TablesUpdate<"tickets">;

// Extended ticket with project name
export type TicketWithProject = Ticket & {
  project?: { name: string; display_id: string } | null;
  assignee?: { name: string } | null;
};

// Fetch all tickets
export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TicketWithProject[];
    },
  });
}

// Fetch tickets by project
export function useTicketsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", "project", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TicketWithProject[];
    },
    enabled: !!projectId,
  });
}

// Fetch single ticket
export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as TicketWithProject;
    },
    enabled: !!id,
  });
}

// Fetch ticket by display_id
export function useTicketByDisplayId(displayId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", "display", displayId],
    queryFn: async () => {
      if (!displayId) return null;
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("display_id", displayId)
        .single();

      if (error) throw error;
      return data as TicketWithProject;
    },
    enabled: !!displayId,
  });
}

// Create ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Omit<TicketInsert, "display_id"> & { display_id?: string }) => {
      if (!ticket.display_id) {
        const { count } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true });
        ticket.display_id = `TKT-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("tickets")
        .insert(ticket as TicketInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create ticket: " + error.message);
    },
  });
}

// Update ticket
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TicketUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", data.id] });
    },
    onError: (error) => {
      toast.error("Failed to update ticket: " + error.message);
    },
  });
}

// Delete ticket
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete ticket: " + error.message);
    },
  });
}
