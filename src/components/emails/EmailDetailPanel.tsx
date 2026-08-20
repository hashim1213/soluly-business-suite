import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useEmail,
  useUpdateEmailCategory,
  useLinkEmailToProject,
  useDismissEmail,
  useCreateRecordFromEmail,
} from "@/hooks/useEmails";
import { useReprocessEmail } from "@/hooks/useEmailSync";
import { useProjects } from "@/hooks/useProjects";
import { Database } from "@/integrations/supabase/types";

type EmailCategory = Database["public"]["Enums"]["email_category"];

interface EmailDetailPanelProps {
  emailId: string | null;
}

const categoryLabels: Record<EmailCategory, string> = {
  ticket: "Ticket",
  feature_request: "Feature Request",
  customer_quote: "Customer Quote",
  feedback: "Feedback",
  other: "Other",
};

const categoryColors: Record<EmailCategory, string> = {
  ticket: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  feature_request: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
  customer_quote: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  feedback: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  other: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300",
};

export function EmailDetailPanel({ emailId }: EmailDetailPanelProps) {
  const { data: email, isLoading } = useEmail(emailId);
  const { data: projects } = useProjects();
  const updateCategory = useUpdateEmailCategory();
  const linkToProject = useLinkEmailToProject();
  const dismissEmail = useDismissEmail();
  const createRecord = useCreateRecordFromEmail();
  const reprocess = useReprocessEmail();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<"ticket" | "feature_request" | "customer_quote" | "feedback">("ticket");
  const [createTitle, setCreateTitle] = useState("");
  const [createPriority, setCreatePriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [createProjectId, setCreateProjectId] = useState<string>("");

  if (!emailId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Mail className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Select an email to read</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Email not found</p>
      </div>
    );
  }

  const handleOpenCreateDialog = () => {
    setCreateCategory(email.category === "other" || !email.category ? "ticket" : email.category as any);
    setCreateTitle(email.ai_suggested_title || email.subject);
    setCreatePriority("medium");
    setCreateProjectId(email.linked_project_id || "");
    setIsCreateDialogOpen(true);
  };

  const handleCreateRecord = async () => {
    await createRecord.mutateAsync({
      emailId: email.id,
      category: createCategory,
      title: createTitle,
      priority: createPriority,
      projectId: createProjectId || undefined,
    });
    setIsCreateDialogOpen(false);
  };

  const linkedRecord =
    email.linked_ticket ||
    email.linked_feature_request ||
    email.linked_quote ||
    email.linked_feedback;

  const statusBadge = () => {
    if (email.status === "pending") {
      return (
        <Badge variant="secondary" className="text-[11px] h-5 gap-1">
          <Clock className="h-3 w-3" />
          Unprocessed
        </Badge>
      );
    }
    if (email.review_status === "pending") {
      return (
        <Badge variant="outline" className="text-[11px] h-5 gap-1 border-orange-300 text-orange-700 dark:text-orange-300">
          <AlertCircle className="h-3 w-3" />
          Needs Review
        </Badge>
      );
    }
    if (email.review_status === "approved") {
      return (
        <Badge className="text-[11px] h-5 gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    if (email.review_status === "dismissed") {
      return (
        <Badge variant="secondary" className="text-[11px] h-5 gap-1">
          <XCircle className="h-3 w-3" />
          Dismissed
        </Badge>
      );
    }
    return null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
        {/* Email header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge()}
            {email.category && (
              <Badge variant="outline" className={cn("text-[11px] h-5", categoryColors[email.category])}>
                {categoryLabels[email.category]}
              </Badge>
            )}
            {email.ai_confidence && email.ai_confidence > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {Math.round(email.ai_confidence * 100)}% confidence
              </span>
            )}
          </div>

          <h1 className="text-xl font-semibold leading-tight">{email.subject}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(email.sender_name || email.sender_email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {email.sender_name || email.sender_email}
                </div>
                {email.sender_name && (
                  <div className="text-xs text-muted-foreground truncate">{email.sender_email}</div>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">
              {format(new Date(email.received_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>

        {/* AI Summary card */}
        {email.status === "processed" && email.ai_summary && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              AI Summary
            </div>
            <p className="text-sm leading-relaxed">{email.ai_summary}</p>
            {email.ai_suggested_title && (
              <p className="text-xs text-muted-foreground">
                Suggested: <span className="font-medium text-foreground">{email.ai_suggested_title}</span>
              </p>
            )}
          </div>
        )}

        {/* Email body */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 min-h-[200px]">
          {email.body}
        </div>

        {/* Bottom action bar */}
        <div className="border-t pt-4 space-y-4">
          {/* Category + Project */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={email.category || ""}
              onValueChange={(value) =>
                updateCategory.mutate({ id: email.id, category: value as EmailCategory })
              }
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={email.linked_project_id || "none"}
              onValueChange={(value) =>
                linkToProject.mutate({ emailId: email.id, projectId: value === "none" ? null : value })
              }
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Link to project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.display_id} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {!linkedRecord && email.review_status !== "dismissed" && (
              <Button onClick={handleOpenCreateDialog} size="sm" variant="default" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Record
              </Button>
            )}
            {email.review_status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissEmail.mutate(email.id)}
                disabled={dismissEmail.isPending}
                className="h-8 text-xs"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Dismiss
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reprocess.mutate(email.id)}
              disabled={reprocess.isPending}
              className="h-8 text-xs"
            >
              {reprocess.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
              )}
              Re-process
            </Button>
          </div>

          {/* Linked record */}
          {linkedRecord && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{linkedRecord.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{linkedRecord.display_id}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Record Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Record from Email</DialogTitle>
            <DialogDescription>
              Create a ticket, feature request, quote, or feedback from this email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select value={createCategory} onValueChange={(v) => setCreateCategory(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="customer_quote">Customer Quote</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={createPriority} onValueChange={(v) => setCreatePriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={createProjectId || "none"} onValueChange={(v) => setCreateProjectId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.display_id} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRecord}
              disabled={createRecord.isPending || !createTitle}
            >
              {createRecord.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
