import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useState } from "react";
import { ArrowLeft, Edit, Lightbulb, FileText, MessageSquare, MoreVertical, Clock, Loader2, Save, X, FolderOpen, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTicketByDisplayId, useUpdateTicket, useDeleteTicket } from "@/hooks/useTickets";
import { useProjects } from "@/hooks/useProjects";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { formatDistanceToNow } from "date-fns";
import { ticketStatusStyles, ticketPriorityStyles } from "@/lib/styles";

const categoryIcons = {
  feature: Lightbulb,
  quote: FileText,
  feedback: MessageSquare,
  uncategorized: Tag,
};

const categoryLabels: Record<string, string> = {
  feature: "Feature Request",
  quote: "Customer Quote",
  feedback: "Feedback",
  uncategorized: "Uncategorized",
};

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { navigateOrg } = useOrgNavigation();
  const { data: ticket, isLoading, error } = useTicketByDisplayId(ticketId);
  const { data: projects } = useProjects();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    project_id: string | null;
  } | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        status: newStatus as "open" | "in-progress" | "pending" | "closed",
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        priority: newPriority as "low" | "medium" | "high",
      });
      toast.success(`Priority updated to ${newPriority}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartEdit = () => {
    if (!ticket) return;
    setEditData({
      title: ticket.title,
      description: ticket.description || "",
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      project_id: ticket.project_id,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!ticket || !editData) return;
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        title: editData.title,
        description: editData.description || null,
        status: editData.status as "open" | "in-progress" | "pending" | "closed",
        priority: editData.priority as "low" | "medium" | "high",
        category: editData.category as "uncategorized" | "feature" | "quote" | "feedback",
        project_id: editData.project_id,
      });
      toast.success("Ticket updated successfully");
      setIsEditing(false);
      setEditData(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteTicket.mutateAsync(ticket.id);
      toast.success("Ticket deleted");
      navigateOrg("/tickets");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Navigate to category-specific view
  const handleGoToCategoryView = () => {
    if (!ticket) return;
    switch (ticket.category) {
      case "quote":
        navigateOrg("/tickets/quotes");
        break;
      case "feature":
        navigateOrg("/tickets/features");
        break;
      case "feedback":
        navigateOrg("/tickets/feedback");
        break;
      default:
        navigateOrg("/tickets");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground">The ticket "{ticketId}" doesn't exist or was deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons] || Tag;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.display_id}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CategoryIcon className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{categoryLabels[ticket.category] || "Ticket"}</span>
            </div>
            <Badge className={ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles] || "bg-slate-400 text-black"}>
              {ticket.status}
            </Badge>
            <Badge className={ticketPriorityStyles[ticket.priority as keyof typeof ticketPriorityStyles] || "bg-slate-400 text-black"}>
              {ticket.priority}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{ticket.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-sm text-muted-foreground">
            {ticket.project && (
              <span
                className="hover:text-foreground cursor-pointer"
                onClick={() => navigateOrg(`/projects/${ticket.project?.display_id}`)}
              >
                Project: <strong className="text-foreground">{ticket.project.name}</strong>
              </span>
            )}
            {ticket.assignee && (
              <span>Assignee: <strong className="text-foreground">{ticket.assignee.name}</strong></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="border-2" onClick={handleStartEdit}>
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2">
              <DropdownMenuItem onClick={handleGoToCategoryView}>
                View in {categoryLabels[ticket.category] || "Category"} List
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                Delete Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="max-h-[500px] overflow-y-auto">
                <p className="whitespace-pre-wrap break-words text-sm">{ticket.description || "No description provided."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <CommentsSection entityType="ticket" entityId={ticket.id} />
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status</div>
                <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updateTicket.isPending}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-2">Priority</div>
                <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={updateTicket.isPending}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Category</div>
                <div className="flex items-center gap-2">
                  <CategoryIcon className="h-4 w-4" />
                  <span className="font-medium">{categoryLabels[ticket.category] || ticket.category}</span>
                </div>
              </div>

              {ticket.project && (
                <div className="border-t-2 border-border pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Project</div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={() => navigateOrg(`/projects/${ticket.project?.display_id}`)}
                    >
                      {ticket.project.name}
                    </span>
                  </div>
                </div>
              )}

              {ticket.assignee && (
                <div className="border-t-2 border-border pt-4">
                  <div className="text-sm text-muted-foreground mb-1">Assignee</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border-2 border-border">
                      <AvatarFallback className="bg-secondary text-xs">
                        {ticket.assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ticket.assignee.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="border-2 sm:max-w-[500px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Ticket</DialogTitle>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="quote">Customer Quote</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
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
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="border-2" disabled={updateTicket.isPending}>
              {updateTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
