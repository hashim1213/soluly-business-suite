import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CustomField, CustomFieldType, CustomFieldValue } from "@/types/crm";

export interface CreateCustomFieldInput {
  name: string;
  field_type: CustomFieldType;
  options?: string[];
  required?: boolean;
  display_order?: number;
}

export interface UpdateCustomFieldInput extends Partial<CreateCustomFieldInput> {
  id: string;
}

/**
 * Hook to fetch all custom field definitions for the organization
 */
export function useCustomFields() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["custom-fields", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("contact_custom_fields")
        .select("*")
        .eq("organization_id", organization.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as CustomField[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to create a new custom field
 */
export function useCreateCustomField() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCustomFieldInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Get the next display order
      const { data: existingFields } = await supabase
        .from("contact_custom_fields")
        .select("display_order")
        .eq("organization_id", organization.id)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextOrder = existingFields?.[0]?.display_order
        ? existingFields[0].display_order + 1
        : 0;

      const { data, error } = await supabase
        .from("contact_custom_fields")
        .insert({
          organization_id: organization.id,
          name: input.name,
          field_type: input.field_type,
          options: input.options || null,
          required: input.required || false,
          display_order: input.display_order ?? nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      toast.success("Custom field created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create custom field: ${error.message}`);
    },
  });
}

/**
 * Hook to update a custom field
 */
export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateCustomFieldInput) => {
      if (!organization?.id) throw new Error("No organization found");

      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("contact_custom_fields")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Custom field updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update custom field: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a custom field
 */
export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("contact_custom_fields")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Custom field deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete custom field: ${error.message}`);
    },
  });
}

/**
 * Hook to reorder custom fields
 */
export function useReorderCustomFields() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (fields: { id: string; display_order: number }[]) => {
      if (!organization?.id) throw new Error("No organization found");

      // Update each field's display_order
      for (const field of fields) {
        const { error } = await supabase
          .from("contact_custom_fields")
          .update({ display_order: field.display_order })
          .eq("id", field.id)
          .eq("organization_id", organization.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
    },
    onError: (error) => {
      toast.error(`Failed to reorder fields: ${error.message}`);
    },
  });
}

/**
 * Hook to get custom field values for a contact
 */
export function useContactCustomFieldValues(contactId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["contact-custom-field-values", contactId],
    queryFn: async () => {
      if (!organization?.id || !contactId) return [];

      const { data, error } = await supabase
        .from("contact_custom_field_values")
        .select(`
          *,
          field:contact_custom_fields(*)
        `)
        .eq("contact_id", contactId);

      if (error) throw error;
      return data as CustomFieldValue[];
    },
    enabled: !!organization?.id && !!contactId,
  });
}

/**
 * Hook to set a custom field value for a contact
 */
export function useSetCustomFieldValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      fieldId,
      value,
    }: {
      contactId: string;
      fieldId: string;
      value: unknown;
    }) => {
      // Upsert the value
      const { data, error } = await supabase
        .from("contact_custom_field_values")
        .upsert(
          {
            contact_id: contactId,
            field_id: fieldId,
            value: value as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "contact_id,field_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contact-custom-field-values", variables.contactId],
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(`Failed to save custom field: ${error.message}`);
    },
  });
}

/**
 * Hook to bulk set custom field values for a contact
 */
export function useBulkSetCustomFieldValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      values,
    }: {
      contactId: string;
      values: { fieldId: string; value: unknown }[];
    }) => {
      // Upsert all values
      for (const { fieldId, value } of values) {
        const { error } = await supabase
          .from("contact_custom_field_values")
          .upsert(
            {
              contact_id: contactId,
              field_id: fieldId,
              value: value as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "contact_id,field_id",
            }
          );

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contact-custom-field-values", variables.contactId],
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Custom fields saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save custom fields: ${error.message}`);
    },
  });
}
