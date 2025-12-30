/**
 * Active Sessions Component
 * Displays and manages user's active sessions
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  Loader2,
  LogOut,
  Shield,
} from "lucide-react";
import {
  useUserSessions,
  useRevokeSession,
  useRevokeAllSessions,
  parseUserAgent,
  UserSession,
} from "@/hooks/useSessions";
import { formatDistanceToNow } from "date-fns";

function getDeviceIcon(device: string) {
  switch (device) {
    case "Mobile":
      return Smartphone;
    case "Tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: UserSession;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const { browser, os, device } = parseUserAgent(session.user_agent);
  const DeviceIcon = getDeviceIcon(device);

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
        session.is_current
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          session.is_current ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <DeviceIcon
          className={`h-5 w-5 ${
            session.is_current ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">
            {browser} on {os}
          </span>
          {session.is_current && (
            <Badge variant="secondary" className="text-xs">
              Current Session
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Active{" "}
              {formatDistanceToNow(new Date(session.last_activity_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          {session.ip_address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{session.ip_address}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            <span>{device}</span>
          </div>
        </div>
      </div>

      {!session.is_current && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          disabled={isRevoking}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isRevoking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export function ActiveSessions() {
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );

  const { data: sessions, isLoading } = useUserSessions();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  const otherSessions = sessions?.filter((s) => !s.is_current) || [];

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await revokeSession.mutateAsync(sessionId);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAll = async () => {
    await revokeAllSessions.mutateAsync();
    setShowRevokeAll(false);
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active sessions across devices. Sign out of sessions
                you don't recognize.
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevokeAll(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Sign Out All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            sessions?.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={() => handleRevokeSession(session.id)}
                isRevoking={revokingSessionId === session.id}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all other devices and browsers. You'll
              need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeAllSessions.isPending}
            >
              {revokeAllSessions.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
