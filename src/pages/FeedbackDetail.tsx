import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { ArrowLeft, ThumbsUp, ThumbsDown, Meh, Mail, Phone, HeadphonesIcon, Building, Calendar, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useFeedbackByDisplayId, useUpdateFeedback, useDeleteFeedback } from "@/hooks/useFeedback";
import { Database } from "@/integrations/supabase/types";

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

export default function FeedbackDetail() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const { navigateOrg } = useOrgNavigation();
  const { data: feedback, isLoading, error } = useFeedbackByDisplayId(feedbackId);
  const updateFeedback = useUpdateFeedback();
  const deleteFeedback = useDeleteFeedback();

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (feedback) {
      updateFeedback.mutate({ id: feedback.id, status: newStatus });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigateOrg("/tickets/feedback")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{feedback.display_id}</span>
              <Badge className={statusColors[feedback.status] || statusColors.acknowledged}>
                {feedback.status.replace("-", " ")}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{feedback.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={feedback.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] border-2">
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
    </div>
  );
}
