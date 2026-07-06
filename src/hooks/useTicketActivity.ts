import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TicketActivityEntry {
  id: string;
  ticket_id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { name: string } | null;
}

export function useTicketActivity(ticketId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["ticket-activity", ticketId],
    queryFn: async () => {
      if (!ticketId || !organization?.id) return [];

      const { data, error } = await supabase
        .from("ticket_activity")
        .select("*, actor:team_members(name)")
        .eq("ticket_id", ticketId)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TicketActivityEntry[];
    },
    enabled: !!ticketId && !!organization?.id,
  });
}

export function useLogTicketActivity() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      ticketId: string;
      action: string;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!organization?.id) throw new Error("No organization");

      const { error } = await supabase.from("ticket_activity").insert({
        ticket_id: input.ticketId,
        organization_id: organization.id,
        actor_id: member?.id || null,
        action: input.action,
        field_name: input.fieldName || null,
        old_value: input.oldValue || null,
        new_value: input.newValue || null,
        metadata: input.metadata || {},
      });

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-activity", vars.ticketId] });
    },
  });
}
