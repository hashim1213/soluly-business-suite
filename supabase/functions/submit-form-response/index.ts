import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormSubmissionRequest {
  token: string;
  answers: Record<string, unknown>;
  respondentName?: string;
  respondentEmail?: string;
  metadata?: {
    userAgent?: string;
    submissionDurationSeconds?: number;
  };
}

interface FormField {
  id: string;
  field_type: string;
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: Record<string, unknown>;
}

interface FormLink {
  id: string;
  form_id: string;
  link_type: string;
  recipient_name?: string;
  recipient_email?: string;
  max_responses?: number;
  response_count: number;
  expires_at?: string;
  is_active: boolean;
}

interface Form {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  settings: {
    allow_anonymous?: boolean;
    allow_multiple?: boolean;
    thank_you_message?: string;
  };
  closes_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      token,
      answers,
      respondentName,
      respondentEmail,
      metadata,
    } = (await req.json()) as FormSubmissionRequest;

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Form token is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!answers || typeof answers !== "object") {
      return new Response(
        JSON.stringify({ error: "Answers are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the form link by token
    const { data: formLink, error: linkError } = await supabaseClient
      .from("form_links")
      .select("*")
      .eq("token", token)
      .single();

    if (linkError || !formLink) {
      return new Response(
        JSON.stringify({ error: "Invalid form link" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const link = formLink as FormLink;

    // Validate link is active
    if (!link.is_active) {
      return new Response(
        JSON.stringify({ error: "This form link is no longer active" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This form link has expired" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check max responses
    if (link.max_responses !== null && link.response_count >= link.max_responses) {
      return new Response(
        JSON.stringify({ error: "This form link has reached its maximum number of responses" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the form
    const { data: form, error: formError } = await supabaseClient
      .from("forms")
      .select("*")
      .eq("id", link.form_id)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = form as Form;

    // Validate form is published
    if (formData.status !== "published") {
      return new Response(
        JSON.stringify({ error: "This form is not accepting responses" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if form has closed
    if (formData.closes_at && new Date(formData.closes_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This form has closed" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch form fields
    const { data: fields, error: fieldsError } = await supabaseClient
      .from("form_fields")
      .select("*")
      .eq("form_id", formData.id)
      .order("field_order", { ascending: true });

    if (fieldsError) {
      console.error("Error fetching form fields:", fieldsError);
      return new Response(
        JSON.stringify({ error: "Failed to validate form fields" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formFields = (fields || []) as FormField[];

    // Validate required fields
    const missingFields: string[] = [];
    for (const field of formFields) {
      if (field.required) {
        const answer = answers[field.id];
        if (answer === undefined || answer === null || answer === "" ||
            (Array.isArray(answer) && answer.length === 0)) {
          missingFields.push(field.label);
        }
      }
    }

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Required fields are missing",
          missingFields,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format if provided
    if (respondentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for duplicate submissions if allow_multiple is false
    if (!formData.settings?.allow_multiple && respondentEmail) {
      const { data: existingResponse } = await supabaseClient
        .from("form_responses")
        .select("id")
        .eq("form_id", formData.id)
        .eq("respondent_email", respondentEmail)
        .single();

      if (existingResponse) {
        return new Response(
          JSON.stringify({ error: "You have already submitted a response to this form" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get IP address from request (if available)
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      req.headers.get("cf-connecting-ip") ||
                      null;

    // Create the response record
    const { data: response, error: responseError } = await supabaseClient
      .from("form_responses")
      .insert({
        form_id: formData.id,
        link_id: link.id,
        respondent_name: respondentName || link.recipient_name || null,
        respondent_email: respondentEmail || link.recipient_email || null,
        answers,
        metadata: {
          ip_address: ipAddress,
          user_agent: metadata?.userAgent || null,
          submission_duration_seconds: metadata?.submissionDurationSeconds || null,
          submitted_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (responseError) {
      console.error("Error creating form response:", responseError);
      return new Response(
        JSON.stringify({ error: "Failed to submit response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update response counts
    await supabaseClient.rpc("increment_form_response_count", {
      p_form_id: formData.id,
      p_link_id: link.id,
    });

    // Send notification to form creator (optional - fire and forget)
    try {
      if (formData.settings?.allow_anonymous === false || respondentEmail) {
        // Get form creator info for notification
        const { data: creator } = await supabaseClient
          .from("team_members")
          .select("id")
          .eq("id", form.created_by)
          .single();

        if (creator) {
          await supabaseClient.functions.invoke("create-notification", {
            body: {
              organizationId: formData.organization_id,
              recipientIds: [creator.id],
              type: "feedback",
              title: "New Form Response",
              message: `Someone submitted a response to "${formData.title}"`,
              entityType: "feedback",
              actorId: null,
              excludeActorFromNotification: false,
            },
          });
        }
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Don't fail the submission if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        responseId: response?.id,
        thankYouMessage: formData.settings?.thank_you_message || "Thank you for your response!",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
