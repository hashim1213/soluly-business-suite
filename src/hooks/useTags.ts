import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tag, ContactTag } from "@/types/crm";

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput extends Partial<CreateTagInput> {
  id: string;
}

/**
 * Hook to fetch all tags for the organization
 */
export function useTags() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["tags", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTagInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("tags")
        .insert({
          organization_id: organization.id,
          name: input.name,
          color: input.color || "#6366f1",
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });
}

/**
 * Hook to update a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateTagInput) => {
      if (!organization?.id) throw new Error("No organization found");

      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("tags")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tag updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update tag: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tag deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });
}

/**
 * Hook to get tags for a specific contact
 */
export function useContactTags(contactId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contact-tags", contactId],
    queryFn: async () => {
      if (!organization?.id || !contactId) return [];

      const { data, error } = await supabase
        .from("contact_tags")
        .select(`
          *,
          tag:tags(*)
        `)
        .eq("contact_id", contactId);

      if (error) throw error;
      return data as ContactTag[];
    },
    enabled: !!organization?.id && !!contactId,
  });
}

/**
 * Hook to add a tag to a contact
 */
export function useAddContactTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from("contact_tags")
        .insert({
          contact_id: contactId,
          tag_id: tagId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tags", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tag added to contact");
    },
    onError: (error) => {
      toast.error(`Failed to add tag: ${error.message}`);
    },
  });
}

/**
 * Hook to remove a tag from a contact
 */
export function useRemoveContactTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const { error } = await supabase
        .from("contact_tags")
        .delete()
        .eq("contact_id", contactId)
        .eq("tag_id", tagId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tags", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tag removed from contact");
    },
    onError: (error) => {
      toast.error(`Failed to remove tag: ${error.message}`);
    },
  });
}

/**
 * Hook to bulk set tags for a contact
 */
export function useBulkSetContactTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagIds }: { contactId: string; tagIds: string[] }) => {
      // First, remove all existing tags
      const { error: deleteError } = await supabase
        .from("contact_tags")
        .delete()
        .eq("contact_id", contactId);

      if (deleteError) throw deleteError;

      // Then, add new tags
      if (tagIds.length > 0) {
        const { error: insertError } = await supabase
          .from("contact_tags")
          .insert(
            tagIds.map((tagId) => ({
              contact_id: contactId,
              tag_id: tagId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tags", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tags updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update tags: ${error.message}`);
    },
  });
}
