import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke a Supabase Edge Function with proper error extraction.
 * The default supabase.functions.invoke() loses the response body on non-2xx,
 * returning only "Edge Function returned a non-2xx status code". This wrapper
 * reads the JSON body from the error response and surfaces the real message.
 */
export async function invokeEdgeFunction<T = Record<string, unknown>>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    let message = error.message;
    try {
      if (error.context && typeof error.context.json === "function") {
        const errorBody = await error.context.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      }
    } catch {
      // If we can't parse the error body, use the generic message
    }
    throw new Error(message);
  }

  if (data && !data.success) {
    throw new Error(data.error || "Unknown error");
  }

  return data as T;
}
