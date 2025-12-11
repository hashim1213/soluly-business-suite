import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Contact {
  id: string;
  organization_id: string;
  display_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  company_id?: string;
  notes?: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
}

/**
 * Generate next display ID for contacts (CON-001, CON-002, etc.)
 */
async function generateDisplayId(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("contacts")
    .select("display_id")
    .eq("organization_id", organizationId)
    .order("display_id", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return "CON-001";
  }

  const lastId = data[0].display_id;
  const match = lastId.match(/CON-(\d+)/);
  if (!match) {
    return "CON-001";
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `CON-${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Hook to fetch all contacts for the organization
 */
export function useContacts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contacts", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          company:crm_clients!company_id(id, name)
        `)
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contacts", organization?.id, id],
    queryFn: async () => {
      if (!organization?.id || !id) return null;

      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          company:crm_clients!company_id(id, name)
        `)
        .eq("organization_id", organization.id)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Contact;
    },
    enabled: !!organization?.id && !!id,
  });
}

/**
 * Hook to fetch contacts by company
 */
export function useContactsByCompany(companyId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contacts", organization?.id, "company", companyId],
    queryFn: async () => {
      if (!organization?.id || !companyId) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          company:crm_clients!company_id(id, name)
        `)
        .eq("organization_id", organization.id)
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization?.id && !!companyId,
  });
}

/**
 * Hook to create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const displayId = await generateDisplayId(organization.id);

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          organization_id: organization.id,
          display_id: displayId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          job_title: input.job_title || null,
          company_id: input.company_id || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("contacts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });
}
