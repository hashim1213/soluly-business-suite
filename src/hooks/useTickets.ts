import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Ticket = Tables<"tickets">;
export type TicketInsert = TablesInsert<"tickets">;
export type TicketUpdate = TablesUpdate<"tickets">;

// Extended ticket with project name
export type TicketWithProject = Ticket & {
  project?: { name: string; display_id: string } | null;
  assignee?: { name: string } | null;
};

// Fetch all tickets for the current organization
export function useTickets() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["tickets", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TicketWithProject[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch tickets by project
export function useTicketsByProject(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["tickets", "project", projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("project_id", projectId)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TicketWithProject[];
    },
    enabled: !!projectId && !!organization?.id,
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

// Fetch ticket by display_id (filtered by organization)
export function useTicketByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["tickets", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data as TicketWithProject;
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Helper to generate unique display_id for tickets within organization
async function generateUniqueTicketDisplayId(organizationId: string): Promise<string> {
  const { data } = await supabase
    .from("tickets")
    .select("display_id")
    .eq("organization_id", organizationId)
    .like("display_id", "TKT-%")
    .order("display_id", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const match = data[0].display_id.match(/TKT-(?:DEMO-)?(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `TKT-${String(nextNum).padStart(3, "0")}`;
}

// Create ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (ticket: Omit<TicketInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!ticket.display_id) {
        ticket.display_id = await generateUniqueTicketDisplayId(organization.id);
      }

      const { data, error } = await supabase
        .from("tickets")
        .insert({ ...ticket, organization_id: organization.id } as TicketInsert)
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
