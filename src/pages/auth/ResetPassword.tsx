import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, CheckCircle, AlertCircle } from "lucide-react";
import { validatePassword, getPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/validation";

const REDIRECT_DELAY = 2000;

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthColor = {
    weak: "bg-destructive",
    medium: "bg-chart-4",
    strong: "bg-chart-2",
  }[passwordStrength];

  // Handle the reset token from the URL
  useEffect(() => {
    const handleResetToken = async () => {
      // Check if there's a hash with tokens (Supabase puts them in the hash)
      const hash = location.hash;

      if (hash && hash.includes("access_token")) {
        // Supabase will automatically handle the hash and set up the session
        // Wait for it to process
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError("Failed to validate reset link. Please try again.");
          setIsValidating(false);
          return;
        }

        if (session) {
          setHasValidSession(true);
          setIsValidating(false);
          return;
        }
      }

      // No hash or no session - check if there's an existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setHasValidSession(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }

      setIsValidating(false);
    };

    // Give Supabase a moment to process the hash
    const timeout = setTimeout(handleResetToken, 500);
    return () => clearTimeout(timeout);
  }, [location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(password);

    setIsLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      // Redirect to dashboard after success
      setTimeout(() => navigate("/"), REDIRECT_DELAY);
    }
  };

  // Show loading while validating the reset token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 bg-chart-2/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-chart-2" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Password updated</h2>
              <p className="text-muted-foreground">
                Your password has been successfully reset. Redirecting...
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if token is invalid
  if (!hasValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Reset Link Invalid</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Link to="/forgot-password" className="block">
                  <Button className="w-full">Request new reset link</Button>
                </Link>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">Back to login</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="border-2"
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-full ${passwordStrengthColor} transition-all`}
                        style={{ width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{passwordStrength}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min {PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, and number
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="border-2"
              />
            </div>

            <Button type="submit" className="w-full border-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
