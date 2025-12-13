import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientContact {
  id: string;
  client_id: string;
  contact_id: string;
  is_primary: boolean;
  created_at: string;
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    display_id: string;
  };
}

// Fetch contacts for a specific client
export function useClientContacts(clientId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["client_contacts", organization?.id, clientId],
    queryFn: async () => {
      if (!clientId || !organization?.id) return [];

      const { data, error } = await supabase
        .from("client_contacts")
        .select(`
          *,
          contact:contacts(id, name, email, phone, job_title, display_id)
        `)
        .eq("client_id", clientId)
        .eq("organization_id", organization.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data as ClientContact[];
    },
    enabled: !!clientId && !!organization?.id,
  });
}

// Add contact to client
export function useAddClientContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      clientId,
      contactId,
      isPrimary = false,
    }: {
      clientId: string;
      contactId: string;
      isPrimary?: boolean;
    }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // If setting as primary, first unset any existing primary
      if (isPrimary) {
        await supabase
          .from("client_contacts")
          .update({ is_primary: false })
          .eq("client_id", clientId)
          .eq("organization_id", organization.id)
          .eq("is_primary", true);
      }

      const { data, error } = await supabase
        .from("client_contacts")
        .insert({
          client_id: clientId,
          contact_id: contactId,
          organization_id: organization.id,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_contacts", organization?.id, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Contact added to client");
    },
    onError: (error) => {
      if (error.message.includes("duplicate key")) {
        toast.error("Contact is already linked to this client");
      } else {
        toast.error("Failed to add contact: " + error.message);
      }
    },
  });
}

// Remove contact from client
export function useRemoveClientContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, contactId }: { clientId: string; contactId: string }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase
        .from("client_contacts")
        .delete()
        .eq("client_id", clientId)
        .eq("contact_id", contactId)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_contacts", organization?.id, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Contact removed from client");
    },
    onError: (error) => {
      toast.error("Failed to remove contact: " + error.message);
    },
  });
}

// Set a contact as primary
export function useSetPrimaryContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, contactId }: { clientId: string; contactId: string }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // First, unset all primary contacts for this client
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId)
        .eq("organization_id", organization.id);

      // Then set the new primary
      const { data, error } = await supabase
        .from("client_contacts")
        .update({ is_primary: true })
        .eq("client_id", clientId)
        .eq("contact_id", contactId)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_contacts", organization?.id, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Primary contact updated");
    },
    onError: (error) => {
      toast.error("Failed to set primary contact: " + error.message);
    },
  });
}

// Bulk add contacts to client (for use during client creation)
export function useBulkAddClientContacts() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      clientId,
      contactIds,
      primaryContactId,
    }: {
      clientId: string;
      contactIds: string[];
      primaryContactId?: string;
    }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      if (contactIds.length === 0) return [];

      const records = contactIds.map((contactId) => ({
        client_id: clientId,
        contact_id: contactId,
        organization_id: organization.id,
        is_primary: contactId === primaryContactId,
      }));

      const { data, error } = await supabase
        .from("client_contacts")
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_contacts", organization?.id, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
    },
    onError: (error) => {
      toast.error("Failed to link contacts: " + error.message);
    },
  });
}
