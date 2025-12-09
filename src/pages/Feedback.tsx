import { Plus, MessageSquare, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const feedbackItems = [
  {
    id: "FBK-001",
    title: "Dashboard loading speed issue",
    description: "The main dashboard takes too long to load when there are many projects. Sometimes up to 10 seconds.",
    project: "Global Solutions",
    sentiment: "negative",
    category: "performance",
    status: "investigating",
    source: "email",
    from: "emma@globalsol.com",
    created: "Dec 7, 2024",
  },
  {
    id: "FBK-002",
    title: "Positive feedback on new UI",
    description: "The new interface is much cleaner and easier to navigate. Great job on the redesign!",
    project: "Global Solutions",
    sentiment: "positive",
    category: "ui-ux",
    status: "acknowledged",
    source: "email",
    from: "mike@globalsol.com",
    created: "Dec 4, 2024",
  },
  {
    id: "FBK-003",
    title: "Search functionality improvements needed",
    description: "Search results are not always relevant. Would be great to have filters and advanced search options.",
    project: "Acme Corp",
    sentiment: "neutral",
    category: "feature",
    status: "under-review",
    source: "call",
    from: "john@acmecorp.com",
    created: "Dec 2, 2024",
  },
  {
    id: "FBK-004",
    title: "Mobile experience is excellent",
    description: "Used the app on my phone during travel and it worked perfectly. Very responsive design.",
    project: "TechStart Inc",
    sentiment: "positive",
    category: "mobile",
    status: "acknowledged",
    source: "email",
    from: "sarah@techstart.io",
    created: "Nov 30, 2024",
  },
  {
    id: "FBK-005",
    title: "Report generation needs work",
    description: "Reports sometimes show incorrect totals. Also, the export to PDF feature is missing some charts.",
    project: "DataFlow Ltd",
    sentiment: "negative",
    category: "bug",
    status: "in-progress",
    source: "support",
    from: "david@dataflow.io",
    created: "Nov 28, 2024",
  },
];

const sentimentIcons = {
  positive: ThumbsUp,
  neutral: Meh,
  negative: ThumbsDown,
};

const sentimentStyles = {
  positive: "bg-chart-2 text-background",
  neutral: "bg-chart-4 text-foreground",
  negative: "bg-destructive text-destructive-foreground",
};

const statusStyles = {
  acknowledged: "bg-muted text-muted-foreground",
  "under-review": "bg-chart-4 text-foreground",
  investigating: "bg-chart-1 text-background",
  "in-progress": "bg-chart-2 text-background",
  resolved: "bg-primary text-primary-foreground",
};

const categoryLabels = {
  performance: "Performance",
  "ui-ux": "UI/UX",
  feature: "Feature",
  mobile: "Mobile",
  bug: "Bug Report",
};

export default function Feedback() {
  const positiveCount = feedbackItems.filter(f => f.sentiment === 'positive').length;
  const neutralCount = feedbackItems.filter(f => f.sentiment === 'neutral').length;
  const negativeCount = feedbackItems.filter(f => f.sentiment === 'negative').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Feedback</h1>
          <p className="text-muted-foreground">Track feedback on features and general platform experience</p>
        </div>
        <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          Log Feedback
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <ThumbsUp className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{positiveCount}</div>
                <div className="text-sm text-muted-foreground">Positive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <Meh className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{neutralCount}</div>
                <div className="text-sm text-muted-foreground">Neutral</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-destructive">
                <ThumbsDown className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{negativeCount}</div>
                <div className="text-sm text-muted-foreground">Needs Attention</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {feedbackItems.map((feedback) => {
          const SentimentIcon = sentimentIcons[feedback.sentiment as keyof typeof sentimentIcons];
          return (
            <Card key={feedback.id} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 border-2 border-border flex items-center justify-center shrink-0 ${sentimentStyles[feedback.sentiment as keyof typeof sentimentStyles]}`}>
                    <SentimentIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{feedback.id}</span>
                          <Badge className={statusStyles[feedback.status as keyof typeof statusStyles]}>
                            {feedback.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[feedback.category as keyof typeof categoryLabels]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{feedback.title}</h3>
                        <p className="text-muted-foreground mt-1">{feedback.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                      <span><strong className="text-foreground">Project:</strong> {feedback.project}</span>
                      <span><strong className="text-foreground">From:</strong> {feedback.from}</span>
                      <span><strong className="text-foreground">Source:</strong> {feedback.source}</span>
                      <span>{feedback.created}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
