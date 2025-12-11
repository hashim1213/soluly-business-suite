import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Link,
  ExternalLink,
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
  ticket: "bg-red-100 text-red-800 border-red-200",
  feature_request: "bg-purple-100 text-purple-800 border-purple-200",
  customer_quote: "bg-blue-100 text-blue-800 border-blue-200",
  feedback: "bg-green-100 text-green-800 border-green-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No email selected</h3>
        <p className="text-sm text-muted-foreground">
          Select an email from the list to view details.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">Email not found</h3>
        <p className="text-sm text-muted-foreground">
          The selected email could not be loaded.
        </p>
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {email.display_id && (
                <span className="text-sm font-mono text-muted-foreground">
                  {email.display_id}
                </span>
              )}
              {email.status === "pending" && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              {email.status === "processed" && email.review_status === "pending" && (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Review
                </Badge>
              )}
              {email.status === "processed" && email.review_status === "approved" && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {email.status === "processed" && email.review_status === "dismissed" && (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Dismissed
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(email.received_at), "MMM d, yyyy h:mm a")}
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-2">{email.subject}</h2>
          <div className="text-sm text-muted-foreground">
            From: <span className="font-medium text-foreground">{email.sender_name || email.sender_email}</span>
            {email.sender_name && <span> ({email.sender_email})</span>}
          </div>
          {email.email_account && (
            <div className="text-sm text-muted-foreground mt-1">
              Via: {email.email_account.display_name}
            </div>
          )}
        </div>

        <Separator />

        {/* AI Categorization */}
        {email.status === "processed" && (
          <div className="space-y-4">
            <h3 className="font-medium">AI Analysis</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={email.category || ""}
                  onValueChange={(value) =>
                    updateCategory.mutate({ id: email.id, category: value as EmailCategory })
                  }
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {email.ai_confidence && (
                <div className="space-y-2">
                  <Label>Confidence</Label>
                  <div className="h-10 flex items-center">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${email.ai_confidence * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      {Math.round(email.ai_confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            {email.ai_summary && (
              <div className="space-y-2">
                <Label>Summary</Label>
                <p className="text-sm bg-muted p-3 rounded-lg">{email.ai_summary}</p>
              </div>
            )}
            {email.ai_suggested_title && (
              <div className="space-y-2">
                <Label>Suggested Title</Label>
                <p className="text-sm font-medium">{email.ai_suggested_title}</p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Project Link */}
        <div className="space-y-3">
          <Label>Link to Project</Label>
          <Select
            value={email.linked_project_id || "none"}
            onValueChange={(value) =>
              linkToProject.mutate({ emailId: email.id, projectId: value === "none" ? null : value })
            }
          >
            <SelectTrigger className="border-2">
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

        {/* Linked Record */}
        {linkedRecord && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>Linked Record</Label>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">{linkedRecord.title}</div>
                  <div className="text-sm text-muted-foreground">{linkedRecord.display_id}</div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!linkedRecord && email.review_status !== "dismissed" && (
            <Button onClick={handleOpenCreateDialog} className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              Create Record
            </Button>
          )}
          {email.review_status === "pending" && (
            <Button
              variant="outline"
              onClick={() => dismissEmail.mutate(email.id)}
              disabled={dismissEmail.isPending}
              className="border-2"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => reprocess.mutate(email.id)}
            disabled={reprocess.isPending}
            className="border-2"
          >
            {reprocess.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-process
          </Button>
        </div>

        <Separator />

        {/* Email Body */}
        <div className="space-y-3">
          <Label>Email Content</Label>
          <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {email.body}
          </div>
        </div>
      </div>

      {/* Create Record Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="border-2">
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
                <SelectTrigger className="border-2">
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
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={createPriority} onValueChange={(v) => setCreatePriority(v as any)}>
                <SelectTrigger className="border-2">
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
                <SelectTrigger className="border-2">
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
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button
              onClick={handleCreateRecord}
              disabled={createRecord.isPending || !createTitle}
              className="border-2"
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
