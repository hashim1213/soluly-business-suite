import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  Mail,
  Building2,
  AlertCircle,
  User,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  validatePassword,
  validateSlug,
  validateEmail,
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getBaseDomain } from "@/lib/tenant";

// When set, workspaces live at <slug>.<domain> (Harvest/Atlassian style)
const subdomainBase = getBaseDomain();

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  orgName?: string;
  orgSlug?: string;
};

// Turn an organization name into a URL-safe slug
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function Signup() {
  useDocumentTitle("Sign Up");
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  // Once the user edits the slug by hand, stop auto-generating it from the org name
  const slugManuallyEdited = useRef(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Shown when the account was created but Supabase requires email confirmation
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  // Slug availability state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Check slug availability via RPC. Returns true when available.
  const checkSlugAvailability = useCallback(async (slug: string): Promise<boolean> => {
    setSlugStatus("checking");
    try {
      // "check_slug_availability" is not present in the generated Supabase
      // types, so call rpc through a narrow cast for this one function.
      const rpc = supabase.rpc.bind(supabase) as (
        fn: string,
        args: Record<string, unknown>
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
      const { data, error: rpcError } = await rpc("check_slug_availability", {
        p_slug: slug.toLowerCase(),
      });

      if (rpcError) {
        console.error("Error checking slug:", rpcError);
        setSlugStatus("idle");
        return true; // Don't block signup on a failed check; the server enforces uniqueness
      }

      const result = data as { available: boolean; slug?: string; error?: string };
      setSlugStatus(result.available ? "available" : "taken");
      return result.available;
    } catch (err) {
      console.error("Error checking slug:", err);
      setSlugStatus("idle");
      return true;
    }
  }, []);

  // Debounced availability check while typing
  useEffect(() => {
    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    if (orgSlug.length >= 3) {
      slugCheckTimeout.current = setTimeout(() => {
        checkSlugAvailability(orgSlug);
      }, 500);
    } else {
      setSlugStatus("idle");
    }

    return () => {
      if (slugCheckTimeout.current) {
        clearTimeout(slugCheckTimeout.current);
      }
    };
  }, [orgSlug, checkSlugAvailability]);

  // Auto-generate slug from org name unless the user customized it
  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    clearFieldError("orgName");
    if (!slugManuallyEdited.current) {
      setOrgSlug(slugify(value));
      clearFieldError("orgSlug");
    }
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = value.length > 0;
    setOrgSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    clearFieldError("orgSlug");
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthColor = {
    weak: "bg-destructive",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }[passwordStrength];

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = "Please enter your name.";
    }
    if (!validateEmail(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
    if (!orgName.trim()) {
      errors.orgName = "Please enter your organization name.";
    }
    const slugValidation = validateSlug(orgSlug);
    if (!slugValidation.isValid) {
      errors.orgSlug = slugValidation.error || "Invalid organization URL";
    } else if (slugStatus === "taken") {
      errors.orgSlug = "This URL is already taken. Please choose a different one.";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    try {
      // Final availability check in case the debounced one hasn't finished
      if (slugStatus !== "available") {
        const available = await checkSlugAvailability(orgSlug);
        if (!available) {
          setFieldErrors({ orgSlug: "This URL is already taken. Please choose a different one." });
          setIsLoading(false);
          return;
        }
      }

      const result = await signUp(email.trim(), password, name.trim(), orgName.trim(), orgSlug);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Two possible paths after a successful signup:
      // 1. Email confirmation is off -> we already have a session; go to "/"
      //    and let OrgRedirect route into the workspace (or finish org setup).
      // 2. Email confirmation is required -> no session yet; show the
      //    "Check your email" screen.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/", { replace: true });
        // Keep the loading state while navigating away
      } else {
        setAwaitingConfirmation(true);
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // Success state: account created, email confirmation required
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent a confirmation link to <strong>{email}</strong>
          </p>

          <div className="bg-muted/50 p-4 rounded-xl border space-y-3 text-left mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <span>Click the link in your email to verify your account</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <span>
                Your organization <strong>{orgName}</strong> will be ready when you sign in
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => navigate("/login")}
          >
            Back to sign in
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" alt="Soluly" className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm">
            Start your free 1-month trial
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20 flex items-start gap-2 mb-6"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section: Your details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your details</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                autoComplete="name"
                autoFocus
                disabled={isLoading}
                className={cn(
                  "h-12 rounded-xl",
                  fieldErrors.name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                onBlur={() => {
                  if (email && !validateEmail(email.trim())) {
                    setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
                  }
                }}
                autoComplete="email"
                disabled={isLoading}
                className={cn(
                  "h-12 rounded-xl",
                  fieldErrors.email && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-xl pr-10",
                    fieldErrors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  At least {PASSWORD_MIN_LENGTH} characters with uppercase, lowercase & number
                </p>
              )}
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", passwordStrengthColor)}
                      style={{
                        width:
                          passwordStrength === "weak"
                            ? "33%"
                            : passwordStrength === "medium"
                              ? "66%"
                              : "100%",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground capitalize w-14">
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Your organization */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your organization</h2>
                <p className="text-sm text-muted-foreground">Set up your workspace</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Acme Inc"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                disabled={isLoading}
                className={cn(
                  "h-12 rounded-xl",
                  fieldErrors.orgName && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {fieldErrors.orgName && (
                <p className="text-xs text-destructive">{fieldErrors.orgName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSlug">Workspace address</Label>
              <div className="flex items-center">
                {!subdomainBase && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 h-12 flex items-center rounded-l-xl border border-r-0">
                    soluly.com/org/
                  </span>
                )}
                <div className="relative flex-1">
                  <Input
                    id="orgSlug"
                    type="text"
                    placeholder="acme"
                    value={orgSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "h-12 pr-10",
                      subdomainBase ? "rounded-r-none rounded-l-xl" : "rounded-l-none rounded-r-xl",
                      (slugStatus === "taken" || fieldErrors.orgSlug) &&
                        "border-destructive focus-visible:ring-destructive",
                      slugStatus === "available" &&
                        !fieldErrors.orgSlug &&
                        "border-green-500 focus-visible:ring-green-500"
                    )}
                  />
                  {orgSlug.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugStatus === "checking" && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {slugStatus === "available" && <Check className="h-4 w-4 text-green-500" />}
                      {slugStatus === "taken" && <X className="h-4 w-4 text-destructive" />}
                    </div>
                  )}
                </div>
                {subdomainBase && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 h-12 flex items-center rounded-r-xl border border-l-0">
                    .{subdomainBase}
                  </span>
                )}
              </div>
              {fieldErrors.orgSlug ? (
                <p className="text-xs text-destructive">{fieldErrors.orgSlug}</p>
              ) : slugStatus === "taken" ? (
                <p className="text-xs text-destructive">
                  This URL is already taken. Please choose a different one.
                </p>
              ) : slugStatus === "available" ? (
                <p className="text-xs text-green-600">This URL is available!</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Auto-generated from your organization name. You can customize it.
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
