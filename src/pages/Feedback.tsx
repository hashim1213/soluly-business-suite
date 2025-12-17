import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Plus, MessageSquare, ThumbsUp, ThumbsDown, Meh, Mail, Phone, HeadphonesIcon, Edit, Trash2, Loader2, Ticket, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useFeedback, useCreateFeedback, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useFeedback";
import { useTickets, useDeleteTicket } from "@/hooks/useTickets";
import { useProjects } from "@/hooks/useProjects";
import { Database } from "@/integrations/supabase/types";
import { feedbackStatusStyles, feedbackSentimentStyles, ticketStatusStyles } from "@/lib/styles";

type FeedbackSentiment = Database["public"]["Enums"]["feedback_sentiment"];
type FeedbackCategory = Database["public"]["Enums"]["feedback_category"];
type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];
type FeedbackSource = Database["public"]["Enums"]["feedback_source"];

const sentimentIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Meh,
};

const sourceIcons = {
  email: Mail,
  call: Phone,
  support: HeadphonesIcon,
  ticket: Ticket,
};

// Combined status colors for feedback and tickets
const statusColors: Record<string, string> = {
  ...feedbackStatusStyles,
  ...ticketStatusStyles,
};

const categoryLabels: Record<string, string> = {
  performance: "Performance",
  "ui-ux": "UI/UX",
  feature: "Feature",
  mobile: "Mobile",
  bug: "Bug",
  general: "General",
  feedback: "Feedback",
};

// Unified type for both feedback and tickets
type UnifiedFeedback = {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  sentiment: string;
  category: string;
  source: "feedback" | "ticket";
  sourceType: string;
  status: string;
  from_contact: string | null;
  project_name: string | null;
  project_id: string | null;
  notes: string | null;
  created_at: string;
};

export default function Feedback() {
  const { navigateOrg } = useOrgNavigation();
  const { data: feedbackItems, isLoading: feedbackLoading, error } = useFeedback();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: projects } = useProjects();
  const createFeedback = useCreateFeedback();
  const updateFeedback = useUpdateFeedback();
  const deleteFeedback = useDeleteFeedback();
  const deleteTicket = useDeleteTicket();

  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const isLoading = feedbackLoading || ticketsLoading;

  // Get feedback tickets
  const feedbackTickets = useMemo(() => {
    return tickets?.filter(t => t.category === "feedback") || [];
  }, [tickets]);

  // Unify feedback and tickets into single list
  const unifiedFeedback: UnifiedFeedback[] = useMemo(() => {
    const items: UnifiedFeedback[] = [];

    // Add feedback items
    feedbackItems?.forEach((feedback) => {
      items.push({
        id: feedback.id,
        display_id: feedback.display_id,
        title: feedback.title,
        description: feedback.description,
        sentiment: feedback.sentiment,
        category: feedback.category,
        source: "feedback",
        sourceType: feedback.source,
        status: feedback.status,
        from_contact: feedback.from_contact,
        project_name: feedback.project?.name || feedback.project_name,
        project_id: feedback.project_id,
        notes: feedback.notes,
        created_at: feedback.created_at,
      });
    });

    // Add tickets with category="feedback"
    feedbackTickets.forEach((ticket) => {
      items.push({
        id: ticket.id,
        display_id: ticket.display_id,
        title: ticket.title,
        description: ticket.description,
        sentiment: ticket.priority === "high" ? "negative" : ticket.priority === "low" ? "positive" : "neutral",
        category: "feedback",
        source: "ticket",
        sourceType: "ticket",
        status: ticket.status,
        from_contact: null,
        project_name: ticket.project?.name || null,
        project_id: ticket.project_id,
        notes: null,
        created_at: ticket.created_at,
      });
    });

    // Sort by created_at descending
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [feedbackItems, feedbackTickets]);

  // Filter based on tab
  const filteredFeedback = useMemo(() => {
    if (activeTab === "all") return unifiedFeedback;
    if (activeTab === "feedback") return unifiedFeedback.filter(f => f.source === "feedback");
    if (activeTab === "tickets") return unifiedFeedback.filter(f => f.source === "ticket");
    return unifiedFeedback;
  }, [unifiedFeedback, activeTab]);

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

  const handleUpdateStatus = (feedback: UnifiedFeedback, newStatus: FeedbackStatus) => {
    if (feedback.source === "feedback") {
      updateFeedback.mutate({ id: feedback.id, status: newStatus });
    }
  };

  const handleDelete = (feedback: UnifiedFeedback) => {
    if (feedback.source === "feedback") {
      deleteFeedback.mutate(feedback.id);
    } else {
      deleteTicket.mutate(feedback.id);
    }
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

  const feedbackCount = feedbackItems?.length || 0;
  const ticketCount = feedbackTickets.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Customer Feedback</h1>
          <p className="text-sm text-muted-foreground">Track and manage customer feedback</p>
        </div>
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log Feedback</span>
              <span className="sm:hidden">Log</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="border-b-2 border-border pb-4 mb-4">
              <SheetTitle>Log Customer Feedback</SheetTitle>
            </SheetHeader>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <TabsList className="border-2 border-border p-1 inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              All ({unifiedFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Feedback</span> ({feedbackCount})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">From Tickets</span> ({ticketCount})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {filteredFeedback.length === 0 ? (
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
          {filteredFeedback.map((feedback) => {
            const SentimentIcon = sentimentIcons[feedback.sentiment as keyof typeof sentimentIcons] || Meh;
            const SourceIcon = sourceIcons[feedback.sourceType as keyof typeof sourceIcons] || Mail;
            return (
              <Card
                key={`${feedback.source}-${feedback.id}`}
                className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (feedback.source === "ticket") {
                    navigateOrg(`/tickets/${feedback.display_id}`);
                  } else {
                    navigateOrg(`/feedback/${feedback.display_id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${feedbackSentimentStyles[feedback.sentiment as keyof typeof feedbackSentimentStyles] || "bg-slate-400 text-black"}`}>
                        <SentimentIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{feedback.display_id}</span>
                          {feedback.source === "ticket" && (
                            <Badge variant="outline" className="border-2 text-xs">
                              <Ticket className="h-3 w-3 mr-1" />
                              Ticket
                            </Badge>
                          )}
                          <Badge className={statusColors[feedback.status] || statusColors.acknowledged}>
                            {feedback.status.replace("-", " ")}
                          </Badge>
                          <Badge variant="outline" className="border-2">
                            {categoryLabels[feedback.category] || feedback.category}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{feedback.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{feedback.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <SourceIcon className="h-4 w-4" />
                            {feedback.from_contact || "Unknown"}
                          </span>
                          {feedback.project_name && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {feedback.project_name}
                            </span>
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
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {feedback.source === "feedback" && (
                        <Select
                          value={feedback.status}
                          onValueChange={(value: FeedbackStatus) => handleUpdateStatus(feedback, value)}
                        >
                          <SelectTrigger className="w-[100px] sm:w-[140px] border-2">
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
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDelete(feedback)}
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
