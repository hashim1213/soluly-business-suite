import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type EmailCategory = Database["public"]["Enums"]["email_category"];

interface Email {
  id: string;
  display_id: string | null;
  sender_email: string;
  sender_name: string | null;
  subject: string;
  received_at: string;
  status: "pending" | "processed" | "failed";
  category: EmailCategory | null;
  review_status: "pending" | "approved" | "dismissed";
  email_account?: {
    display_name: string;
    email_address: string;
  } | null;
}

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

const categoryColors: Record<EmailCategory, string> = {
  ticket: "bg-red-100 text-red-800 border-red-200",
  feature_request: "bg-purple-100 text-purple-800 border-purple-200",
  customer_quote: "bg-blue-100 text-blue-800 border-blue-200",
  feedback: "bg-green-100 text-green-800 border-green-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

const categoryLabels: Record<EmailCategory, string> = {
  ticket: "Ticket",
  feature_request: "Feature",
  customer_quote: "Quote",
  feedback: "Feedback",
  other: "Other",
};

export function EmailList({ emails, selectedId, onSelect, isLoading }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No emails found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or sync your email accounts.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y-2">
        {emails.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={cn(
              "w-full text-left p-4 hover:bg-accent/50 transition-colors",
              selectedId === email.id && "bg-accent"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Status Indicator */}
                {email.status === "pending" && (
                  <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                )}
                {email.status === "processed" && email.review_status === "pending" && (
                  <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                )}
                {email.status === "processed" && email.review_status === "approved" && (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {email.status === "processed" && email.review_status === "dismissed" && (
                  <XCircle className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                {email.status === "failed" && (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}

                <span className="font-medium truncate">
                  {email.sender_name || email.sender_email}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(email.received_at), "MMM d")}
              </span>
            </div>

            <div className="font-medium text-sm mb-2 truncate">
              {email.subject}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {email.display_id && (
                <span className="text-xs text-muted-foreground font-mono">
                  {email.display_id}
                </span>
              )}
              {email.category && (
                <Badge
                  variant="outline"
                  className={cn("text-xs border", categoryColors[email.category])}
                >
                  {categoryLabels[email.category]}
                </Badge>
              )}
              {email.email_account && (
                <span className="text-xs text-muted-foreground">
                  via {email.email_account.display_name}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
