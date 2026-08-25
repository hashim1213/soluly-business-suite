import { useState, useMemo, useEffect, useRef } from "react";
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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  List,
  LayoutGrid,
  Play,
  Zap,
  BookOpen,
  CircleDot,
  Bug,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket, TicketWithProject } from "@/hooks/useTickets";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint, Sprint } from "@/hooks/useSprints";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Database } from "@/integrations/supabase/types";
import { formatDistanceToNow, format, differenceInCalendarDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import TicketsBoard from "@/components/tickets/TicketsBoard";

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

type TicketType = "epic" | "story" | "task" | "subtask" | "bug";
const ticketTypeIcons: Record<TicketType, typeof Zap> = {
  epic: Zap,
  story: BookOpen,
  task: CircleDot,
  subtask: Layers,
  bug: Bug,
};
const ticketTypeColors: Record<TicketType, string> = {
  epic: "text-violet-600",
  story: "text-emerald-600",
  task: "text-blue-600",
  subtask: "text-sky-500",
  bug: "text-red-500",
};

import { ticketStatusStyles, ticketPriorityStyles } from "@/lib/styles";

// Sprint status badge styles (matches conventions in src/lib/styles.ts)
const sprintStatusStyles: Record<string, string> = {
  planned: "bg-slate-400 text-black",
  active: "bg-emerald-600 text-white",
  completed: "bg-slate-600 text-white",
};

// Semantic sort orders (not alphabetical)
const ticketStatusOrder: Record<string, number> = { "open": 0, "in-progress": 1, "pending": 2, "closed": 3 };
const ticketPriorityOrder: Record<string, number> = { "high": 0, "medium": 1, "low": 2 };

type SortKey = "title" | "category" | "project" | "priority" | "status" | "created";
type SortDir = "asc" | "desc";

export default function Tickets() {
  const { navigateOrg } = useOrgNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch data
  const { data: tickets, isLoading, error } = useTickets();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();
  const { data: sprints } = useSprints();
  const { data: typeOptions } = useDropdownOptions("ticket_type");
  const { data: categoryOptions } = useDropdownOptions("ticket_category");
  const { data: priorityOptions } = useDropdownOptions("ticket_priority");
  const { data: statusOptions } = useDropdownOptions("ticket_status");

  // Mutations
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("category") || "all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithProject | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  // Board/Table view toggle (persisted)
  const [viewMode, setViewModeState] = useState<"table" | "board">(() => {
    try {
      return localStorage.getItem("soluly-tickets-view") === "board" ? "board" : "table";
    } catch {
      return "table";
    }
  });
  const setViewMode = (mode: "table" | "board") => {
    setViewModeState(mode);
    try {
      localStorage.setItem("soluly-tickets-view", mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Sprint filtering + management
  const [sprintFilter, setSprintFilter] = useState<string>("all");
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const [rolloverTarget, setRolloverTarget] = useState<string>("backlog");
  const sprintDefaultApplied = useRef(false);

  // Focus the board on the running sprint by default so the page opens as
  // a sprint board rather than an unfiltered list
  useEffect(() => {
    if (sprintDefaultApplied.current || !sprints) return;
    sprintDefaultApplied.current = true;
    const active = sprints.find((s) => s.status === "active");
    if (active) setSprintFilter(active.id);
  }, [sprints]);
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  // Column sorting (null = default "smart" ordering)
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Advanced filters
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [showClosedTickets, setShowClosedTickets] = useState<boolean>(false);

  const initialTicketState = {
    title: "",
    description: "",
    category: "feature" as TicketCategory,
    ticket_type: "task" as "epic" | "story" | "task" | "subtask" | "bug",
    project_id: "",
    priority: "medium" as TicketPriority,
    assignee_id: "",
    story_points: "",
    sprint_id: "",
    parent_ticket_id: "",
    due_date: "",
    estimated_hours: "",
    labels: "" as string,
  };
  const [newTicket, setNewTicket] = useState(initialTicketState);

  useEffect(() => {
    if (!isDialogOpen) {
      setNewTicket(initialTicketState);
    }
  }, [isDialogOpen]);

  const [editForm, setEditForm] = useState({
    category: "feature" as TicketCategory,
    project_id: "",
    priority: "medium" as TicketPriority,
    status: "open" as TicketStatus,
    assignee_id: "",
    story_points: "",
    sprint_id: "",
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

      // Sprint filter
      const matchesSprint = sprintFilter === "all" ||
        (sprintFilter === "backlog" ? !ticket.sprint_id : ticket.sprint_id === sprintFilter);

      return matchesSearch && matchesCategory && matchesAssignee && matchesStatus && matchesPriority && matchesProject && matchesSprint;
    }) || [];

    if (sortKey) {
      // User-selected column sort
      const dir = sortDir === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case "title":
            cmp = a.title.localeCompare(b.title);
            break;
          case "category":
            cmp = categoryLabels[a.category].localeCompare(categoryLabels[b.category]);
            break;
          case "project":
            cmp = (a.project?.name || "").localeCompare(b.project?.name || "");
            break;
          case "priority":
            // Semantic: high > medium > low
            cmp = ticketPriorityOrder[a.priority] - ticketPriorityOrder[b.priority];
            break;
          case "status":
            // Semantic: open > in-progress > pending > closed
            cmp = ticketStatusOrder[a.status] - ticketStatusOrder[b.status];
            break;
          case "created":
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
        }
        if (cmp !== 0) return cmp * dir;

        // Tie-break by created date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // Default "smart" sort: open tickets first, then by priority (high to low), then by created date (newest first)
      filtered.sort((a, b) => {
        // First sort by status - closed tickets go to the bottom
        const statusDiff = ticketStatusOrder[a.status] - ticketStatusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Then by priority
        const priorityDiff = ticketPriorityOrder[a.priority] - ticketPriorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Finally by created date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return filtered;
  }, [tickets, searchQuery, activeTab, filterAssignee, filterStatus, filterPriority, filterProject, sprintFilter, showClosedTickets, sortKey, sortDir]);

  // Count tickets per sprint (for the Manage Sprints dialog)
  const sprintTicketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets?.forEach((ticket) => {
      if (ticket.sprint_id) {
        counts[ticket.sprint_id] = (counts[ticket.sprint_id] || 0) + 1;
      }
    });
    return counts;
  }, [tickets]);

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

  // Column sorting: asc -> desc -> back to default smart ordering
  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-foreground" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-foreground" />
    );
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
        ticket_type: newTicket.ticket_type,
        project_id: newTicket.project_id || null,
        priority: newTicket.priority,
        assignee_id: newTicket.assignee_id || null,
        story_points: newTicket.story_points === "" ? null : parseFloat(newTicket.story_points),
        sprint_id: newTicket.sprint_id || null,
        parent_ticket_id: newTicket.parent_ticket_id || null,
        due_date: newTicket.due_date || null,
        estimated_hours: newTicket.estimated_hours === "" ? null : parseFloat(newTicket.estimated_hours),
        labels: newTicket.labels ? newTicket.labels.split(",").map((l) => l.trim()).filter(Boolean) : [],
      });

      setNewTicket({
        title: "",
        description: "",
        category: "feature",
        ticket_type: "task",
        project_id: "",
        priority: "medium",
        assignee_id: "",
        story_points: "",
        sprint_id: "",
        parent_ticket_id: "",
        due_date: "",
        estimated_hours: "",
        labels: "",
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
        story_points: editForm.story_points === "" ? null : parseFloat(editForm.story_points),
        sprint_id: editForm.sprint_id || null,
      });

      toast.success("Ticket updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleInlineStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      await updateTicket.mutateAsync({ id: ticketId, status });
      toast.success("Status updated");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleInlinePriorityChange = async (ticketId: string, priority: TicketPriority) => {
    try {
      await updateTicket.mutateAsync({ id: ticketId, priority });
      toast.success("Priority updated");
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

  // Sprint management
  const handleMoveToSprint = async (ticketId: string, sprintId: string | null) => {
    try {
      await updateTicket.mutateAsync({ id: ticketId, sprint_id: sprintId });
      toast.success(sprintId ? "Moved to sprint" : "Moved to backlog");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) {
      toast.error("Sprint name is required");
      return;
    }

    try {
      await createSprint.mutateAsync({
        name: newSprint.name.trim(),
        goal: newSprint.goal || null,
        start_date: newSprint.start_date || null,
        end_date: newSprint.end_date || null,
      });
      setNewSprint({ name: "", goal: "", start_date: "", end_date: "" });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      const currentActive = sprints?.find((s) => s.status === "active" && s.id !== sprint.id);
      if (currentActive) {
        await updateSprint.mutateAsync({ id: currentActive.id, status: "completed" });
        toast.warning(`Sprint "${currentActive.name}" was completed — only one sprint can be active at a time`);
      }
      await updateSprint.mutateAsync({ id: sprint.id, status: "active" });
      toast.success(`Sprint "${sprint.name}" started`);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Completing a sprint rolls unfinished tickets somewhere useful instead of
  // stranding them in a completed sprint
  const unfinishedInSprint = (sprint: Sprint) =>
    tickets?.filter((t) => t.sprint_id === sprint.id && t.status !== "closed") || [];

  const handleCompleteSprint = async (sprint: Sprint) => {
    if (unfinishedInSprint(sprint).length > 0) {
      setRolloverTarget("backlog");
      setCompletingSprint(sprint);
      return;
    }
    try {
      await updateSprint.mutateAsync({ id: sprint.id, status: "completed" });
      toast.success(`Sprint "${sprint.name}" completed`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const finalizeCompleteSprint = async () => {
    if (!completingSprint) return;
    const unfinished = unfinishedInSprint(completingSprint);
    const targetSprintId = rolloverTarget === "backlog" ? null : rolloverTarget;
    try {
      await Promise.all(
        unfinished.map((t) => updateTicket.mutateAsync({ id: t.id, sprint_id: targetSprintId }))
      );
      await updateSprint.mutateAsync({ id: completingSprint.id, status: "completed" });
      const destination =
        targetSprintId === null
          ? "the backlog"
          : `"${sprints?.find((s) => s.id === targetSprintId)?.name}"`;
      toast.success(
        `Sprint "${completingSprint.name}" completed — ${unfinished.length} unfinished ticket(s) moved to ${destination}`
      );
      if (sprintFilter === completingSprint.id) {
        setSprintFilter(targetSprintId ?? "backlog");
      }
      setCompletingSprint(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleBulkMoveToSprint = async (sprintId: string | null) => {
    if (selectedTickets.size === 0) return;

    try {
      const promises = Array.from(selectedTickets).map(id =>
        updateTicket.mutateAsync({ id, sprint_id: sprintId })
      );
      await Promise.all(promises);
      toast.success(`Moved ${selectedTickets.size} ticket(s)`);
      setSelectedTickets(new Set());
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (!confirm(`Are you sure you want to delete sprint "${sprint.name}"? Its tickets will return to the backlog.`)) return;

    try {
      await deleteSprint.mutateAsync(sprint.id);
      if (sprintFilter === sprint.id) {
        setSprintFilter("all");
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatSprintDates = (sprint: Sprint) => {
    if (!sprint.start_date && !sprint.end_date) return "No dates set";
    const fmt = (d: string | null) => (d ? format(new Date(d), "MMM d, yyyy") : "—");
    return `${fmt(sprint.start_date)} → ${fmt(sprint.end_date)}`;
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
      story_points: ticket.story_points != null ? String(ticket.story_points) : "",
      sprint_id: ticket.sprint_id || "",
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
                  <Label htmlFor="ticket-type">Type</Label>
                  <Select
                    value={newTicket.ticket_type}
                    onValueChange={(value: string) => setNewTicket({ ...newTicket, ticket_type: value as TicketType })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border">
                      {typeOptions?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                      {categoryOptions?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project">Project</Label>
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
                {newTicket.ticket_type === "subtask" && (
                  <div className="grid gap-2">
                    <Label htmlFor="parent-ticket">Parent Ticket</Label>
                    <Select
                      value={newTicket.parent_ticket_id}
                      onValueChange={(value) => setNewTicket({ ...newTicket, parent_ticket_id: value })}
                    >
                      <SelectTrigger className="border">
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent className="border">
                        {tickets?.filter(t => t.ticket_type !== "subtask" && t.status !== "closed").map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.display_id} — {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                      {priorityOptions?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="story-points">Points</Label>
                  <Input
                    id="story-points"
                    type="number"
                    step={0.5}
                    min={0}
                    placeholder="e.g. 3"
                    value={newTicket.story_points}
                    onChange={(e) => setNewTicket({ ...newTicket, story_points: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimated-hours">Est. Hours</Label>
                  <Input
                    id="estimated-hours"
                    type="number"
                    step={0.5}
                    min={0}
                    placeholder="e.g. 8"
                    value={newTicket.estimated_hours}
                    onChange={(e) => setNewTicket({ ...newTicket, estimated_hours: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newTicket.due_date}
                    onChange={(e) => setNewTicket({ ...newTicket, due_date: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-sprint">Sprint</Label>
                  <Select
                    value={newTicket.sprint_id || "backlog"}
                    onValueChange={(v) => setNewTicket({ ...newTicket, sprint_id: v === "backlog" ? "" : v })}
                  >
                    <SelectTrigger id="new-sprint" className="border">
                      <SelectValue placeholder="Backlog" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints?.filter((s) => s.status !== "completed").map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                          {sprint.status === "active" ? " · Active" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="labels">Labels</Label>
                  <Input
                    id="labels"
                    placeholder="e.g. frontend, urgent, phase-2"
                    value={newTicket.labels}
                    onChange={(e) => setNewTicket({ ...newTicket, labels: e.target.value })}
                    className="border"
                  />
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
            {/* Category filtering lives in the clickable stat cards above */}
            {/* Sprint Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sprintFilter} onValueChange={setSprintFilter}>
                <SelectTrigger className="border h-9 w-full sm:w-[240px]">
                  <SelectValue placeholder="All tickets" />
                </SelectTrigger>
                <SelectContent className="border">
                  <SelectItem value="all">All tickets</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  {sprints?.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                      {sprint.status === "active" ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="border"
                onClick={() => setIsSprintDialogOpen(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                Sprints
              </Button>
            </div>

            {/* Sprint context band — goal, dates, progress, and actions for
                the sprint currently in focus */}
            {(() => {
              const sprint = sprints?.find((s) => s.id === sprintFilter);
              if (!sprint) return null;
              const sprintTickets = tickets?.filter((t) => t.sprint_id === sprint.id) || [];
              const done = sprintTickets.filter((t) => t.status === "closed").length;
              const totalPoints = sprintTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
              const donePoints = sprintTickets
                .filter((t) => t.status === "closed")
                .reduce((sum, t) => sum + (t.story_points || 0), 0);
              const pct = sprintTickets.length > 0 ? Math.round((done / sprintTickets.length) * 100) : 0;
              const daysLeft = sprint.end_date
                ? differenceInCalendarDays(new Date(sprint.end_date), new Date())
                : null;
              return (
                <div className="rounded-sm border border-border bg-primary/5 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-semibold">{sprint.name}</span>
                      <Badge
                        className={
                          sprint.status === "active"
                            ? "bg-emerald-600 text-white"
                            : sprint.status === "completed"
                              ? "bg-slate-600 text-white"
                              : "bg-amber-500 text-black"
                        }
                      >
                        {sprint.status}
                      </Badge>
                      {sprint.goal && (
                        <span className="text-sm text-muted-foreground truncate">— {sprint.goal}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sprint.status === "active" && daysLeft !== null && (
                        <span
                          className={`text-xs font-medium ${daysLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} day(s) overdue`
                            : daysLeft === 0
                              ? "Ends today"
                              : `${daysLeft} day(s) left`}
                        </span>
                      )}
                      {sprint.status === "planned" && (
                        <Button size="sm" variant="outline" className="h-7" onClick={() => handleStartSprint(sprint)}>
                          <Play className="h-3.5 w-3.5 mr-1.5" />
                          Start Sprint
                        </Button>
                      )}
                      {sprint.status === "active" && (
                        <Button size="sm" variant="outline" className="h-7" onClick={() => handleCompleteSprint(sprint)}>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Complete Sprint
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {done} of {sprintTickets.length} done
                      {totalPoints > 0 ? ` · ${donePoints}/${totalPoints} pts` : ""}
                    </span>
                  </div>
                </div>
              );
            })()}

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

              {/* Board/Table View Toggle */}
              <div className="flex items-center rounded-sm border border-input overflow-hidden self-start sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-8 px-2.5 ${viewMode === "table" ? "bg-accent text-accent-foreground" : ""}`}
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none h-8 px-2.5 ${viewMode === "board" ? "bg-accent text-accent-foreground" : ""}`}
                  onClick={() => setViewMode("board")}
                  aria-label="Board view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
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
                            {statusOptions?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
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
                            {priorityOptions?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border">
                        Move to Sprint
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkMoveToSprint(null)}>
                        Backlog
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {sprints?.filter((s) => s.status !== "completed").map((sprint) => (
                        <DropdownMenuItem key={sprint.id} onClick={() => handleBulkMoveToSprint(sprint.id)}>
                          {sprint.name}
                          {sprint.status === "active" ? " · Active" : ""}
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
          ) : viewMode === "board" ? (
            <TicketsBoard
              tickets={filteredTickets}
              sprints={sprints || []}
              onTicketClick={(ticket) => navigateOrg(`/tickets/${ticket.display_id}`)}
              onStatusChange={handleInlineStatusChange}
              onMoveToSprint={handleMoveToSprint}
              onEdit={openEditDialog}
              onDelete={handleDeleteTicket}
            />
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
                    <TableHead
                      className="font-semibold uppercase text-xs min-w-[200px] cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("title")}
                    >
                      <span className="flex items-center">Title{renderSortIcon("title")}</span>
                    </TableHead>
                    <TableHead
                      className="font-semibold uppercase text-xs w-[120px] hidden md:table-cell cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("category")}
                    >
                      <span className="flex items-center">Category{renderSortIcon("category")}</span>
                    </TableHead>
                    <TableHead
                      className="font-semibold uppercase text-xs hidden lg:table-cell cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("project")}
                    >
                      <span className="flex items-center">Project{renderSortIcon("project")}</span>
                    </TableHead>
                    <TableHead
                      className="font-semibold uppercase text-xs w-[80px] cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("priority")}
                    >
                      <span className="flex items-center">Priority{renderSortIcon("priority")}</span>
                    </TableHead>
                    <TableHead
                      className="font-semibold uppercase text-xs w-[100px] cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("status")}
                    >
                      <span className="flex items-center">Status{renderSortIcon("status")}</span>
                    </TableHead>
                    <TableHead
                      className="font-semibold uppercase text-xs w-[100px] hidden sm:table-cell cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("created")}
                    >
                      <span className="flex items-center">Created{renderSortIcon("created")}</span>
                    </TableHead>
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
                          <div className="flex items-start gap-2">
                            {(() => {
                              const TypeIcon = ticketTypeIcons[(ticket.ticket_type as TicketType) || "task"];
                              const typeColor = ticketTypeColors[(ticket.ticket_type as TicketType) || "task"];
                              return <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColor}`} />;
                            })()}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm line-clamp-1">{ticket.title}</span>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {ticket.labels && ticket.labels.length > 0 && ticket.labels.map((label: string) => (
                                  <span key={label} className="text-[10px] px-1.5 py-0 rounded-[2px] bg-muted text-muted-foreground">{label}</span>
                                ))}
                                <span className="text-xs text-muted-foreground md:hidden">
                                  {ticket.project?.name}
                                </span>
                              </div>
                              {ticket.assignee?.name && (
                                <span className="text-xs text-muted-foreground">{ticket.assignee.name}</span>
                              )}
                            </div>
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
                        <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={ticket.priority}
                            onValueChange={(value: TicketPriority) => handleInlinePriorityChange(ticket.id, value)}
                          >
                            <SelectTrigger className={`h-7 w-auto gap-1 px-2.5 text-xs font-semibold border-transparent focus:ring-1 ${ticketPriorityStyles[ticket.priority]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border">
                              {priorityOptions?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={ticket.status}
                            onValueChange={(value: TicketStatus) => handleInlineStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className={`h-7 w-auto gap-1 px-2.5 text-xs font-semibold border-transparent focus:ring-1 ${ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles] || "bg-slate-400 text-black"}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border">
                              {statusOptions?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Move to Sprint
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="border">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToSprint(ticket.id, null);
                                      }}
                                    >
                                      Backlog
                                      {!ticket.sprint_id && <Check className="h-3.5 w-3.5 ml-auto" />}
                                    </DropdownMenuItem>
                                    {sprints?.map((sprint) => (
                                      <DropdownMenuItem
                                        key={sprint.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveToSprint(ticket.id, sprint.id);
                                        }}
                                      >
                                        {sprint.name}
                                        {sprint.status === "active" ? " · Active" : ""}
                                        {ticket.sprint_id === sprint.id && (
                                          <Check className="h-3.5 w-3.5 ml-auto" />
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
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
                    {categoryOptions?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
                    {priorityOptions?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
                    {statusOptions?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="edit-story-points">Points</Label>
                <Input
                  id="edit-story-points"
                  type="number"
                  step={0.5}
                  min={0}
                  placeholder="e.g. 3"
                  value={editForm.story_points}
                  onChange={(e) => setEditForm({ ...editForm, story_points: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sprint">Sprint</Label>
                <Select
                  value={editForm.sprint_id || "backlog"}
                  onValueChange={(v) => setEditForm({ ...editForm, sprint_id: v === "backlog" ? "" : v })}
                >
                  <SelectTrigger id="edit-sprint" className="border">
                    <SelectValue placeholder="Backlog" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="backlog">Backlog</SelectItem>
                    {sprints?.filter((s) => s.status !== "completed" || s.id === editForm.sprint_id).map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name}
                        {sprint.status === "active" ? " · Active" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      {/* Complete Sprint Dialog — decide where unfinished tickets go */}
      <Dialog open={!!completingSprint} onOpenChange={(open) => !open && setCompletingSprint(null)}>
        <DialogContent className="border sm:max-w-[440px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>Complete "{completingSprint?.name}"</DialogTitle>
          </DialogHeader>
          {completingSprint && (
            <div className="py-2 space-y-4">
              <p className="text-sm text-muted-foreground">
                {unfinishedInSprint(completingSprint).length} ticket(s) in this sprint aren't
                closed yet. Where should they go?
              </p>
              <Select value={rolloverTarget} onValueChange={setRolloverTarget}>
                <SelectTrigger className="border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border">
                  <SelectItem value="backlog">Backlog</SelectItem>
                  {sprints
                    ?.filter((s) => s.id !== completingSprint.id && s.status !== "completed")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        Sprint: {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setCompletingSprint(null)}>
              Cancel
            </Button>
            <Button onClick={finalizeCompleteSprint} disabled={updateSprint.isPending || updateTicket.isPending}>
              Complete Sprint
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Sprints Dialog */}
      <Dialog open={isSprintDialogOpen} onOpenChange={setIsSprintDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Sprints</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sprint list */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {!sprints || sprints.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No sprints yet. Create your first sprint below.
                </p>
              ) : (
                sprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className="flex items-center justify-between gap-3 p-3 border border-border rounded"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{sprint.name}</span>
                        <Badge className={`${sprintStatusStyles[sprint.status] || "bg-slate-400 text-black"} text-xs`}>
                          {sprint.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSprintDates(sprint)} · {sprintTicketCounts[sprint.id] || 0} ticket(s)
                      </p>
                      {sprint.goal && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{sprint.goal}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {sprint.status !== "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border h-7 px-2 text-xs"
                          onClick={() => handleStartSprint(sprint)}
                          disabled={updateSprint.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {sprint.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border h-7 px-2 text-xs"
                          onClick={() => handleCompleteSprint(sprint)}
                          disabled={updateSprint.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteSprint(sprint)}
                        disabled={deleteSprint.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create sprint form */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Create Sprint</h4>
              <div className="grid gap-2">
                <Label htmlFor="sprint-name">Name *</Label>
                <Input
                  id="sprint-name"
                  placeholder="e.g. Sprint 12"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sprint-goal">Goal</Label>
                <Input
                  id="sprint-goal"
                  placeholder="What should this sprint achieve?"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sprint-start">Start date</Label>
                  <Input
                    id="sprint-start"
                    type="date"
                    value={newSprint.start_date}
                    onChange={(e) => setNewSprint({ ...newSprint, start_date: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sprint-end">End date</Label>
                  <Input
                    id="sprint-end"
                    type="date"
                    value={newSprint.end_date}
                    onChange={(e) => setNewSprint({ ...newSprint, end_date: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateSprint}
                  className="border"
                  disabled={createSprint.isPending}
                >
                  {createSprint.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sprint
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
