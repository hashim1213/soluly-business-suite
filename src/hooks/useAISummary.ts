import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SummarizeResult {
  success: boolean;
  summary?: string;
  summarizedAt?: string;
  error?: string;
}

/**
 * Hook to summarize a feature request using AI
 */
export function useSummarizeFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (featureId: string): Promise<SummarizeResult> => {
      const { data, error } = await supabase.functions.invoke("summarize-feature", {
        body: { featureId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to generate summary");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      toast.success("AI summary generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });
}
