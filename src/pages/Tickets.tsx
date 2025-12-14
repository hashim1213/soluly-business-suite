import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  Plus,
  Lightbulb,
  FileText,
  MessageSquare,
  Search,
  Loader2,
  Inbox,
  Mail,
  Building,
  MoreVertical,
  ArrowRight,
  Check,
  FolderOpen,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
};

const categoryIcons: Record<TicketCategory, typeof Lightbulb> = {
  feature: Lightbulb,
  quote: FileText,
  feedback: MessageSquare,
};

const categoryLabels: Record<TicketCategory, string> = {
  feature: "Feature Request",
  quote: "Customer Quote",
  feedback: "Feedback",
};

import { ticketStatusStyles, ticketPriorityStyles } from "@/lib/styles";

export default function Tickets() {
  const { navigateOrg } = useOrgNavigation();

  // Fetch data
  const { data: tickets, isLoading, error } = useTickets();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();

  // Mutations
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithProject | null>(null);

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

  // Filter tickets based on search and category
  const filteredTickets = useMemo(() => {
    return tickets?.filter((ticket) => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      let matchesCategory = true;
      if (activeTab === "uncategorized") {
        // Uncategorized = no project assigned
        matchesCategory = !ticket.project_id;
      } else if (activeTab !== "all") {
        matchesCategory = ticket.category === activeTab;
      }

      return matchesSearch && matchesCategory;
    }) || [];
  }, [tickets, searchQuery, activeTab]);

  // Count tickets per category
  const categoryCounts = useMemo(() => {
    return {
      all: tickets?.length || 0,
      uncategorized: tickets?.filter(t => !t.project_id).length || 0,
      feature: tickets?.filter(t => t.category === "feature").length || 0,
      quote: tickets?.filter(t => t.category === "quote").length || 0,
      feedback: tickets?.filter(t => t.category === "feedback").length || 0,
    };
  }, [tickets]);

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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage incoming tickets from email and other sources</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter ticket title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the ticket in detail"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value: TicketCategory) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="quote">Customer Quote</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Project (optional)</Label>
                  <Select
                    value={newTicket.project_id}
                    onValueChange={(value) => setNewTicket({ ...newTicket, project_id: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
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
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={newTicket.assignee_id}
                    onValueChange={(value) => setNewTicket({ ...newTicket, assignee_id: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
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
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} className="border-2" disabled={createTicket.isPending}>
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
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = categoryCounts[key as keyof typeof categoryCounts];
          const isActive = activeTab === key;
          return (
            <Card
              key={key}
              className={`border-2 shadow-sm cursor-pointer transition-all ${isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
              onClick={() => setActiveTab(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 border-2 border-border flex items-center justify-center ${isActive ? config.color : "bg-secondary"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : ""}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{config.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-max sm:w-auto">
                <TabsList className="border-2 border-border p-1">
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
                </TabsList>
              </Tabs>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 border-2"
              />
            </div>
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
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs w-[80px] sm:w-[100px]">ID</TableHead>
                    <TableHead className="font-bold uppercase text-xs min-w-[200px]">Title</TableHead>
                    <TableHead className="font-bold uppercase text-xs w-[120px] hidden md:table-cell">Category</TableHead>
                    <TableHead className="font-bold uppercase text-xs hidden lg:table-cell">Project</TableHead>
                    <TableHead className="font-bold uppercase text-xs w-[80px]">Priority</TableHead>
                    <TableHead className="font-bold uppercase text-xs w-[100px]">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs w-[100px] hidden sm:table-cell">Created</TableHead>
                    <TableHead className="font-bold uppercase text-xs w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const CategoryIcon = categoryIcons[ticket.category];
                    return (
                      <TableRow
                        key={ticket.id}
                        className="border-b-2 cursor-pointer hover:bg-accent/50"
                        onClick={() => navigateOrg(`/tickets/${ticket.display_id}`)}
                      >
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
                              <span className="text-xs text-muted-foreground hidden sm:block">Assigned to: {ticket.assignee.name}</span>
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
                          <DropdownMenuContent align="end" className="border-2">
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

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[500px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTicket && (
              <div className="p-3 bg-secondary rounded border-2 border-border">
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
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="quote">Customer Quote</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={editForm.project_id}
                  onValueChange={(value) => setEditForm({ ...editForm, project_id: value })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="border-2">
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
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: TicketStatus) => setEditForm({ ...editForm, status: value })}
                >
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
            </div>
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select
                value={editForm.assignee_id}
                onValueChange={(value) => setEditForm({ ...editForm, assignee_id: value })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="border-2">
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleUpdateTicket} className="border-2" disabled={updateTicket.isPending}>
              {updateTicket.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
