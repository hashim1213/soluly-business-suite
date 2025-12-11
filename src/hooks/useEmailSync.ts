import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Process a single email with AI categorization using OpenAI
 * This calls the Supabase Edge Function which uses OpenAI GPT-4
 */
export function useProcessEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { data, error } = await supabase.functions.invoke("process-email", {
        body: { emailId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });

      if (data.success) {
        toast.success(`Categorized as ${data.category} (${Math.round(data.confidence * 100)}% confidence)`);
      } else {
        toast.error(data.error || "Processing failed");
      }
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });
}

/**
 * Process multiple emails with AI categorization
 */
export function useProcessAllPendingEmails() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Get all pending emails
      const { data: pendingEmails, error: fetchError } = await supabase
        .from("emails")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("status", "pending");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!pendingEmails || pendingEmails.length === 0) {
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;

      // Process each email
      for (const email of pendingEmails) {
        try {
          const { error } = await supabase.functions.invoke("process-email", {
            body: { emailId: email.id },
          });

          if (error) {
            failed++;
          } else {
            processed++;
          }
        } catch {
          failed++;
        }
      }

      return { processed, failed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });

      if (data.processed > 0) {
        toast.success(`Processed ${data.processed} email(s)`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} email(s) failed to process`);
      }
      if (data.processed === 0 && data.failed === 0) {
        toast.info("No pending emails to process");
      }
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });
}

/**
 * Add a new email manually to the system
 */
export function useAddEmail() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      senderEmail,
      senderName,
      subject,
      body,
      emailAccountId,
      processWithAI = true,
    }: {
      senderEmail: string;
      senderName?: string;
      subject: string;
      body: string;
      emailAccountId?: string;
      processWithAI?: boolean;
    }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Generate a unique message ID
      const messageId = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}@${organization.id}`;

      // Insert the email
      const { data: newEmail, error: insertError } = await supabase
        .from("emails")
        .insert({
          organization_id: organization.id,
          email_account_id: emailAccountId || null,
          message_id: messageId,
          sender_email: senderEmail,
          sender_name: senderName || senderEmail,
          subject,
          body,
          received_at: new Date().toISOString(),
          status: "pending",
          review_status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Optionally process with AI
      if (processWithAI && newEmail) {
        try {
          await supabase.functions.invoke("process-email", {
            body: { emailId: newEmail.id },
          });
        } catch (processError) {
          console.error("AI processing failed:", processError);
          // Don't throw - email was still created
        }
      }

      return newEmail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });
      toast.success("Email added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add email: ${error.message}`);
    },
  });
}

/**
 * Re-process an email with AI (useful after manual edits or to retry failed processing)
 */
export function useReprocessEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      // Reset the email status first
      const { error: updateError } = await supabase
        .from("emails")
        .update({ status: "pending", processed_at: null })
        .eq("id", emailId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Process with AI
      const { data, error } = await supabase.functions.invoke("process-email", {
        body: { emailId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email_stats"] });

      if (data.success) {
        toast.success(`Re-categorized as ${data.category}`);
      } else {
        toast.error(data.error || "Re-processing failed");
      }
    },
    onError: (error) => {
      toast.error(`Re-processing failed: ${error.message}`);
    },
  });
}
