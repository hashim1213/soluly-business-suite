import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFinalizeEmailConnection } from "@/hooks/useComposioEmail";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { orgPath } from "@/lib/tenant";

export default function ComposioCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const finalize = useFinalizeEmailConnection();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const handleCallback = async () => {
      const statusParam = searchParams.get("status");
      const connectedAccountId =
        searchParams.get("connected_account_id") ||
        sessionStorage.getItem("composio_pending_connection");

      if (statusParam === "failed") {
        setStatus("error");
        setError("Authorization failed or was cancelled");
        return;
      }

      if (!connectedAccountId) {
        setStatus("error");
        setError("No connection reference found");
        return;
      }

      try {
        const result = await finalize.mutateAsync(connectedAccountId);
        sessionStorage.removeItem("composio_pending_connection");
        setEmail(result.email);
        setStatus("success");

        setTimeout(() => {
          navigate(orgPath(organization?.slug, "/settings"), {
            state: { emailConnected: true },
          });
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to connect email account");
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Connecting email account...</h2>
              <p className="text-muted-foreground">Please wait while we finish setting up your account.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold">Email Connected!</h2>
              <p className="text-muted-foreground">
                {email ? `${email} has been connected.` : "Your account has been connected."} Redirecting...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Connection Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate(orgPath(organization?.slug, "/settings"))}>
                Back to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
