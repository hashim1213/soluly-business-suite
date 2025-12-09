import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, FileText, MessageSquare } from "lucide-react";

const tickets = [
  {
    id: "TKT-001",
    title: "Add export functionality to reports",
    category: "feature",
    project: "Acme Corp",
    priority: "high",
    date: "2 hours ago",
  },
  {
    id: "TKT-002",
    title: "Quote request for enterprise package",
    category: "quote",
    project: "TechStart Inc",
    priority: "medium",
    date: "4 hours ago",
  },
  {
    id: "TKT-003",
    title: "Dashboard loading speed issue",
    category: "feedback",
    project: "Global Solutions",
    priority: "high",
    date: "Yesterday",
  },
  {
    id: "TKT-004",
    title: "Integration with Salesforce CRM",
    category: "feature",
    project: "Acme Corp",
    priority: "low",
    date: "Yesterday",
  },
  {
    id: "TKT-005",
    title: "Annual contract renewal discussion",
    category: "quote",
    project: "DataFlow Ltd",
    priority: "medium",
    date: "2 days ago",
  },
];

const categoryIcons = {
  feature: Lightbulb,
  quote: FileText,
  feedback: MessageSquare,
};

const categoryLabels = {
  feature: "Feature",
  quote: "Quote",
  feedback: "Feedback",
};

const priorityStyles = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-chart-4 text-foreground",
  low: "bg-secondary text-secondary-foreground border-2 border-border",
};

export function RecentTickets() {
  return (
    <Card className="border-2 border-border shadow-sm">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg font-bold uppercase tracking-wider">Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2 divide-border">
          {tickets.map((ticket) => {
            const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons];
            return (
              <div
                key={ticket.id}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 border-2 border-border flex items-center justify-center bg-secondary shrink-0 mt-0.5">
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                        <Badge variant="outline" className="text-xs font-medium">
                          {categoryLabels[ticket.category as keyof typeof categoryLabels]}
                        </Badge>
                      </div>
                      <h4 className="font-semibold mt-1">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{ticket.project}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={priorityStyles[ticket.priority as keyof typeof priorityStyles]}>
                      {ticket.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{ticket.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
