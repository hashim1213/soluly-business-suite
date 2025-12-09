import { Mail, Inbox, Send, Archive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const emails = [
  {
    id: "EML-001",
    subject: "Request for project update - Acme Corp",
    from: "john@acmecorp.com",
    preview: "Hi, I wanted to check on the progress of our integration project. Could you provide an update on...",
    processed: true,
    category: "quote",
    project: "Acme Corp",
    received: "2 hours ago",
  },
  {
    id: "EML-002",
    subject: "New feature suggestion - Dashboard widgets",
    from: "sarah@techstart.io",
    preview: "We've been using the platform for a few months now and I have some ideas for new features that would...",
    processed: true,
    category: "feature",
    project: "TechStart Inc",
    received: "4 hours ago",
  },
  {
    id: "EML-003",
    subject: "Issue with report generation",
    from: "david@dataflow.io",
    preview: "I'm experiencing an issue when trying to generate the monthly report. The system shows an error...",
    processed: true,
    category: "feedback",
    project: "DataFlow Ltd",
    received: "Yesterday",
  },
  {
    id: "EML-004",
    subject: "Quote request for additional services",
    from: "emma@globalsol.com",
    preview: "Following our call yesterday, I'd like to request a formal quote for the additional services we...",
    processed: false,
    category: null,
    project: null,
    received: "Yesterday",
  },
  {
    id: "EML-005",
    subject: "Positive feedback on recent update",
    from: "mike@globalsol.com",
    preview: "Just wanted to drop a quick note to say the recent UI update is fantastic. Our team loves the new...",
    processed: false,
    category: null,
    project: null,
    received: "2 days ago",
  },
];

const categoryStyles = {
  feature: "bg-chart-4 text-foreground",
  quote: "bg-chart-1 text-background",
  feedback: "bg-chart-2 text-background",
};

const categoryLabels = {
  feature: "Feature Request",
  quote: "Quote",
  feedback: "Feedback",
};

export default function Emails() {
  const unprocessedCount = emails.filter(e => !e.processed).length;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Inbox</h1>
          <p className="text-muted-foreground">Process incoming emails with AI-powered categorization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Inbox
          </Button>
          <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{emails.length}</div>
                <div className="text-sm text-muted-foreground">Total Emails</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unprocessedCount}</div>
                <div className="text-sm text-muted-foreground">To Process</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Archive className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{emails.length - unprocessedCount}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold uppercase tracking-wider">Incoming Emails</CardTitle>
            <Badge variant="outline" className="font-mono">
              {unprocessedCount} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y-2 divide-border">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${!email.processed ? 'bg-secondary/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 border-2 border-border flex items-center justify-center shrink-0 ${email.processed ? 'bg-secondary' : 'bg-chart-4'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-sm ${!email.processed ? 'font-bold' : ''}`}>{email.from}</span>
                          {email.processed && email.category && (
                            <Badge className={categoryStyles[email.category as keyof typeof categoryStyles]}>
                              {categoryLabels[email.category as keyof typeof categoryLabels]}
                            </Badge>
                          )}
                          {!email.processed && (
                            <Badge variant="outline" className="border-chart-4 text-chart-4">
                              Pending AI Processing
                            </Badge>
                          )}
                        </div>
                        <h4 className={`${!email.processed ? 'font-bold' : 'font-medium'}`}>{email.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{email.preview}</p>
                        {email.project && (
                          <span className="text-xs text-muted-foreground mt-2 inline-block">
                            Linked to: {email.project}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{email.received}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-muted-foreground/50">
        <CardContent className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">AI Email Processing</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect your email inbox to automatically categorize incoming emails into Feature Requests, 
            Customer Quotes, and Feedback based on their content.
          </p>
          <Button className="mt-4 border-2" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
