import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Loader2 } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { formatDistanceToNow } from "date-fns";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { ticketStatusStyles, ticketPriorityStyles } from "@/lib/styles";

export function RecentTickets() {
  const { navigateOrg } = useOrgNavigation();
  const { data: tickets, isLoading } = useTickets();

  // Get recent tickets (limit to 5)
  const recentTickets = tickets?.slice(0, 5) || [];

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg font-bold uppercase tracking-wider">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border shadow-sm">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg font-bold uppercase tracking-wider">Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentTickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tickets found
          </div>
        ) : (
          <div className="divide-y-2 divide-border">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigateOrg(`/tickets/${ticket.display_id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 border-2 border-border flex items-center justify-center bg-secondary shrink-0 mt-0.5">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{ticket.display_id}</span>
                        <Badge className={`text-xs font-medium ${ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles] || "bg-slate-400 text-black"}`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <h4 className="font-semibold mt-1">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {ticket.project?.name || "No project"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={ticketPriorityStyles[ticket.priority as keyof typeof ticketPriorityStyles]}>
                      {ticket.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
