import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  expires_at: string;
  organization: { name: string; slug: string };
  role: { name: string };
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, acceptInvitation, refreshUserData } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successOrg, setSuccessOrg] = useState<{ name: string; slug: string } | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setIsLoading(false);
        return;
      }

      let { data, error } = await supabase
        .from("invitations")
        .select(`
          id,
          email,
          expires_at,
          organization:organizations(name, slug),
          role:roles(name)
        `)
        .eq("token", token)
        .is("accepted_at", null)
        .single();

      // If we get a 401, there might be a stale session - try signing out and retrying
      if (error?.message?.includes("JWT") || error?.code === "PGRST301" || (error as any)?.status === 401) {
        console.log("Stale session detected, signing out and retrying...");
        await supabase.auth.signOut();

        // Retry the query
        const retry = await supabase
          .from("invitations")
          .select(`
            id,
            email,
            expires_at,
            organization:organizations(name, slug),
            role:roles(name)
          `)
          .eq("token", token)
          .is("accepted_at", null)
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        console.error("Invitation fetch error:", error);
        console.error("Token used:", token);
        setError("This invitation is invalid or has already been used");
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        setIsLoading(false);
        return;
      }

      setInvitation(data as Invitation);

      // Check if user is already logged in
      if (user) {
        setIsExistingUser(true);
      }

      setIsLoading(false);
    };

    fetchInvitation();
  }, [token, user]);

  // Handle existing user accepting invite (logged in)
  const handleExistingUserAccept = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: rpcError } = await supabase.rpc("accept_invitation_existing_user", {
        p_token: token,
      });

      if (rpcError) {
        setError(rpcError.message);
        setIsSubmitting(false);
        return;
      }

      const result = data as {
        success: boolean;
        error?: string;
        organization_name?: string;
        organization_slug?: string;
        already_member?: boolean;
      };

      if (!result.success) {
        setError(result.error || "Failed to accept invitation");
        setIsSubmitting(false);
        return;
      }

      // Refresh user data to get new organization
      await refreshUserData();

      setSuccess(true);
      setSuccessOrg({
        name: result.organization_name || invitation?.organization?.name || "the organization",
        slug: result.organization_slug || invitation?.organization?.slug || "",
      });

      if (result.already_member) {
        toast.success("You're already a member of this organization!");
      } else {
        toast.success("Successfully joined the organization!");
      }

      // Redirect to settings page after delay (all users have access to settings)
      setTimeout(() => {
        if (result.organization_slug) {
          navigate(`/org/${result.organization_slug}/settings`);
        } else {
          navigate("/");
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Handle new user signup with invite
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    const { error } = await acceptInvitation(token!, password, name);

    if (error) {
      setError(error);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setSuccessOrg(invitation?.organization || null);
      // Auto-redirect to settings page after success (all users have access to settings)
      setTimeout(() => {
        if (invitation?.organization?.slug) {
          navigate(`/org/${invitation.organization.slug}/settings`);
        } else {
          navigate("/");
        }
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Invalid Invitation</h2>
              <p className="text-muted-foreground">{error}</p>
              <Link to="/login">
                <Button variant="outline" className="border-2">
                  Go to Login
                </Button>
              </Link>
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
              <h2 className="text-xl font-bold">Welcome aboard!</h2>
              <p className="text-muted-foreground">
                {isExistingUser
                  ? `You've joined ${successOrg?.name || "the organization"}. Redirecting...`
                  : "Your account has been created. Redirecting to dashboard..."}
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Existing user flow - just need to click accept
  if (isExistingUser && user) {
    const emailMatches = user.email?.toLowerCase() === invitation?.email?.toLowerCase();

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Join {invitation?.organization?.name}
            </CardTitle>
            <CardDescription>
              You've been invited to join as <strong>{invitation?.role?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            {!emailMatches && (
              <div className="bg-amber-500/10 text-amber-600 text-sm p-3 rounded-md border border-amber-500/20">
                <p className="font-medium">Email mismatch</p>
                <p>This invitation was sent to <strong>{invitation?.email}</strong></p>
                <p>You're logged in as <strong>{user.email}</strong></p>
                <p className="mt-2">Please log out and sign in with the correct email, or create a new account.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Invitation Email</Label>
              <Input
                type="email"
                value={invitation?.email || ""}
                disabled
                className="border-2 bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Logged in as</Label>
              <Input
                type="email"
                value={user.email || ""}
                disabled
                className="border-2 bg-muted"
              />
            </div>

            {emailMatches ? (
              <Button
                onClick={handleExistingUserAccept}
                className="w-full border-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Accept & Join Organization"
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-2"
                  onClick={() => navigate("/login")}
                >
                  Log out and sign in with correct email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // New user flow - need to create account
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Join {invitation?.organization?.name}
          </CardTitle>
          <CardDescription>
            You've been invited to join as <strong>{invitation?.role?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNewUserSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={invitation?.email || ""}
                disabled
                className="border-2 bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-2"
              />
            </div>

            <Button type="submit" className="w-full border-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Accept invitation"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
