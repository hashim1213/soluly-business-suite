import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setStatus("error");
        setError(errorParam === "access_denied" ? "Access was denied" : errorParam);
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      try {
        // Exchange the code for tokens via Edge Function
        // Must use the EXACT same redirect URI that was used to get the auth code
        let redirectUri: string;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          redirectUri = 'http://localhost:8080/auth/gmail/callback';
        } else {
          redirectUri = `${window.location.origin}/auth/gmail/callback`;
        }
        console.log("Exchanging code with redirectUri:", redirectUri);

        const { data, error: fnError } = await supabase.functions.invoke("gmail-oauth", {
          body: {
            action: "exchange_code",
            code,
            redirectUri,
          },
        });

        console.log("Response:", { data, error: fnError });

        if (fnError || !data?.success) {
          throw new Error(fnError?.message || data?.error || "Failed to connect Gmail");
        }

        setStatus("success");

        // Redirect back to settings after a short delay
        setTimeout(() => {
          navigate(`/org/${organization?.slug}/settings`, {
            state: { gmailConnected: true }
          });
        }, 2000);

      } catch (err) {
        console.error("Gmail OAuth error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to connect Gmail account");
      }
    };

    handleCallback();
  }, [searchParams, navigate, organization]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Connecting Gmail...</h2>
              <p className="text-muted-foreground">Please wait while we set up your Gmail account.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold">Gmail Connected!</h2>
              <p className="text-muted-foreground">Your Gmail account has been successfully connected. Redirecting...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Connection Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate(`/org/${organization?.slug}/settings`)}>
                Back to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
