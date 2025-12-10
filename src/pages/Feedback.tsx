import { useState } from "react";
import { Plus, MessageSquare, ThumbsUp, ThumbsDown, Meh, Mail, Phone, HeadphonesIcon, Edit, Trash2, Loader2 } from "lucide-react";
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
import { useFeedback, useCreateFeedback, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useFeedback";
import { useProjects } from "@/hooks/useProjects";
import { Database } from "@/integrations/supabase/types";

type FeedbackSentiment = Database["public"]["Enums"]["feedback_sentiment"];
type FeedbackCategory = Database["public"]["Enums"]["feedback_category"];
type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];
type FeedbackSource = Database["public"]["Enums"]["feedback_source"];

const sentimentIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Meh,
};

const sentimentColors: Record<FeedbackSentiment, string> = {
  positive: "bg-chart-2 text-background",
  negative: "bg-destructive text-destructive-foreground",
  neutral: "bg-chart-4 text-foreground",
};

const sourceIcons = {
  email: Mail,
  call: Phone,
  support: HeadphonesIcon,
};

const statusColors: Record<FeedbackStatus, string> = {
  "acknowledged": "bg-secondary text-secondary-foreground",
  "under-review": "bg-chart-4 text-foreground",
  "investigating": "bg-chart-1 text-background",
  "in-progress": "bg-chart-2 text-background",
  "resolved": "bg-primary text-primary-foreground",
};

const categoryLabels: Record<FeedbackCategory, string> = {
  performance: "Performance",
  "ui-ux": "UI/UX",
  feature: "Feature",
  mobile: "Mobile",
  bug: "Bug",
  general: "General",
};

export default function Feedback() {
  const { data: feedbackItems, isLoading, error } = useFeedback();
  const { data: projects } = useProjects();
  const createFeedback = useCreateFeedback();
  const updateFeedback = useUpdateFeedback();
  const deleteFeedback = useDeleteFeedback();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<typeof feedbackItems extends (infer T)[] ? T : never | null>(null);
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    description: "",
    project_id: "",
    project_name: "",
    sentiment: "neutral" as FeedbackSentiment,
    category: "general" as FeedbackCategory,
    source: "email" as FeedbackSource,
    from_contact: "",
    notes: "",
  });

  const handleCreateFeedback = async () => {
    if (!newFeedback.title) {
      toast.error("Please enter a title");
      return;
    }

    const selectedProject = projects?.find(p => p.id === newFeedback.project_id);

    try {
      await createFeedback.mutateAsync({
        title: newFeedback.title,
        description: newFeedback.description || null,
        project_id: newFeedback.project_id || null,
        project_name: selectedProject?.name || null,
        sentiment: newFeedback.sentiment,
        category: newFeedback.category,
        source: newFeedback.source,
        from_contact: newFeedback.from_contact || null,
        notes: newFeedback.notes || null,
      });

      setNewFeedback({
        title: "",
        description: "",
        project_id: "",
        project_name: "",
        sentiment: "neutral",
        category: "general",
        source: "email",
        from_contact: "",
        notes: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateStatus = (id: string, newStatus: FeedbackStatus) => {
    updateFeedback.mutate({ id, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load feedback</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Feedback</h1>
          <p className="text-muted-foreground">Track and manage customer feedback</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              Log Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Log Customer Feedback</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                  placeholder="Detailed feedback..."
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Project</Label>
                  <Select value={newFeedback.project_id} onValueChange={(value) => setNewFeedback({ ...newFeedback, project_id: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Sentiment</Label>
                  <Select value={newFeedback.sentiment} onValueChange={(value: FeedbackSentiment) => setNewFeedback({ ...newFeedback, sentiment: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
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
                  <Label>Category</Label>
                  <Select value={newFeedback.category} onValueChange={(value: FeedbackCategory) => setNewFeedback({ ...newFeedback, category: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="ui-ux">UI/UX</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Source</Label>
                  <Select value={newFeedback.source} onValueChange={(value: FeedbackSource) => setNewFeedback({ ...newFeedback, source: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from">From (email/contact)</Label>
                <Input
                  id="from"
                  placeholder="customer@example.com"
                  value={newFeedback.from_contact}
                  onChange={(e) => setNewFeedback({ ...newFeedback, from_contact: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes for internal use..."
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
              <Button onClick={handleCreateFeedback} className="border-2" disabled={createFeedback.isPending}>
                {createFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Log Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {feedbackItems?.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No feedback logged yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log your first feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedbackItems?.map((feedback) => {
            const SentimentIcon = sentimentIcons[feedback.sentiment];
            const SourceIcon = sourceIcons[feedback.source];
            return (
              <Card key={feedback.id} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${sentimentColors[feedback.sentiment]}`}>
                        <SentimentIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{feedback.display_id}</span>
                          <Badge className={statusColors[feedback.status]}>
                            {feedback.status.replace("-", " ")}
                          </Badge>
                          <Badge variant="outline" className="border-2">
                            {categoryLabels[feedback.category]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{feedback.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <SourceIcon className="h-4 w-4" />
                            {feedback.from_contact || "Unknown"}
                          </span>
                          {feedback.project_name && (
                            <span>{feedback.project_name}</span>
                          )}
                          <span>{formatDate(feedback.created_at)}</span>
                        </div>
                        {feedback.notes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            <span className="font-medium">Notes:</span> {feedback.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={feedback.status}
                        onValueChange={(value: FeedbackStatus) => handleUpdateStatus(feedback.id, value)}
                      >
                        <SelectTrigger className="w-[140px] border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2">
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                          <SelectItem value="under-review">Under Review</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteFeedback.mutate(feedback.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
