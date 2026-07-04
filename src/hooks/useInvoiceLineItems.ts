import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export function useInvoiceLineItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice_line_items", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as InvoiceLineItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useSaveInvoiceLineItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      lineItems,
    }: {
      invoiceId: string;
      lineItems: InvoiceLineItemInput[];
    }) => {
      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);

      if (lineItems.length > 0) {
        const itemsToInsert = lineItems.map((item, index) => ({
          invoice_id: invoiceId,
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          sort_order: index,
        }));

        const { error } = await supabase.from("invoice_line_items").insert(itemsToInsert);
        if (error) throw error;
      }

      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["invoice_line_items", invoiceId] });
    },
    onError: (error) => {
      toast.error("Failed to save line items: " + error.message);
    },
  });
}
