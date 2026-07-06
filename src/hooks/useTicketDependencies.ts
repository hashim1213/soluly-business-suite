import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DependencyType = "blocks" | "relates_to" | "duplicates";

export interface TicketDependency {
  id: string;
  blocking_ticket_id: string;
  blocked_ticket_id: string;
  dependency_type: DependencyType;
  organization_id: string;
  created_at: string;
  blocking_ticket?: { title: string; display_id: string; status: string };
  blocked_ticket?: { title: string; display_id: string; status: string };
}

export function useTicketDependencies(ticketId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["ticket-dependencies", ticketId],
    queryFn: async () => {
      if (!ticketId || !organization?.id) return [];

      const [blocking, blocked] = await Promise.all([
        supabase
          .from("ticket_dependencies")
          .select("*, blocked_ticket:tickets!ticket_dependencies_blocked_ticket_id_fkey(title, display_id, status)")
          .eq("blocking_ticket_id", ticketId)
          .eq("organization_id", organization.id),
        supabase
          .from("ticket_dependencies")
          .select("*, blocking_ticket:tickets!ticket_dependencies_blocking_ticket_id_fkey(title, display_id, status)")
          .eq("blocked_ticket_id", ticketId)
          .eq("organization_id", organization.id),
      ]);

      if (blocking.error) throw blocking.error;
      if (blocked.error) throw blocked.error;

      return {
        blocks: (blocking.data || []) as TicketDependency[],
        blockedBy: (blocked.data || []) as TicketDependency[],
      };
    },
    enabled: !!ticketId && !!organization?.id,
  });
}

export function useCreateTicketDependency() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      blockingTicketId,
      blockedTicketId,
      dependencyType,
    }: {
      blockingTicketId: string;
      blockedTicketId: string;
      dependencyType: DependencyType;
    }) => {
      if (!organization?.id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("ticket_dependencies")
        .insert({
          blocking_ticket_id: blockingTicketId,
          blocked_ticket_id: blockedTicketId,
          dependency_type: dependencyType,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-dependencies", vars.blockingTicketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-dependencies", vars.blockedTicketId] });
      toast.success("Dependency added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add dependency");
    },
  });
}

export function useRemoveTicketDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ticketId }: { id: string; ticketId: string }) => {
      const { error } = await supabase.from("ticket_dependencies").delete().eq("id", id);
      if (error) throw error;
      return { ticketId };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-dependencies", vars.ticketId] });
      toast.success("Dependency removed");
    },
    onError: () => {
      toast.error("Failed to remove dependency");
    },
  });
}
