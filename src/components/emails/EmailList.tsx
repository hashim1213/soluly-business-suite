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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Mail className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No emails found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {emails.map((email) => {
        const isSelected = selectedId === email.id;
        const needsAttention = email.status === "pending" || email.review_status === "pending";

        return (
          <button
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={cn(
              "w-full text-left px-3 py-2 border-b border-border/40 transition-colors",
              isSelected
                ? "bg-accent border-l-2 border-l-primary"
                : "hover:bg-accent/50 border-l-2 border-l-transparent"
            )}
          >
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span
                className={cn(
                  "truncate text-[13px] leading-tight",
                  needsAttention ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                )}
              >
                {email.sender_name || email.sender_email}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                {formatEmailDate(email.received_at)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {email.category && (
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", categoryDot[email.category])} />
              )}
              <span
                className={cn(
                  "truncate text-[13px] leading-tight",
                  needsAttention ? "text-foreground/80" : "text-muted-foreground/70"
                )}
              >
                {email.subject}
              </span>
            </div>
          </button>
        );
      })}
    </ScrollArea>
  );
}
