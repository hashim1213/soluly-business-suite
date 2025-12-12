import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type CrmClient = Tables<"crm_clients">;
export type CrmClientInsert = TablesInsert<"crm_clients">;
export type CrmClientUpdate = TablesUpdate<"crm_clients">;

export type CrmLead = Tables<"crm_leads">;
export type CrmLeadInsert = TablesInsert<"crm_leads">;
export type CrmLeadUpdate = TablesUpdate<"crm_leads">;

// =====================
// CLIENTS
// =====================

// Fetch all clients for the current organization
export function useCrmClients() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_clients", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("crm_clients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as CrmClient[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single client with deals (filtered by organization)
export function useCrmClient(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_clients", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data: client, error: clientError } = await supabase
        .from("crm_clients")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (clientError) throw clientError;

      const { data: deals, error: dealsError } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", id)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;

      return {
        ...client,
        deals: deals || [],
      };
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch client by display_id (filtered by organization)
export function useCrmClientByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_clients", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;

      const { data: client, error: clientError } = await supabase
        .from("crm_clients")
        .select("*")
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (clientError) throw clientError;

      const { data: deals } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", client.id)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      return {
        ...client,
        deals: deals || [],
      };
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Create client
export function useCreateCrmClient() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<CrmClientInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!client.display_id) {
        const { count } = await supabase
          .from("crm_clients")
          .select("*", { count: "exact", head: true });
        client.display_id = `CLT-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("crm_clients")
        .insert({ ...client, organization_id: organization.id } as CrmClientInsert)
        .select()
        .single();

      if (error) throw error;
      return data as CrmClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Client added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add client: " + error.message);
    },
  });
}

// Update client (filtered by organization)
export function useUpdateCrmClient() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmClientUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("crm_clients")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as CrmClient;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients", data.id] });
      toast.success("Client updated");
    },
    onError: (error) => {
      toast.error("Failed to update client: " + error.message);
    },
  });
}

// Delete client (filtered by organization)
export function useDeleteCrmClient() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("crm_clients")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Client removed");
    },
    onError: (error) => {
      toast.error("Failed to remove client: " + error.message);
    },
  });
}

// =====================
// LEADS
// =====================

// Fetch all leads for the current organization
export function useCrmLeads() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_leads", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CrmLead[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single lead (filtered by organization)
export function useCrmLead(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["crm_leads", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data as CrmLead;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Create lead
export function useCreateCrmLead() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (lead: Omit<CrmLeadInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!lead.display_id) {
        const { count } = await supabase
          .from("crm_leads")
          .select("*", { count: "exact", head: true });
        lead.display_id = `LEAD-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data, error } = await supabase
        .from("crm_leads")
        .insert({ ...lead, organization_id: organization.id } as CrmLeadInsert)
        .select()
        .single();

      if (error) throw error;
      return data as CrmLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast.success("Lead added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add lead: " + error.message);
    },
  });
}

// Update lead (filtered by organization)
export function useUpdateCrmLead() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmLeadUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("crm_leads")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as CrmLead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm_leads", data.id] });
      toast.success("Lead updated");
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });
}

// Delete lead (filtered by organization)
export function useDeleteCrmLead() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("crm_leads")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast.success("Lead removed");
    },
    onError: (error) => {
      toast.error("Failed to remove lead: " + error.message);
    },
  });
}

// Convert lead to client (filtered by organization)
export function useConvertLeadToClient() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!organization?.id) throw new Error("No organization found");

      // Fetch the lead (with org filter)
      const { data: lead, error: leadError } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("id", leadId)
        .eq("organization_id", organization.id)
        .single();

      if (leadError) throw leadError;

      // Get next client display_id for this org
      const { count } = await supabase
        .from("crm_clients")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);
      const displayId = `CLT-${String((count || 0) + 1).padStart(3, "0")}`;

      // Create client from lead
      const { data: client, error: clientError } = await supabase
        .from("crm_clients")
        .insert({
          organization_id: organization.id,
          display_id: displayId,
          name: lead.name,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          contact_phone: lead.contact_phone,
          industry: lead.industry,
          status: "active",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Delete the lead
      await supabase
        .from("crm_leads")
        .delete()
        .eq("id", leadId)
        .eq("organization_id", organization.id);

      return client as CrmClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm_clients"] });
      toast.success("Lead converted to client");
    },
    onError: (error) => {
      toast.error("Failed to convert lead: " + error.message);
    },
  });
}
