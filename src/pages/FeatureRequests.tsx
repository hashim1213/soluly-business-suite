import { Plus, Lightbulb, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    id: "FTR-001",
    title: "Add export functionality to reports",
    description: "Users want to export reports in PDF and Excel formats for offline analysis",
    project: "Acme Corp",
    priority: "high",
    status: "in-review",
    votes: 12,
    requestedBy: "john@acmecorp.com",
    created: "Dec 8, 2024",
  },
  {
    id: "FTR-002",
    title: "Integration with Salesforce CRM",
    description: "Sync customer data automatically between our platform and Salesforce",
    project: "Acme Corp",
    priority: "low",
    status: "backlog",
    votes: 5,
    requestedBy: "sarah@acmecorp.com",
    created: "Dec 7, 2024",
  },
  {
    id: "FTR-003",
    title: "Mobile app feature request",
    description: "Native mobile app for iOS and Android with offline capabilities",
    project: "TechStart Inc",
    priority: "medium",
    status: "planned",
    votes: 23,
    requestedBy: "mike@techstart.io",
    created: "Dec 5, 2024",
  },
  {
    id: "FTR-004",
    title: "Advanced analytics dashboard",
    description: "Custom widgets and drag-and-drop dashboard builder",
    project: "Global Solutions",
    priority: "medium",
    status: "in-progress",
    votes: 18,
    requestedBy: "emma@globalsol.com",
    created: "Dec 2, 2024",
  },
  {
    id: "FTR-005",
    title: "Multi-language support",
    description: "Support for Spanish, French, and German languages",
    project: "DataFlow Ltd",
    priority: "low",
    status: "backlog",
    votes: 8,
    requestedBy: "david@dataflow.io",
    created: "Nov 28, 2024",
  },
];

const priorityStyles = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-chart-4 text-foreground",
  low: "bg-secondary text-secondary-foreground border-2 border-border",
};

const statusStyles = {
  backlog: "bg-muted text-muted-foreground",
  planned: "bg-chart-3 text-background",
  "in-review": "bg-chart-4 text-foreground",
  "in-progress": "bg-chart-2 text-background",
  completed: "bg-primary text-primary-foreground",
};

export default function FeatureRequests() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Requests</h1>
          <p className="text-muted-foreground">Track and manage customer feature requests</p>
        </div>
        <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
                  <Lightbulb className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{feature.id}</span>
                        <Badge className={statusStyles[feature.status as keyof typeof statusStyles]}>
                          {feature.status}
                        </Badge>
                        <Badge className={priorityStyles[feature.priority as keyof typeof priorityStyles]}>
                          {feature.priority}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-center border-2 border-border px-3 py-2 bg-secondary">
                        <div className="text-2xl font-bold">{feature.votes}</div>
                        <div className="text-xs text-muted-foreground uppercase">votes</div>
                      </div>
                      <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Project:</strong> {feature.project}</span>
                    <span><strong className="text-foreground">From:</strong> {feature.requestedBy}</span>
                    <span>{feature.created}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
