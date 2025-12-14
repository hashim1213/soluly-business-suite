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

// Fetch all tickets for the current organization (filtered by project access)
export function useTickets() {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["tickets", organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("organization_id", organization.id);

      // If user has project restrictions, filter tickets by allowed projects
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        if (allowedProjectIds.length === 0) {
          return []; // No projects allowed = no tickets
        }
        query = query.in("project_id", allowedProjectIds);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

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

// Fetch single ticket (filtered by organization and project access)
export function useTicket(id: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["tickets", id, organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          project:projects(name, display_id),
          assignee:team_members(name)
        `)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;

      // Check project access - if user has restricted access, verify they can access this ticket's project
      if (!hasFullProjectAccess() && allowedProjectIds !== null && data?.project_id) {
        if (!allowedProjectIds.includes(data.project_id)) {
          // User doesn't have access to this ticket's project
          return null;
        }
      }

      return data as TicketWithProject;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch ticket by display_id (filtered by organization and project access)
export function useTicketByDisplayId(displayId: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["tickets", "display", displayId, organization?.id, allowedProjectIds],
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

      // Check project access - if user has restricted access, verify they can access this ticket's project
      if (!hasFullProjectAccess() && allowedProjectIds !== null && data?.project_id) {
        if (!allowedProjectIds.includes(data.project_id)) {
          // User doesn't have access to this ticket's project
          return null;
        }
      }

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
  const { organization, member } = useAuth();

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

      return { ticket: data as Ticket };
    },
    onSuccess: async ({ ticket }) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created successfully");

      // Send notification for new ticket (filtered by project access in edge function)
      if (ticket.project_id) {
        try {
          await supabase.functions.invoke("create-notification", {
            body: {
              organizationId: ticket.organization_id,
              projectIds: [ticket.project_id], // Only notify users with access to this project
              type: "ticket",
              title: "New Ticket Created",
              message: `${member?.name || "Someone"} created ticket ${ticket.display_id}: "${ticket.title}"`,
              entityType: "ticket",
              entityId: ticket.id,
              entityDisplayId: ticket.display_id,
              actorId: member?.id,
              excludeActorFromNotification: true,
            },
          });
        } catch (error) {
          console.error("Failed to send ticket notification:", error);
        }
      }

      // If ticket is assigned, send assignment notification (specific recipient)
      if (ticket.assignee_id && ticket.assignee_id !== member?.id) {
        try {
          await supabase.functions.invoke("create-notification", {
            body: {
              organizationId: ticket.organization_id,
              recipientIds: [ticket.assignee_id], // Specific recipient for assignment
              type: "assignment",
              title: "Ticket Assigned to You",
              message: `${member?.name || "Someone"} assigned you to ticket ${ticket.display_id}: "${ticket.title}"`,
              entityType: "ticket",
              entityId: ticket.id,
              entityDisplayId: ticket.display_id,
              actorId: member?.id,
              excludeActorFromNotification: false,
            },
          });
        } catch (error) {
          console.error("Failed to send assignment notification:", error);
        }
      }
    },
    onError: (error) => {
      toast.error("Failed to create ticket: " + error.message);
    },
  });
}

// Update ticket (filtered by organization)
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TicketUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      // Get the current ticket to check for assignee changes
      const { data: currentTicket } = await supabase
        .from("tickets")
        .select("assignee_id, title, display_id")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;

      const previousAssigneeId = currentTicket?.assignee_id;
      return { ticket: data as Ticket, previousAssigneeId };
    },
    onSuccess: async ({ ticket, previousAssigneeId }) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", ticket.id] });

      // Send assignment notification if assignee changed
      if (ticket.assignee_id && ticket.assignee_id !== previousAssigneeId && ticket.assignee_id !== member?.id) {
        try {
          await supabase.functions.invoke("create-notification", {
            body: {
              organizationId: ticket.organization_id,
              recipientIds: [ticket.assignee_id],
              type: "assignment",
              title: "Ticket Assigned to You",
              message: `${member?.name || "Someone"} assigned you to ticket ${ticket.display_id}: "${ticket.title}"`,
              entityType: "ticket",
              entityId: ticket.id,
              entityDisplayId: ticket.display_id,
              actorId: member?.id,
              excludeActorFromNotification: false,
            },
          });
        } catch (error) {
          console.error("Failed to send assignment notification:", error);
        }
      }
    },
    onError: (error) => {
      toast.error("Failed to update ticket: " + error.message);
    },
  });
}

// Delete ticket (filtered by organization)
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

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
