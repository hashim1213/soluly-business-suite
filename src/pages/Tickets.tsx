import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  Plus,
  Lightbulb,
  FileText,
  MessageSquare,
  Search,
  Loader2,
  Inbox,
  Building,
  MoreVertical,
  ArrowRight,
  Check,
  FolderOpen,
  Trash2,
  Edit,
  AlertCircle,
  Filter,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket, TicketWithProject } from "@/hooks/useTickets";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Database } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type TicketCategory = Database["public"]["Enums"]["ticket_category"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const categoryConfig = {
  all: { label: "All", icon: Inbox, color: "bg-primary" },
  uncategorized: { label: "Uncategorized", icon: FolderOpen, color: "bg-muted" },
  feature: { label: "Features", icon: Lightbulb, color: "bg-chart-4" },
  quote: { label: "Quotes", icon: FileText, color: "bg-chart-1" },
  feedback: { label: "Feedback", icon: MessageSquare, color: "bg-chart-2" },
  issue: { label: "Issues", icon: AlertCircle, color: "bg-destructive" },
};

const categoryIcons: Record<TicketCategory, typeof Lightbulb> = {
  feature: Lightbulb,
  quote: FileText,
  feedback: MessageSquare,
  issue: AlertCircle,
};

const categoryLabels: Record<TicketCategory, string> = {
  feature: "Feature Request",
  quote: "Customer Quote",
  feedback: "Feedback",
  issue: "Issue",
};

import { ticketStatusStyles, ticketPriorityStyles } from "@/lib/styles";

export default function Tickets() {
  const { navigateOrg } = useOrgNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch data
  const { data: tickets, isLoading, error } = useTickets();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();

  // Mutations
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("category") || "all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithProject | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  // Advanced filters
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [showClosedTickets, setShowClosedTickets] = useState<boolean>(false);

  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "feature" as TicketCategory,
    project_id: "",
    priority: "medium" as TicketPriority,
    assignee_id: "",
  });

  const [editForm, setEditForm] = useState({
    category: "feature" as TicketCategory,
    project_id: "",
    priority: "medium" as TicketPriority,
    status: "open" as TicketStatus,
    assignee_id: "",
  });

  // Sync URL with active tab
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categoryParam !== activeTab) {
      setActiveTab(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab && activeTab !== "all") {
      setSearchParams({ category: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let filtered = tickets?.filter((ticket) => {
      // Hide closed tickets by default unless showClosedTickets is true
      if (!showClosedTickets && ticket.status === "closed") {
        return false;
      }

      // Search filter
      const matchesSearch = searchQuery === "" ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      let matchesCategory = true;
      if (activeTab === "uncategorized") {
        matchesCategory = !ticket.project_id;
      } else if (activeTab !== "all") {
        matchesCategory = ticket.category === activeTab;
      }

      // Assignee filter
      const matchesAssignee = filterAssignee === "all" ||
        (filterAssignee === "unassigned" ? !ticket.assignee_id : ticket.assignee_id === filterAssignee);

      // Status filter
      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      // Priority filter
      const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;

      // Project filter
      const matchesProject = filterProject === "all" ||
        (filterProject === "unassigned" ? !ticket.project_id : ticket.project_id === filterProject);

      return matchesSearch && matchesCategory && matchesAssignee && matchesStatus && matchesPriority && matchesProject;
    }) || [];

    // Sort tickets: open tickets first, then by priority (high to low), then by created date (newest first)
    filtered.sort((a, b) => {
      // First sort by status - closed tickets go to the bottom
      const statusOrder = { 'open': 0, 'in-progress': 1, 'pending': 2, 'closed': 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [tickets, searchQuery, activeTab, filterAssignee, filterStatus, filterPriority, filterProject, showClosedTickets]);

  // Count tickets per category (excluding closed tickets unless showClosedTickets is true)
  const categoryCounts = useMemo(() => {
    const ticketsToCount = showClosedTickets ? tickets : tickets?.filter(t => t.status !== "closed");
    return {
      all: ticketsToCount?.length || 0,
      uncategorized: ticketsToCount?.filter(t => !t.project_id).length || 0,
      feature: ticketsToCount?.filter(t => t.category === "feature").length || 0,
      quote: ticketsToCount?.filter(t => t.category === "quote").length || 0,
      feedback: ticketsToCount?.filter(t => t.category === "feedback").length || 0,
      issue: ticketsToCount?.filter(t => t.category === "issue").length || 0,
    };
  }, [tickets, showClosedTickets]);

  // Check if any filters are active
  const hasActiveFilters = filterAssignee !== "all" || filterStatus !== "all" ||
    filterPriority !== "all" || filterProject !== "all";

  const clearFilters = () => {
    setFilterAssignee("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterProject("all");
  };

  // Batch operations
  const toggleTicketSelection = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t.id)));
    }
  };

  const handleBulkStatusUpdate = async (status: TicketStatus) => {
    if (selectedTickets.size === 0) return;

    try {
      const promises = Array.from(selectedTickets).map(id =>
        updateTicket.mutateAsync({ id, status })
      );
      await Promise.all(promises);
      toast.success(`Updated ${selectedTickets.size} ticket(s)`);
      setSelectedTickets(new Set());
    } catch (error) {
      toast.error("Failed to update some tickets");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedTickets.size} ticket(s)?`)) return;

    try {
      const promises = Array.from(selectedTickets).map(id =>
        deleteTicket.mutateAsync(id)
      );
      await Promise.all(promises);
      toast.success(`Deleted ${selectedTickets.size} ticket(s)`);
      setSelectedTickets(new Set());
    } catch (error) {
      toast.error("Failed to delete some tickets");
    }
  };

  const handleBulkAssign = async (assigneeId: string) => {
    if (selectedTickets.size === 0) return;

    try {
      const promises = Array.from(selectedTickets).map(id =>
        updateTicket.mutateAsync({ id, assignee_id: assigneeId || null })
      );
      await Promise.all(promises);
      toast.success(`Assigned ${selectedTickets.size} ticket(s)`);
      setSelectedTickets(new Set());
    } catch (error) {
      toast.error("Failed to assign some tickets");
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title) {
      toast.error("Please fill in the title");
      return;
    }

    try {
      await createTicket.mutateAsync({
        title: newTicket.title,
        description: newTicket.description || null,
        category: newTicket.category,
        project_id: newTicket.project_id || null,
        priority: newTicket.priority,
        assignee_id: newTicket.assignee_id || null,
      });

      setNewTicket({
        title: "",
        description: "",
        category: "feature",
        project_id: "",
        priority: "medium",
        assignee_id: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    try {
      await updateTicket.mutateAsync({
        id: selectedTicket.id,
        category: editForm.category,
        project_id: editForm.project_id || null,
        priority: editForm.priority,
        status: editForm.status,
        assignee_id: editForm.assignee_id || null,
      });

      toast.success("Ticket updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleQuickAssign = async (ticketId: string, projectId: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        project_id: projectId,
      });
      toast.success("Assigned to project");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicket.mutateAsync(ticketId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = (ticket: TicketWithProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
    setEditForm({
      category: ticket.category,
      project_id: ticket.project_id || "",
      priority: ticket.priority,
      status: ticket.status,
      assignee_id: ticket.assignee_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
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
        <p className="text-destructive">Failed to load tickets</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Manage incoming tickets from email and other sources</p>
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetTrigger asChild>
            <Button className="border shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="border-b border-border pb-4 mb-4">
              <SheetTitle>Create New Ticket</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter ticket title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the ticket in detail"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="border"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value: TicketCategory) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="quote">Customer Quote</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Project (optional)</Label>
                  <Select
                    value={newTicket.project_id}
                    onValueChange={(value) => setNewTicket({ ...newTicket, project_id: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value: TicketPriority) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={newTicket.assignee_id}
                    onValueChange={(value) => setNewTicket({ ...newTicket, assignee_id: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      {teamMembers?.filter(m => m.status === "active").map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border">
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} className="border" disabled={createTicket.isPending}>
                {createTicket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = categoryCounts[key as keyof typeof categoryCounts];
          const isActive = activeTab === key;
          return (
            <Card
              key={key}
              className={`border shadow-sm cursor-pointer transition-all ${isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
              onClick={() => setActiveTab(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 border border-border flex items-center justify-center ${isActive ? config.color : "bg-secondary"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : ""}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-max sm:w-auto">
                <TabsList className="border border-border p-1">
                  <TabsTrigger value="all" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="uncategorized" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Uncategorized</span>
                    <span className="sm:hidden">Other</span>
                  </TabsTrigger>
                  <TabsTrigger value="feature" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Features</span>
                  </TabsTrigger>
                  <TabsTrigger value="quote" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Quotes</span>
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Feedback</span>
                  </TabsTrigger>
                  <TabsTrigger value="issue" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Issues</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 border"
                />
              </div>

              {/* Show Closed Tickets Toggle */}
              <Button
                variant={showClosedTickets ? "default" : "outline"}
                onClick={() => setShowClosedTickets(!showClosedTickets)}
                className="border"
              >
                <Check className="h-4 w-4 mr-2" />
                {showClosedTickets ? "Hide Closed" : "Show Closed"}
              </Button>

              {/* Advanced Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Advanced Filters</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                          <SelectTrigger className="border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Assignee</Label>
                        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                          <SelectTrigger className="border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teamMembers?.filter(m => m.status === "active").map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Project</Label>
                        <Select value={filterProject} onValueChange={setFilterProject}>
                          <SelectTrigger className="border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
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
                </PopoverContent>
              </Popover>
            </div>

            {/* Batch Actions Bar */}
            {selectedTickets.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary rounded">
                <span className="text-sm font-medium">
                  {selectedTickets.size} ticket(s) selected
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border">
                        Update Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("open")}>
                        Set as Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("in-progress")}>
                        Set as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("pending")}>
                        Set as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("closed")}>
                        Set as Closed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border">
                        Assign
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkAssign("")}>
                        Unassign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {teamMembers?.filter(m => m.status === "active").map((member) => (
                        <DropdownMenuItem key={member.id} onClick={() => handleBulkAssign(member.id)}>
                          {member.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTickets(new Set())}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {tickets?.length === 0
                  ? "No tickets yet. Create a new ticket or wait for emails to be processed."
                  : "No tickets match your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[80px] sm:w-[100px]">ID</TableHead>
                    <TableHead className="font-semibold uppercase text-xs min-w-[200px]">Title</TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[120px] hidden md:table-cell">Category</TableHead>
                    <TableHead className="font-semibold uppercase text-xs hidden lg:table-cell">Project</TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[80px]">Priority</TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[100px]">Status</TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[100px] hidden sm:table-cell">Created</TableHead>
                    <TableHead className="font-semibold uppercase text-xs w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const CategoryIcon = categoryIcons[ticket.category];
                    const isSelected = selectedTickets.has(ticket.id);
                    return (
                      <TableRow
                        key={ticket.id}
                        className={`border-b cursor-pointer hover:bg-accent/50 ${isSelected ? "bg-primary/5" : ""}`}
                        onClick={() => navigateOrg(`/tickets/${ticket.display_id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTicketSelection(ticket.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">{ticket.display_id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm line-clamp-1">{ticket.title}</span>
                            <div className="flex flex-wrap items-center gap-1 mt-1 md:hidden">
                              <Badge className={`${ticketPriorityStyles[ticket.priority]} text-xs`}>
                                {ticket.priority}
                              </Badge>
                              {ticket.project?.name && (
                                <span className="text-xs text-muted-foreground">{ticket.project.name}</span>
                              )}
                            </div>
                            {ticket.assignee?.name && (
                              <span className="text-xs text-muted-foreground">Assigned to: {ticket.assignee.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{categoryLabels[ticket.category]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {ticket.project?.name ? (
                            <div className="flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{ticket.project.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={ticketPriorityStyles[ticket.priority]}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles] || "bg-slate-400 text-black"} text-xs`}>
                            {ticket.status.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigateOrg(`/tickets/${ticket.display_id}`);
                              }}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => openEditDialog(ticket, e)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Ticket
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!ticket.project_id && projects && projects.length > 0 && (
                                <>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Quick Assign to Project
                                  </div>
                                  {projects.slice(0, 5).map((project) => (
                                    <DropdownMenuItem
                                      key={project.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAssign(ticket.id, project.id);
                                      }}
                                    >
                                      <Building className="h-4 w-4 mr-2" />
                                      {project.name}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTicket(ticket.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Ticket
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Ticket Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="border-b border-border pb-4 mb-4">
            <SheetTitle>Edit Ticket</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            {selectedTicket && (
              <div className="p-3 bg-secondary rounded border border-border">
                <p className="font-mono text-xs text-muted-foreground">{selectedTicket.display_id}</p>
                <p className="font-medium">{selectedTicket.title}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value: TicketCategory) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="quote">Customer Quote</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={editForm.project_id}
                  onValueChange={(value) => setEditForm({ ...editForm, project_id: value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value: TicketPriority) => setEditForm({ ...editForm, priority: value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: TicketStatus) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select
                value={editForm.assignee_id}
                onValueChange={(value) => setEditForm({ ...editForm, assignee_id: value })}
              >
                <SelectTrigger className="border">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="border">
                  {teamMembers?.filter(m => m.status === "active").map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border">
              Cancel
            </Button>
            <Button onClick={handleUpdateTicket} className="border" disabled={updateTicket.isPending}>
              {updateTicket.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
