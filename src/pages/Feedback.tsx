import { useState } from "react";
import { Plus, MessageSquare, ThumbsUp, ThumbsDown, Meh, ArrowLeft, Mail, Phone, HeadphonesIcon, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const initialFeedbackItems = [
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
    notes: "Engineering team is looking into database query optimization.",
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
    notes: "Thanked customer and shared with design team.",
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
    notes: "Added to feature backlog for Q1 2025.",
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
    notes: "",
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
    notes: "Bug confirmed. Fix scheduled for next release.",
  },
];

const projectOptions = [
  "Acme Corp",
  "TechStart Inc",
  "Global Solutions",
  "DataFlow Ltd",
  "CloudNine Systems",
  "InnovateTech",
];

const sentimentIcons = {
  positive: ThumbsUp,
  neutral: Meh,
  negative: ThumbsDown,
};

const sourceIcons = {
  email: Mail,
  call: Phone,
  support: HeadphonesIcon,
};

const sentimentStyles = {
  positive: "bg-chart-2 text-background",
  neutral: "bg-chart-4 text-foreground",
  negative: "bg-destructive text-destructive-foreground",
};

const statusStyles: Record<string, string> = {
  acknowledged: "bg-muted text-muted-foreground",
  "under-review": "bg-chart-4 text-foreground",
  investigating: "bg-chart-1 text-background",
  "in-progress": "bg-chart-2 text-background",
  resolved: "bg-primary text-primary-foreground",
};

const categoryLabels: Record<string, string> = {
  performance: "Performance",
  "ui-ux": "UI/UX",
  feature: "Feature",
  mobile: "Mobile",
  bug: "Bug Report",
  general: "General",
};

