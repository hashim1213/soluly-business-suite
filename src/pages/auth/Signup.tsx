import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Mail, Building2, AlertCircle, ArrowRight, ArrowLeft, User, Lock, Check, X } from "lucide-react";
import { validatePassword, validateSlug, getPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Multi-step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);

  // Slug availability state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check slug availability with debounce using RPC function
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    try {
      const { data, error } = await supabase.rpc("check_slug_availability", {
        p_slug: slug.toLowerCase()
      });

      if (error) {
        console.error("Error checking slug:", error);
        setSlugStatus("idle");
        return;
      }

      const result = data as { available: boolean; slug?: string; error?: string };
      setSlugStatus(result.available ? "available" : "taken");
    } catch (err) {
      console.error("Error checking slug:", err);
      setSlugStatus("idle");
    }
  }, []);

  // Debounced slug check
  useEffect(() => {
    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout);
    }

    if (orgSlug.length >= 3) {
      const timeout = setTimeout(() => {
        checkSlugAvailability(orgSlug);
      }, 500);
      setSlugCheckTimeout(timeout);
    } else {
      setSlugStatus("idle");
    }

    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
    };
  }, [orgSlug, checkSlugAvailability]);

  // Auto-generate slug from org name
  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setOrgSlug(slug);
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthColor = {
    weak: "bg-destructive",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }[passwordStrength];

  const canProceedStep1 = name.trim().length > 0 && email.trim().length > 0 && email.includes("@");
  const canProceedStep2 = orgName.trim().length > 0 && orgSlug.trim().length >= 3 && slugStatus === "available";
  const canProceedStep3 = password.length >= PASSWORD_MIN_LENGTH;

  const handleNext = () => {
    setError(null);
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    const slugValidation = validateSlug(orgSlug);
    if (!slugValidation.isValid) {
      setError(slugValidation.error || "Invalid organization URL");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(email, password, name, orgName, orgSlug);
      setIsLoading(false);

      if (result.error) {
        setError(result.error);
      } else {
        setSignupComplete(true);
      }
    } catch {
      setIsLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // Success state
  if (signupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
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
              <span>Your organization <strong>{orgName}</strong> is ready</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => navigate("/login")}
          >
            Go to Sign In
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
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" alt="Soluly" className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm">
            Start your free 1-month trial
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20 flex items-start gap-2 mb-6">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Personal details</h2>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceedStep1}
              className="w-full h-12 rounded-xl"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Organization */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Organization</h2>
                <p className="text-sm text-muted-foreground">Set up your workspace</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Acme Inc"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  autoFocus
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">Workspace URL</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground bg-muted px-3 h-12 flex items-center rounded-l-xl border border-r-0">
                    soluly.com/org/
                  </span>
                  <div className="relative flex-1">
                    <Input
                      id="orgSlug"
                      type="text"
                      placeholder="acme"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className={cn(
                        "h-12 rounded-l-none rounded-r-xl pr-10",
                        slugStatus === "taken" && "border-destructive focus-visible:ring-destructive",
                        slugStatus === "available" && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />
                    {orgSlug.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {slugStatus === "checking" && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {slugStatus === "available" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {slugStatus === "taken" && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {slugStatus === "taken" && (
                  <p className="text-xs text-destructive">
                    This URL is already taken. Please choose a different one.
                  </p>
                )}
                {slugStatus === "available" && (
                  <p className="text-xs text-green-600">
                    This URL is available!
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 rounded-xl px-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceedStep2}
                className="flex-1 h-12 rounded-xl"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Secure your account</h2>
                <p className="text-sm text-muted-foreground">Create a strong password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                  className="h-12 rounded-xl"
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all", passwordStrengthColor)}
                          style={{ width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize w-14">{passwordStrength}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min {PASSWORD_MIN_LENGTH} characters with uppercase, lowercase & number
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium">{orgName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-12 rounded-xl px-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!canProceedStep3 || isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

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
