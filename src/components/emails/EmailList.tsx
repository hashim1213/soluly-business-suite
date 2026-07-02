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
  ticket: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  feature_request: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  customer_quote: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  feedback: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

const categoryLabels: Record<EmailCategory, string> = {
  ticket: "Ticket",
  feature_request: "Feature",
  customer_quote: "Quote",
  feedback: "Feedback",
  other: "Other",
};

const statusConfig = {
  pending: {
    icon: Clock,
    className: "text-yellow-600",
    label: "Pending Processing"
  },
  needsReview: {
    icon: AlertCircle,
    className: "text-orange-600",
    label: "Needs Review"
  },
  approved: {
    icon: CheckCircle,
    className: "text-green-600",
    label: "Approved"
  },
  dismissed: {
    icon: XCircle,
    className: "text-gray-400",
    label: "Dismissed"
  },
  failed: {
    icon: AlertCircle,
    className: "text-red-600",
    label: "Processing Failed"
  }
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
        <h3 className="font-semibold text-lg mb-2">No emails found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or sync your email accounts.
        </p>
      </div>
    );
  }

  const getEmailStatus = (email: Email) => {
    if (email.status === "pending") return statusConfig.pending;
    if (email.status === "failed") return statusConfig.failed;
    if (email.review_status === "pending") return statusConfig.needsReview;
    if (email.review_status === "approved") return statusConfig.approved;
    return statusConfig.dismissed;
  };

  return (
    <ScrollArea className="h-full">
      <div className="divide-y-2 divide-border">
        {emails.map((email) => {
          const status = getEmailStatus(email);
          const StatusIcon = status.icon;
          const isSelected = selectedId === email.id;

          return (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={cn(
                "w-full text-left p-5 hover:bg-accent/70 transition-all border-l-4",
                isSelected
                  ? "bg-accent border-l-primary"
                  : "border-l-transparent hover:border-l-primary/30"
              )}
            >
              {/* Header: Sender & Date */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StatusIcon className={cn("h-4 w-4 shrink-0", status.className)} />
                  <span className={cn(
                    "font-semibold truncate text-base",
                    isSelected && "text-primary"
                  )}>
                    {email.sender_name || email.sender_email}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground shrink-0 font-medium">
                  {format(new Date(email.received_at), "MMM d")}
                </span>
              </div>

              {/* Subject */}
              <div className="font-medium text-base mb-3 line-clamp-2 leading-snug">
                {email.subject}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                {email.display_id && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                    {email.display_id}
                  </span>
                )}
                {email.category && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium border", categoryColors[email.category])}
                  >
                    {categoryLabels[email.category]}
                  </Badge>
                )}
                {email.email_account && (
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {email.email_account.display_name}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
