import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FormField } from "./useFormFields";

export interface FormResponseMetadata {
  ip_address?: string | null;
  user_agent?: string | null;
  submission_duration_seconds?: number | null;
  submitted_at?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  link_id: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  answers: Record<string, unknown>;
  metadata: FormResponseMetadata | null;
  created_at: string;
}

export interface FormResponseWithLink extends FormResponse {
  link?: {
    token: string;
    link_type: string;
    recipient_name: string | null;
    recipient_email: string | null;
    recipient_company: string | null;
  } | null;
}

// Fetch all responses for a form
export function useFormResponses(formId: string | undefined) {
  return useQuery({
    queryKey: ["form-responses", formId],
    queryFn: async () => {
      if (!formId) return [];

      const { data, error } = await supabase
        .from("form_responses")
        .select(`
          *,
          link:form_links(token, link_type, recipient_name, recipient_email, recipient_company)
        `)
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FormResponseWithLink[];
    },
    enabled: !!formId,
  });
}

// Fetch a single response
export function useFormResponse(id: string | undefined) {
  return useQuery({
    queryKey: ["form-responses", "single", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("form_responses")
        .select(`
          *,
          link:form_links(token, link_type, recipient_name, recipient_email, recipient_company)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as FormResponseWithLink;
    },
    enabled: !!id,
  });
}

// Delete a response
export function useDeleteFormResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formId }: { id: string; formId: string }) => {
      const { error } = await supabase
        .from("form_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { formId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-responses", data.formId] });
      toast.success("Response deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete response: ${error.message}`);
    },
  });
}

// Delete multiple responses
export function useDeleteMultipleFormResponses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, formId }: { ids: string[]; formId: string }) => {
      const { error } = await supabase
        .from("form_responses")
        .delete()
        .in("id", ids);

      if (error) throw error;
      return { formId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-responses", data.formId] });
      toast.success("Responses deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete responses: ${error.message}`);
    },
  });
}

// Form analytics data
export interface FormAnalytics {
  totalResponses: number;
  responsesOverTime: { date: string; count: number }[];
  fieldAnalytics: Record<string, FieldAnalytic>;
  averageCompletionTime: number | null;
}

export interface FieldAnalytic {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  distribution?: { value: string; count: number; percentage: number }[];
  average?: number;
  textResponses?: string[];
}

