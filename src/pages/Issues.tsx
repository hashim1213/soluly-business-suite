import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Plus, AlertCircle, Trash2, Loader2, Building, User, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket, TicketWithProject } from "@/hooks/useTickets";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Database } from "@/integrations/supabase/types";
import { ticketPriorityStyles, ticketStatusStyles } from "@/lib/styles";
import { formatDistanceToNow } from "date-fns";

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  pending: "Pending",
  closed: "Closed",
};

export default function Issues() {
  const { navigateOrg } = useOrgNavigation();
  const { data: tickets, isLoading, error } = useTickets();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [activeTab, setActiveTab] = useState<"all" | TicketStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    project_id: "",
    assignee_id: "",
  });

  // Filter tickets to only show issues
  const issues = useMemo(() => {
    return tickets?.filter(t => t.category === "issue") || [];
  }, [tickets]);

  // Apply search and status filters
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter by status tab
    if (activeTab !== "all") {
      result = result.filter(issue => issue.status === activeTab);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue =>
        issue.title.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.display_id.toLowerCase().includes(query) ||
        issue.project?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [issues, activeTab, searchQuery]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { all: issues.length, open: 0, "in-progress": 0, pending: 0, closed: 0 };
    issues.forEach(issue => {
      counts[issue.status]++;
    });
    return counts;
  }, [issues]);

  const handleCreateIssue = async () => {
    if (!newIssue.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await createTicket.mutateAsync({
        title: newIssue.title,
        description: newIssue.description || null,
        priority: newIssue.priority,
        category: "issue",
        project_id: newIssue.project_id === "none" ? null : newIssue.project_id || null,
        assignee_id: newIssue.assignee_id === "none" ? null : newIssue.assignee_id || null,
      });

      setNewIssue({
        title: "",
        description: "",
        priority: "medium",
        project_id: "",
        assignee_id: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateStatus = (issue: TicketWithProject, status: TicketStatus) => {
    updateTicket.mutate({ id: issue.id, status });
  };

  const handleDelete = (issueId: string) => {
    if (confirm("Are you sure you want to delete this issue?")) {
      deleteTicket.mutate(issueId);
    }
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
        <p className="text-destructive">Failed to load issues</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground">Track and resolve bugs, problems, and issues</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Issue</span>
              <span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Report New Issue</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  className="border-2"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={newIssue.priority} onValueChange={(value: TicketPriority) => setNewIssue({ ...newIssue, priority: value })}>
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
                <div className="grid gap-2">
                  <Label>Project</Label>
                  <Select value={newIssue.project_id} onValueChange={(value) => setNewIssue({ ...newIssue, project_id: value })}>
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
              <div className="grid gap-2">
                <Label>Assign To</Label>
                <Select value={newIssue.assignee_id} onValueChange={(value) => setNewIssue({ ...newIssue, assignee_id: value })}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers?.filter(m => m.status === "active").map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateIssue} className="border-2" disabled={createTicket.isPending}>
                {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Issue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-2"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <TabsList className="border-2 border-border p-1 inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="open" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Open ({statusCounts.open})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              In Progress ({statusCounts["in-progress"]})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="closed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
              Closed ({statusCounts.closed})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {filteredIssues.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No issues match your search" : "No issues yet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Report your first issue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateOrg(`/tickets/${issue.display_id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-destructive">
                      <AlertCircle className="h-5 w-5 text-destructive-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{issue.display_id}</span>
                        <Badge className={ticketPriorityStyles[issue.priority]}>
                          {issue.priority}
                        </Badge>
                        <Badge className={ticketStatusStyles[issue.status]}>
                          {statusLabels[issue.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{issue.title}</h3>
                      {issue.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {issue.project && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {issue.project.name}
                          </span>
                        )}
                        {issue.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {issue.assignee.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={issue.status}
                      onValueChange={(value: TicketStatus) => handleUpdateStatus(issue, value)}
                    >
                      <SelectTrigger className="w-[90px] sm:w-[130px] border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2">
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDelete(issue.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
