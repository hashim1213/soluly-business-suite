import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Loader2 } from "lucide-react";
import { format, isToday, isThisYear } from "date-fns";
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

const categoryDot: Record<EmailCategory, string> = {
  ticket: "bg-red-500",
  feature_request: "bg-purple-500",
  customer_quote: "bg-blue-500",
  feedback: "bg-green-500",
  other: "bg-gray-400",
};

const categoryLabels: Record<EmailCategory, string> = {
  ticket: "Ticket",
  feature_request: "Feature",
  customer_quote: "Quote",
  feedback: "Feedback",
  other: "Other",
};

function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isThisYear(date)) return format(date, "MMM d");
  return format(date, "MM/dd/yy");
}

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
        <Mail className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="font-medium mb-1">No emails found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or sync your accounts.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border/60">
        {emails.map((email) => {
          const isSelected = selectedId === email.id;
          // "Unread" feel: anything not yet reviewed reads bolder
          const needsAttention = email.status === "pending" || email.review_status === "pending";

          return (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 transition-colors relative",
                isSelected ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              {isSelected && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}

              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-sm",
                    needsAttention ? "font-semibold" : "font-medium text-muted-foreground"
                  )}
                >
                  {email.sender_name || email.sender_email}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                  {formatEmailDate(email.received_at)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span
                  className={cn(
                    "truncate text-sm flex-1",
                    needsAttention ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {email.subject}
                </span>
                {email.category && (
                  <span className="flex items-center gap-1 shrink-0" title={categoryLabels[email.category]}>
                    <span className={cn("h-2 w-2 rounded-full", categoryDot[email.category])} />
                    <span className="text-[11px] text-muted-foreground hidden xl:inline">
                      {categoryLabels[email.category]}
                    </span>
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