// Get form analytics
export function useFormAnalytics(formId: string | undefined, fields: FormField[]) {
  return useQuery({
    queryKey: ["form-analytics", formId],
    queryFn: async (): Promise<FormAnalytics> => {
      if (!formId) {
        return {
          totalResponses: 0,
          responsesOverTime: [],
          fieldAnalytics: {},
          averageCompletionTime: null,
        };
      }

      const { data: responses, error } = await supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const typedResponses = responses as FormResponse[];

      // Calculate responses over time (by day)
      const responsesByDate = new Map<string, number>();
      typedResponses.forEach((response) => {
        const date = new Date(response.created_at).toISOString().split("T")[0];
        responsesByDate.set(date, (responsesByDate.get(date) || 0) + 1);
      });

      const responsesOverTime = Array.from(responsesByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate field analytics
      const fieldAnalytics: Record<string, FieldAnalytic> = {};

      fields.forEach((field) => {
        const analytic: FieldAnalytic = {
          fieldId: field.id,
          fieldLabel: field.label,
          fieldType: field.field_type,
        };

        const answers = typedResponses
          .map((r) => r.answers[field.id])
          .filter((a) => a !== undefined && a !== null && a !== "");

        if (answers.length === 0) {
          fieldAnalytics[field.id] = analytic;
          return;
        }

        // Distribution for select/radio/multiselect/yes_no/checkbox
        if (["select", "radio", "multiselect", "yes_no", "checkbox"].includes(field.field_type)) {
          const counts = new Map<string, number>();

          answers.forEach((answer) => {
            if (Array.isArray(answer)) {
              answer.forEach((v) => {
                const key = String(v);
                counts.set(key, (counts.get(key) || 0) + 1);
              });
            } else {
              const key = String(answer);
              counts.set(key, (counts.get(key) || 0) + 1);
            }
          });

          const total = answers.length;
          analytic.distribution = Array.from(counts.entries())
            .map(([value, count]) => ({
              value,
              count,
              percentage: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count);
        }

        // Average for rating/scale/number
        if (["rating", "scale", "number"].includes(field.field_type)) {
          const numericAnswers = answers
            .map((a) => Number(a))
            .filter((n) => !isNaN(n));

          if (numericAnswers.length > 0) {
            analytic.average =
              numericAnswers.reduce((sum, n) => sum + n, 0) / numericAnswers.length;
          }

          // Also create distribution for ratings
          if (["rating", "scale"].includes(field.field_type)) {
            const counts = new Map<string, number>();
            numericAnswers.forEach((n) => {
              const key = String(n);
              counts.set(key, (counts.get(key) || 0) + 1);
            });

            analytic.distribution = Array.from(counts.entries())
              .map(([value, count]) => ({
                value,
                count,
                percentage: Math.round((count / numericAnswers.length) * 100),
              }))
              .sort((a, b) => Number(a.value) - Number(b.value));
          }
        }

        // Text responses for text/textarea/email
        if (["text", "textarea", "email"].includes(field.field_type)) {
          analytic.textResponses = answers.slice(0, 100).map((a) => String(a));
        }

        fieldAnalytics[field.id] = analytic;
      });

      // Calculate average completion time
      const completionTimes = typedResponses
        .map((r) => r.metadata?.submission_duration_seconds)
        .filter((t): t is number => t !== undefined && t !== null);

      const averageCompletionTime =
        completionTimes.length > 0
          ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
          : null;

      return {
        totalResponses: typedResponses.length,
        responsesOverTime,
        fieldAnalytics,
        averageCompletionTime,
      };
    },
    enabled: !!formId && fields.length > 0,
  });
}

// Export responses to CSV
export function exportResponsesToCSV(
  responses: FormResponseWithLink[],
  fields: FormField[],
  formTitle: string
): void {
  if (responses.length === 0) {
    toast.error("No responses to export");
    return;
  }

  // Build headers
  const headers = [
    "Response ID",
    "Submitted At",
    "Respondent Name",
    "Respondent Email",
    "Link Type",
    "Link Recipient",
    ...fields.map((f) => f.label),
  ];

  // Build rows
  const rows = responses.map((response) => {
    const row = [
      response.id,
      new Date(response.created_at).toLocaleString(),
      response.respondent_name || "",
      response.respondent_email || "",
      response.link?.link_type || "",
      response.link?.recipient_name || response.link?.recipient_email || "",
    ];

    // Add field answers
    fields.forEach((field) => {
      const answer = response.answers[field.id];
      if (answer === undefined || answer === null) {
        row.push("");
      } else if (Array.isArray(answer)) {
        row.push(answer.join("; "));
      } else {
        row.push(String(answer));
      }
    });

    return row;
  });

  // Convert to CSV
  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  // Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${formTitle.replace(/[^a-z0-9]/gi, "_")}_responses_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("Responses exported to CSV");
}

// Submit form response (for public form submission)
export async function submitFormResponse(
  token: string,
  answers: Record<string, unknown>,
  respondentName?: string,
  respondentEmail?: string,
  metadata?: { userAgent?: string; submissionDurationSeconds?: number }
): Promise<{ success: boolean; responseId?: string; thankYouMessage?: string; error?: string }> {
  const response = await supabase.functions.invoke("submit-form-response", {
    body: {
      token,
      answers,
      respondentName,
      respondentEmail,
      metadata,
    },
  });

  if (response.error) {
    return { success: false, error: response.error.message };
  }

  return response.data;
}
