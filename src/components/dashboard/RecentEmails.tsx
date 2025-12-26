import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmails } from "@/hooks/useEmails";
import { formatDistanceToNow } from "date-fns";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

export function RecentEmails() {
  const { navigateOrg } = useOrgNavigation();
  const { data: emails, isLoading } = useEmails({});

  const recentEmails = emails?.slice(0, 5) || [];

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Recent Emails
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : recentEmails.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No emails synced yet</div>
        ) : (
          <div className="divide-y">
            {recentEmails.map((email) => (
              <div
                key={email.id}
                className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigateOrg("/emails")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {email.status === "pending" && <Clock className="h-3 w-3 text-yellow-500" />}
                      {email.review_status === "approved" && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {email.review_status === "pending" && email.status === "processed" && (
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {email.sender_name || email.sender_email}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {email.subject}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
