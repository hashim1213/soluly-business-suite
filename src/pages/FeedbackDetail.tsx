import { useState } from "react";
import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { ArrowLeft, ThumbsUp, ThumbsDown, Meh, Mail, Phone, HeadphonesIcon, Building, Calendar, Loader2, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeedbackByDisplayId, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useFeedback";
import { useProjects } from "@/hooks/useProjects";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];

const sentimentIcons = {
  positive: ThumbsUp,
  negative: ThumbsDown,
  neutral: Meh,
};

const sentimentColors: Record<string, string> = {
  positive: "bg-chart-2 text-background",
  negative: "bg-destructive text-destructive-foreground",
  neutral: "bg-chart-4 text-foreground",
};

const sentimentLabels: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

const sourceIcons = {
  email: Mail,
  call: Phone,
  support: HeadphonesIcon,
};

const sourceLabels: Record<string, string> = {
  email: "Email",
  call: "Phone Call",
  support: "Support Ticket",
};

const statusColors: Record<string, string> = {
  acknowledged: "bg-secondary text-secondary-foreground",
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
  bug: "Bug",
  general: "General",
};

type FeedbackSentiment = Database["public"]["Enums"]["feedback_sentiment"];
type FeedbackSource = Database["public"]["Enums"]["feedback_source"];
type FeedbackCategory = Database["public"]["Enums"]["feedback_category"];

interface EditData {
  title: string;
  description: string;
  notes: string;
  status: FeedbackStatus;
  sentiment: FeedbackSentiment;
  source: FeedbackSource;
  category: FeedbackCategory;
  from_contact: string;
  project_id: string | null;
}

export default function FeedbackDetail() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const { navigateOrg } = useOrgNavigation();
  const { data: feedback, isLoading, error } = useFeedbackByDisplayId(feedbackId);
  const { data: projects } = useProjects();
  const updateFeedback = useUpdateFeedback();
  const deleteFeedback = useDeleteFeedback();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (feedback) {
      updateFeedback.mutate({ id: feedback.id, status: newStatus });
    }
  };

  const handleStartEdit = () => {
    if (!feedback) return;
    setEditData({
      title: feedback.title,
      description: feedback.description || "",
      notes: feedback.notes || "",
      status: feedback.status as FeedbackStatus,
      sentiment: feedback.sentiment as FeedbackSentiment,
      source: feedback.source as FeedbackSource,
      category: feedback.category as FeedbackCategory,
      from_contact: feedback.from_contact || "",
      project_id: feedback.project_id,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!feedback || !editData) return;
    try {
      await updateFeedback.mutateAsync({
        id: feedback.id,
        title: editData.title,
        description: editData.description || null,
        notes: editData.notes || null,
        status: editData.status,
        sentiment: editData.sentiment,
        source: editData.source,
        category: editData.category,
        from_contact: editData.from_contact || null,
        project_id: editData.project_id,
      });
      toast.success("Feedback updated successfully");
      setIsEditing(false);
      setEditData(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = () => {
    if (feedback) {
      deleteFeedback.mutate(feedback.id, {
        onSuccess: () => {
          navigateOrg("/tickets/feedback");
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets/feedback")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Button>
        <Card className="border-2 border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Feedback not found</p>
            <Button variant="outline" onClick={() => navigateOrg("/tickets/feedback")}>
              Return to Feedback List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SentimentIcon = sentimentIcons[feedback.sentiment as keyof typeof sentimentIcons] || Meh;
  const SourceIcon = sourceIcons[feedback.source as keyof typeof sourceIcons] || Mail;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={() => navigateOrg("/tickets/feedback")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{feedback.display_id}</span>
              <Badge className={statusColors[feedback.status] || statusColors.acknowledged}>
                {feedback.status.replace("-", " ")}
              </Badge>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight mt-1 truncate">{feedback.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" className="border-2" onClick={handleStartEdit}>
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Select value={feedback.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px] sm:w-[160px] border-2">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="border-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-2">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this feedback? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {feedback.description ? (
                <p className="text-foreground whitespace-pre-wrap">{feedback.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {feedback.notes && (
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="text-lg font-bold uppercase tracking-wider">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-foreground whitespace-pre-wrap">{feedback.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <CommentsSection entityType="feedback" entityId={feedback.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sentiment */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${sentimentColors[feedback.sentiment] || sentimentColors.neutral}`}>
                  <SentimentIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{sentimentLabels[feedback.sentiment] || feedback.sentiment}</p>
                  <p className="text-sm text-muted-foreground">Customer sentiment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="outline" className="mt-1 border-2">
                  {categoryLabels[feedback.category] || feedback.category}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <div className="flex items-center gap-2 mt-1">
                  <SourceIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{sourceLabels[feedback.source] || feedback.source}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="mt-1 font-medium">{feedback.from_contact || "Unknown"}</p>
              </div>

              {feedback.project_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{feedback.project_name}</span>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(feedback.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Feedback Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="border-2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Feedback</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="border-2"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Internal Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="border-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as FeedbackStatus })}>
                    <SelectTrigger className="border-2">
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
                </div>
                <div className="grid gap-2">
                  <Label>Sentiment</Label>
                  <Select value={editData.sentiment} onValueChange={(v) => setEditData({ ...editData, sentiment: v as FeedbackSentiment })}>
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
                  <Select value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v as FeedbackCategory })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="ui-ux">UI/UX</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Source</Label>
                  <Select value={editData.source} onValueChange={(v) => setEditData({ ...editData, source: v as FeedbackSource })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="support">Support Ticket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-from">From Contact</Label>
                  <Input
                    id="edit-from"
                    value={editData.from_contact}
                    onChange={(e) => setEditData({ ...editData, from_contact: e.target.value })}
                    className="border-2"
                    placeholder="Contact name or email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Project</Label>
                  <Select
                    value={editData.project_id || "none"}
                    onValueChange={(v) => setEditData({ ...editData, project_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="none">No project</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="border-2">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="border-2" disabled={updateFeedback.isPending}>
              {updateFeedback.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