export default function Feedback() {
  const [feedbackItems, setFeedbackItems] = useState(initialFeedbackItems);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof initialFeedbackItems[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    description: "",
    project: "",
    sentiment: "",
    category: "",
    source: "",
    from: "",
    notes: "",
  });

  const positiveCount = feedbackItems.filter(f => f.sentiment === 'positive').length;
  const neutralCount = feedbackItems.filter(f => f.sentiment === 'neutral').length;
  const negativeCount = feedbackItems.filter(f => f.sentiment === 'negative').length;

  const handleCreateFeedback = () => {
    if (!newFeedback.title || !newFeedback.project || !newFeedback.sentiment) {
      toast.error("Please fill in all required fields");
      return;
    }

    const feedbackId = `FBK-${String(feedbackItems.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const feedback = {
      id: feedbackId,
      title: newFeedback.title,
      description: newFeedback.description,
      project: newFeedback.project,
      sentiment: newFeedback.sentiment,
      category: newFeedback.category || "general",
      status: "acknowledged",
      source: newFeedback.source || "email",
      from: newFeedback.from || "Unknown",
      created: today,
      notes: newFeedback.notes,
    };

    setFeedbackItems([feedback, ...feedbackItems]);
    setNewFeedback({
      title: "",
      description: "",
      project: "",
      sentiment: "",
      category: "",
      source: "",
      from: "",
      notes: "",
    });
    setIsDialogOpen(false);
    toast.success("Feedback logged successfully");
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setFeedbackItems(feedbackItems.map(f =>
      f.id === id ? { ...f, status: newStatus } : f
    ));
    if (selectedFeedback?.id === id) {
      setSelectedFeedback({ ...selectedFeedback, status: newStatus });
    }
    toast.success("Status updated");
  };

  const handleUpdateNotes = () => {
    if (!selectedFeedback) return;
    setFeedbackItems(feedbackItems.map(f =>
      f.id === selectedFeedback.id ? { ...f, notes: selectedFeedback.notes } : f
    ));
    setIsEditDialogOpen(false);
    toast.success("Notes updated");
  };

  const handleDeleteFeedback = (id: string) => {
    setFeedbackItems(feedbackItems.filter(f => f.id !== id));
    setSelectedFeedback(null);
    toast.success("Feedback deleted");
  };

  // Detail view
  if (selectedFeedback) {
    const SentimentIcon = sentimentIcons[selectedFeedback.sentiment as keyof typeof sentimentIcons];
    const SourceIcon = sourceIcons[selectedFeedback.source as keyof typeof sourceIcons] || Mail;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedFeedback(null)}
            className="border-2 border-transparent hover:border-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 border-2 border-border flex items-center justify-center shrink-0 ${sentimentStyles[selectedFeedback.sentiment as keyof typeof sentimentStyles]}`}>
              <SentimentIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-sm text-muted-foreground">{selectedFeedback.id}</span>
                <Badge className={statusStyles[selectedFeedback.status]}>
                  {selectedFeedback.status.replace('-', ' ')}
                </Badge>
                <Badge variant="outline">
                  {categoryLabels[selectedFeedback.category]}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{selectedFeedback.title}</h1>
              <p className="text-muted-foreground mt-1">From {selectedFeedback.project}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleDeleteFeedback(selectedFeedback.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Feedback Details</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedFeedback.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Internal Notes</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-2 border-transparent hover:border-border"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                {selectedFeedback.notes ? (
                  <p className="text-muted-foreground">{selectedFeedback.notes}</p>
                ) : (
                  <p className="text-muted-foreground italic">No notes added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["acknowledged", "under-review", "investigating", "in-progress", "resolved"].map(status => (
                    <Button
                      key={status}
                      variant={selectedFeedback.status === status ? "default" : "outline"}
                      size="sm"
                      className="border-2"
                      onClick={() => handleUpdateStatus(selectedFeedback.id, status)}
                    >
                      {status.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                      <SourceIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedFeedback.from}</div>
                      <div className="text-sm text-muted-foreground capitalize">via {selectedFeedback.source}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-medium">{selectedFeedback.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{categoryLabels[selectedFeedback.category]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sentiment</span>
                    <span className="font-medium capitalize">{selectedFeedback.sentiment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received</span>
                    <span className="font-medium">{selectedFeedback.created}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Notes Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="border-2">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Edit Notes</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Add internal notes about this feedback..."
                value={selectedFeedback.notes}
                onChange={(e) => setSelectedFeedback({ ...selectedFeedback, notes: e.target.value })}
                className="border-2 min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateNotes} className="border-2">
                Save Notes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Feedback</h1>
          <p className="text-muted-foreground">Track feedback on features and general platform experience</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Log Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Log New Feedback</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the feedback"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed feedback content"
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={newFeedback.project}
                    onValueChange={(value) => setNewFeedback({ ...newFeedback, project: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {projectOptions.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sentiment">Sentiment *</Label>
                  <Select
                    value={newFeedback.sentiment}
                    onValueChange={(value) => setNewFeedback({ ...newFeedback, sentiment: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select sentiment" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newFeedback.category}
                    onValueChange={(value) => setNewFeedback({ ...newFeedback, category: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="ui-ux">UI/UX</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newFeedback.source}
                    onValueChange={(value) => setNewFeedback({ ...newFeedback, source: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="support">Support Ticket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from">From (Contact)</Label>
                <Input
                  id="from"
                  placeholder="customer@example.com"
                  value={newFeedback.from}
                  onChange={(e) => setNewFeedback({ ...newFeedback, from: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any internal notes about this feedback..."
                  value={newFeedback.notes}
                  onChange={(e) => setNewFeedback({ ...newFeedback, notes: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateFeedback} className="border-2">
                Log Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <Card
              key={feedback.id}
              className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedFeedback(feedback)}
            >
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
                          <Badge className={statusStyles[feedback.status]}>
                            {feedback.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[feedback.category]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{feedback.title}</h3>
                        <p className="text-muted-foreground mt-1 line-clamp-2">{feedback.description}</p>
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
