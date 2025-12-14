import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { submitFormResponse } from "@/hooks/useFormResponses";
import { FormField, FormFieldType, FieldOption } from "@/hooks/useFormFields";

interface FormData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  settings: {
    allow_anonymous?: boolean;
    allow_multiple?: boolean;
    show_progress?: boolean;
    thank_you_message?: string;
  };
  closes_at: string | null;
}

interface FormLinkData {
  id: string;
  form_id: string;
  token: string;
  link_type: string;
  recipient_name: string | null;
  recipient_email: string | null;
  is_active: boolean;
  expires_at: string | null;
  max_responses: number | null;
  response_count: number;
}

export default function FormSubmit() {
  const { token } = useParams<{ token: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [formLink, setFormLink] = useState<FormLinkData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("Thank you for your response!");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());

  // Load form data
  useEffect(() => {
    async function loadForm() {
      if (!token) {
        setError("Invalid form link");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch form link
        const { data: linkData, error: linkError } = await supabase
          .from("form_links")
          .select("*")
          .eq("token", token)
          .single();

        if (linkError || !linkData) {
          setError("This form link is invalid or has been deactivated");
          setIsLoading(false);
          return;
        }

        const link = linkData as FormLinkData;

        // Check if link is active
        if (!link.is_active) {
          setError("This form link is no longer active");
          setIsLoading(false);
          return;
        }

        // Check expiration
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          setError("This form link has expired");
          setIsLoading(false);
          return;
        }

        // Check max responses
        if (link.max_responses !== null && link.response_count >= link.max_responses) {
          setError("This form link has reached its maximum number of responses");
          setIsLoading(false);
          return;
        }

        setFormLink(link);

        // Pre-fill respondent info from personal link
        if (link.recipient_name) setRespondentName(link.recipient_name);
        if (link.recipient_email) setRespondentEmail(link.recipient_email);

        // Fetch form
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", link.form_id)
          .single();

        if (formError || !formData) {
          setError("Form not found");
          setIsLoading(false);
          return;
        }

        const formTyped = formData as FormData;

        // Check if form is published
        if (formTyped.status !== "published") {
          setError("This form is not accepting responses");
          setIsLoading(false);
          return;
        }

        // Check if form has closed
        if (formTyped.closes_at && new Date(formTyped.closes_at) < new Date()) {
          setError("This form has closed");
          setIsLoading(false);
          return;
        }

        setForm(formTyped);

        // Fetch form fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("form_fields")
          .select("*")
          .eq("form_id", formTyped.id)
          .order("field_order", { ascending: true });

        if (fieldsError) {
          setError("Failed to load form fields");
          setIsLoading(false);
          return;
        }

        setFields((fieldsData || []) as FormField[]);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading form:", err);
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    }

    loadForm();
  }, [token]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate required fields
    fields.forEach((field) => {
      if (field.required) {
        const answer = answers[field.id];
        if (
          answer === undefined ||
          answer === null ||
          answer === "" ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          errors[field.id] = "This field is required";
        }
      }
    });

    // Validate email format if provided
    if (respondentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
      errors["respondent_email"] = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!form || !token) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const submissionDurationSeconds = Math.round((Date.now() - startTime) / 1000);

    const result = await submitFormResponse(
      token,
      answers,
      respondentName || undefined,
      respondentEmail || undefined,
      {
        userAgent: navigator.userAgent,
        submissionDurationSeconds,
      }
    );

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
      setThankYouMessage(result.thankYouMessage || form.settings?.thank_you_message || "Thank you for your response!");
    } else {
      setError(result.error || "Failed to submit response");
    }
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (fields.length === 0) return 0;
    const answeredCount = fields.filter((field) => {
      const answer = answers[field.id];
      return answer !== undefined && answer !== null && answer !== "" &&
        !(Array.isArray(answer) && answer.length === 0);
    }).length;
    return (answeredCount / fields.length) * 100;
  }, [fields, answers]);

  // Update answer
  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h1 className="text-xl font-bold mb-2">Unable to Load Form</h1>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h1 className="text-xl font-bold mb-2">Response Submitted</h1>
              <p className="text-gray-600">{thankYouMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        {form?.settings?.show_progress && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-1 text-right">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Form Header */}
        <Card className="border-2 border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{form?.title}</CardTitle>
            {form?.description && (
              <CardDescription className="text-base mt-2">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Respondent Info (if not anonymous) */}
        {!form?.settings?.allow_anonymous && (
          <Card className="border-2 border-gray-200 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="respondent_name">Name</Label>
                <Input
                  id="respondent_name"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Your name"
                  className="border-2"
                  disabled={!!formLink?.recipient_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondent_email">Email *</Label>
                <Input
                  id="respondent_email"
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => {
                    setRespondentEmail(e.target.value);
                    if (validationErrors["respondent_email"]) {
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors["respondent_email"];
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="your@email.com"
                  className={`border-2 ${validationErrors["respondent_email"] ? "border-red-500" : ""}`}
                  disabled={!!formLink?.recipient_email}
                />
                {validationErrors["respondent_email"] && (
                  <p className="text-sm text-red-500">{validationErrors["respondent_email"]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          {fields.map((field) => (
            <Card key={field.id} className="border-2 border-gray-200">
              <CardContent className="pt-6">
                <FormFieldRenderer
                  field={field}
                  value={answers[field.id]}
                  onChange={(value) => setAnswer(field.id, value)}
                  error={validationErrors[field.id]}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-6 text-lg border-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Response"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Field Renderer Component
function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const renderField = () => {
    switch (field.field_type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className={`border-2 ${error ? "border-red-500" : ""}`}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className={`border-2 min-h-[120px] ${error ? "border-red-500" : ""}`}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            className={`border-2 ${error ? "border-red-500" : ""}`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step}
            className={`border-2 ${error ? "border-red-500" : ""}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            min={field.validation?.min_date}
            max={field.validation?.max_date}
            className={`border-2 ${error ? "border-red-500" : ""}`}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={onChange}
          >
            <SelectTrigger className={`border-2 ${error ? "border-red-500" : ""}`}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={onChange}
            className="space-y-2"
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multiselect":
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={(value as boolean) || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.id}>Yes</Label>
          </div>
        );

      case "yes_no":
        return (
          <div className="flex gap-4">
            <Button
              type="button"
              variant={value === "yes" ? "default" : "outline"}
              onClick={() => onChange("yes")}
              className="flex-1 border-2"
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={value === "no" ? "default" : "outline"}
              onClick={() => onChange("no")}
              className="flex-1 border-2"
            >
              No
            </Button>
          </div>
        );

      case "rating":
        const maxStars = field.validation?.max || 5;
        const currentRating = (value as number) || 0;
        return (
          <div className="flex gap-2">
            {Array.from({ length: maxStars }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    i < currentRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 hover:text-amber-200"
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case "scale":
        const min = field.validation?.min || 1;
        const max = field.validation?.max || 10;
        const scaleValue = (value as number) || 0;
        return (
          <div className="space-y-2">
            <div className="flex justify-between gap-1">
              {Array.from({ length: max - min + 1 }).map((_, i) => {
                const num = min + i;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChange(num)}
                    className={`flex-1 py-3 text-center border-2 rounded transition-colors ${
                      scaleValue === num
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="border-2"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-base">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-gray-500">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
