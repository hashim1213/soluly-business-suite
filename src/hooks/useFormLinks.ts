import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FormLinkType = "public" | "personal";

export interface FormLink {
  id: string;
  form_id: string;
  token: string;
  link_type: FormLinkType;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_company: string | null;
  custom_metadata: Record<string, unknown> | null;
  max_responses: number | null;
  response_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FormLinkInsert {
  form_id: string;
  link_type?: FormLinkType;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_company?: string | null;
  custom_metadata?: Record<string, unknown> | null;
  max_responses?: number | null;
  expires_at?: string | null;
}

// Generate a unique token for form links
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Fetch all links for a form
export function useFormLinks(formId: string | undefined) {
  return useQuery({
    queryKey: ["form-links", formId],
    queryFn: async () => {
      if (!formId) return [];

      const { data, error } = await supabase
        .from("form_links")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FormLink[];
    },
    enabled: !!formId,
  });
}

// Fetch a single link by ID
export function useFormLink(id: string | undefined) {
  return useQuery({
    queryKey: ["form-links", "single", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("form_links")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as FormLink;
    },
    enabled: !!id,
  });
}

// Create a new link
export function useCreateFormLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FormLinkInsert) => {
      // Generate unique token
      let token = generateToken();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from("form_links")
          .select("id")
          .eq("token", token)
          .single();

        if (!existing) break;
        token = generateToken();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique token");
      }

      const { data, error } = await supabase
        .from("form_links")
        .insert({
          form_id: input.form_id,
          token,
          link_type: input.link_type || "public",
          recipient_name: input.recipient_name || null,
          recipient_email: input.recipient_email || null,
          recipient_company: input.recipient_company || null,
          custom_metadata: input.custom_metadata || null,
          max_responses: input.max_responses || null,
          expires_at: input.expires_at || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FormLink;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-links", data.form_id] });
      toast.success("Form link created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create link: ${error.message}`);
    },
  });
}

// Create multiple personal links (bulk creation)
export function useCreateBulkFormLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      recipients,
    }: {
      formId: string;
      recipients: Array<{
        name?: string;
        email?: string;
        company?: string;
        metadata?: Record<string, unknown>;
      }>;
    }) => {
      const links = await Promise.all(
        recipients.map(async (recipient) => {
          // Generate unique token for each
          let token = generateToken();
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            const { data: existing } = await supabase
              .from("form_links")
              .select("id")
              .eq("token", token)
              .single();

            if (!existing) break;
            token = generateToken();
            attempts++;
          }

          return {
            form_id: formId,
            token,
            link_type: "personal" as FormLinkType,
            recipient_name: recipient.name || null,
            recipient_email: recipient.email || null,
            recipient_company: recipient.company || null,
            custom_metadata: recipient.metadata || null,
            is_active: true,
          };
        })
      );

      const { data, error } = await supabase
        .from("form_links")
        .insert(links)
        .select();

      if (error) throw error;
      return data as FormLink[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["form-links", data[0].form_id] });
      }
      toast.success(`${data.length} links created`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create links: ${error.message}`);
    },
  });
}

// Update a link
export function useUpdateFormLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      formId,
      updates,
    }: {
      id: string;
      formId: string;
      updates: Partial<Pick<FormLink, "recipient_name" | "recipient_email" | "recipient_company" | "custom_metadata" | "max_responses" | "expires_at" | "is_active">>;
    }) => {
      const { data, error } = await supabase
        .from("form_links")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, formId } as FormLink & { formId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-links", data.formId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update link: ${error.message}`);
    },
  });
}

// Deactivate a link
export function useDeactivateFormLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: string; formId: string }) => {
      const { data, error } = await supabase
        .from("form_links")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, formId } as FormLink & { formId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-links", data.formId] });
      toast.success("Link deactivated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate link: ${error.message}`);
    },
  });
}

// Delete a link
export function useDeleteFormLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: string; formId: string }) => {
      const { error } = await supabase
        .from("form_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { formId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-links", data.formId] });
      toast.success("Link deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete link: ${error.message}`);
    },
  });
}

// Get public form URL helper
export function getFormPublicUrl(token: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/f/${token}`;
}
