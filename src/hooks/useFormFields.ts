import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Field types supported
export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "rating"
  | "scale"
  | "date"
  | "email"
  | "number"
  | "yes_no";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min_date?: string;
  max_date?: string;
  step?: number;
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: FormFieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  field_order: number;
  required: boolean;
  options: FieldOption[] | null;
  validation: FieldValidation | null;
  created_at: string;
  updated_at: string;
}

export interface FormFieldInsert {
  form_id: string;
  field_type: FormFieldType;
  label: string;
  description?: string | null;
  placeholder?: string | null;
  field_order?: number;
  required?: boolean;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
}

export interface FormFieldUpdate {
  field_type?: FormFieldType;
  label?: string;
  description?: string | null;
  placeholder?: string | null;
  field_order?: number;
  required?: boolean;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
}

// Fetch all fields for a form
export function useFormFields(formId: string | undefined) {
  return useQuery({
    queryKey: ["form-fields", formId],
    queryFn: async () => {
      if (!formId) return [];

      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", formId)
        .order("field_order", { ascending: true });

      if (error) throw error;
      return data as FormField[];
    },
    enabled: !!formId,
  });
}

// Create a new field
export function useCreateFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FormFieldInsert) => {
      // Get the highest field_order for this form
      const { data: existingFields } = await supabase
        .from("form_fields")
        .select("field_order")
        .eq("form_id", input.form_id)
        .order("field_order", { ascending: false })
        .limit(1);

      const nextOrder = existingFields && existingFields.length > 0
        ? existingFields[0].field_order + 1
        : 0;

      const { data, error } = await supabase
        .from("form_fields")
        .insert({
          form_id: input.form_id,
          field_type: input.field_type,
          label: input.label,
          description: input.description || null,
          placeholder: input.placeholder || null,
          field_order: input.field_order ?? nextOrder,
          required: input.required ?? false,
          options: input.options || null,
          validation: input.validation || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FormField;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-fields", data.form_id] });
      toast.success("Field added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add field: ${error.message}`);
    },
  });
}

// Update a field
export function useUpdateFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId, updates }: { id: string; formId: string; updates: FormFieldUpdate }) => {
      const { data, error } = await supabase
        .from("form_fields")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, formId } as FormField & { formId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-fields", data.formId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update field: ${error.message}`);
    },
  });
}

// Delete a field
export function useDeleteFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: string; formId: string }) => {
      const { error } = await supabase
        .from("form_fields")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { formId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-fields", data.formId] });
      toast.success("Field deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete field: ${error.message}`);
    },
  });
}

// Reorder fields
export function useReorderFormFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, fieldIds }: { formId: string; fieldIds: string[] }) => {
      // Update each field's order based on its position in the array
      const updates = fieldIds.map((id, index) =>
        supabase
          .from("form_fields")
          .update({ field_order: index })
          .eq("id", id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        throw new Error("Failed to reorder some fields");
      }

      return { formId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-fields", data.formId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder fields: ${error.message}`);
    },
  });
}

// Duplicate a field
export function useDuplicateFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: string; formId: string }) => {
      // Get the original field
      const { data: original, error: fetchError } = await supabase
        .from("form_fields")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Get the highest field_order
      const { data: existingFields } = await supabase
        .from("form_fields")
        .select("field_order")
        .eq("form_id", formId)
        .order("field_order", { ascending: false })
        .limit(1);

      const nextOrder = existingFields && existingFields.length > 0
        ? existingFields[0].field_order + 1
        : 0;

      // Create the duplicate
      const { data, error } = await supabase
        .from("form_fields")
        .insert({
          form_id: formId,
          field_type: original.field_type,
          label: `${original.label} (copy)`,
          description: original.description,
          placeholder: original.placeholder,
          field_order: nextOrder,
          required: original.required,
          options: original.options,
          validation: original.validation,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FormField;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-fields", data.form_id] });
      toast.success("Field duplicated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to duplicate field: ${error.message}`);
    },
  });
}

// Get field type configuration (for UI rendering)
export const FIELD_TYPE_CONFIG: Record<FormFieldType, {
  label: string;
  icon: string;
  hasOptions: boolean;
  hasValidation: boolean;
  defaultValidation?: FieldValidation;
}> = {
  text: {
    label: "Short Text",
    icon: "Type",
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { max_length: 500 },
  },
  textarea: {
    label: "Long Text",
    icon: "AlignLeft",
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { max_length: 5000 },
  },
  select: {
    label: "Dropdown",
    icon: "ChevronDown",
    hasOptions: true,
    hasValidation: false,
  },
  multiselect: {
    label: "Multiple Choice",
    icon: "CheckSquare",
    hasOptions: true,
    hasValidation: false,
  },
  radio: {
    label: "Radio Buttons",
    icon: "Circle",
    hasOptions: true,
    hasValidation: false,
  },
  checkbox: {
    label: "Checkbox",
    icon: "CheckSquare",
    hasOptions: false,
    hasValidation: false,
  },
  rating: {
    label: "Rating",
    icon: "Star",
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { min: 1, max: 5 },
  },
  scale: {
    label: "Scale",
    icon: "Sliders",
    hasOptions: false,
    hasValidation: true,
    defaultValidation: { min: 1, max: 10 },
  },
  date: {
    label: "Date",
    icon: "Calendar",
    hasOptions: false,
    hasValidation: true,
  },
  email: {
    label: "Email",
    icon: "Mail",
    hasOptions: false,
    hasValidation: false,
  },
  number: {
    label: "Number",
    icon: "Hash",
    hasOptions: false,
    hasValidation: true,
  },
  yes_no: {
    label: "Yes / No",
    icon: "ToggleLeft",
    hasOptions: false,
    hasValidation: false,
  },
};
