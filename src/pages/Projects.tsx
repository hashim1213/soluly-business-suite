import { useState, useMemo, useEffect } from "react";
import { Plus, MoreVertical, Users, Ticket, Loader2, Check, ChevronsUpDown, UserPlus, Calendar, FileText, Edit, Download, Wrench, Archive, Search, LayoutGrid, List, ArrowUp, ArrowDown, ArrowUpDown, CheckSquare, Square, Trash2, X } from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject, Project } from "@/hooks/useProjects";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useTickets } from "@/hooks/useTickets";
import { useContacts, useCreateContact, Contact } from "@/hooks/useContacts";
import { useProjectTemplates, useSeedSystemTemplates } from "@/hooks/useProjectTemplates";
import { useInitializeWorkflow } from "@/hooks/useWorkflowStatuses";
import { Database } from "@/integrations/supabase/types";
import { projectStatusStyles } from "@/lib/styles";
import { cn } from "@/lib/utils";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

// PDF generation utility
const generateProjectPDF = async (project: Project, tickets: any[]) => {
  // Dynamic import to avoid loading jspdf unless needed
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(project.name, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Project ID: ${project.display_id}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Reset text color
  doc.setTextColor(0);

  // Project Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Project Details", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const details = [
    ["Client:", project.client_name],
    ["Email:", project.client_email || "N/A"],
    ["Status:", project.status.replace("_", " ").toUpperCase()],
    ["Progress:", `${project.progress}%`],
    ["Value:", `$${project.value.toLocaleString()}`],
    ["Budget:", `$${project.budget.toLocaleString()}`],
    ["Start Date:", project.start_date ? new Date(project.start_date + "T00:00:00").toLocaleDateString() : "N/A"],
    ["End Date:", project.end_date ? new Date(project.end_date + "T00:00:00").toLocaleDateString() : "N/A"],
  ];

  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 60, y);
    y += 6;
  });

  y += 5;

  // Description
  if (project.description) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(project.description, pageWidth - 40);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 10;
  }

  // Tickets Summary
  const projectTickets = tickets?.filter(t => t.project_id === project.id) || [];
  if (projectTickets.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Tickets (${projectTickets.length})`, 20, y);
    y += 8;

    doc.setFontSize(9);
    projectTickets.slice(0, 10).forEach((ticket) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${ticket.display_id}`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${ticket.title} [${ticket.status}]`, 45, y);
      y += 5;
    });

    if (projectTickets.length > 10) {
      doc.text(`... and ${projectTickets.length - 10} more tickets`, 20, y);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${project.display_id}-report.pdf`);
  toast.success("Project report downloaded");
};

export default function Projects() {
  const { navigateOrg } = useOrgNavigation();
  const canViewAmounts = useCanViewAmounts();
  const { data: projects, isLoading, error } = useProjects();
  const { data: tickets } = useTickets();
  const { data: contacts } = useContacts();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const createContact = useCreateContact();
  const { data: templates } = useProjectTemplates();
  const seedTemplates = useSeedSystemTemplates();
  const initializeWorkflow = useInitializeWorkflow();
  const { data: projectStatusOptions } = useDropdownOptions("project_status");

  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");

  // Seed system templates on first load if none exist
  useEffect(() => {
    if (templates && templates.length === 0) {
      seedTemplates.mutate();
    }
  }, [templates]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [viewMode, setViewModeState] = useState<"table" | "cards">(() => {
    try {
      const saved = localStorage.getItem("soluly-projects-view");
      return saved === "cards" ? "cards" : "table";
    } catch {
      return "table";
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Project>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const setViewMode = (mode: "table" | "cards") => {
    setViewModeState(mode);
    try {
      localStorage.setItem("soluly-projects-view", mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleSort = (key: keyof Project) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" || key === "value" || key === "progress" ? "desc" : "asc");
    }
  };
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
    clientEmail: "",
    value: "",
    budget: "",
    status: "pending" as ProjectStatus,
    startDate: "",
    endDate: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    client_name: "",
    client_email: "",
    value: "",
    budget: "",
    status: "pending" as ProjectStatus,
    progress: "",
    start_date: "",
    end_date: "",
    has_maintenance: false,
    maintenance_amount: "",
    maintenance_frequency: "monthly",
    maintenance_start_date: "",
    maintenance_end_date: "",
    maintenance_notes: "",
  });

  // Count open tickets per project
  const getOpenTicketCount = (projectId: string) => {
    return tickets?.filter(t => t.project_id === projectId && t.status !== "closed").length || 0;
  };

  // Filter + search + sort projects. Completed/cancelled stay hidden
  // unless the user opts into archived projects.
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let list = projects;
    if (!showArchivedProjects) {
      list = list.filter(p => p.status !== "completed" && p.status !== "cancelled");
    }
    if (statusFilter !== "all") {
      list = list.filter(p => p.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q) ||
          p.display_id.toLowerCase().includes(q)
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [projects, showArchivedProjects, statusFilter, searchQuery, sortKey, sortDir]);

  // Change status directly from the list without opening the edit sheet
  const handleInlineStatusChange = async (project: Project, status: ProjectStatus) => {
    try {
      await updateProject.mutateAsync({ id: project.id, status });
      toast.success(`${project.display_id} moved to ${status.replace("_", " ")}`);
    } catch {
      // Error toast handled by the hook
    }
  };

  // Bulk selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleBulkStatusUpdate = async (status: ProjectStatus) => {
    if (selectedProjects.size === 0) return;
    try {
      const promises = Array.from(selectedProjects).map(id =>
        updateProject.mutateAsync({ id, status })
      );
      await Promise.all(promises);
      toast.success(`Updated ${selectedProjects.size} project(s)`);
      setSelectedProjects(new Set());
    } catch {
      toast.error("Failed to update some projects");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProjects.size} project(s)? This cannot be undone.`)) return;
    try {
      const promises = Array.from(selectedProjects).map(id =>
        deleteProject.mutateAsync(id)
      );
      await Promise.all(promises);
      toast.success(`Deleted ${selectedProjects.size} project(s)`);
      setSelectedProjects(new Set());
    } catch {
      toast.error("Failed to delete some projects");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProjects.size === 0) return;
    try {
      const promises = Array.from(selectedProjects).map(id =>
        updateProject.mutateAsync({ id, status: "completed" as ProjectStatus })
      );
      await Promise.all(promises);
      toast.success(`Archived ${selectedProjects.size} project(s)`);
      setSelectedProjects(new Set());
    } catch {
      toast.error("Failed to archive some projects");
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    setNewProject({
      ...newProject,
      client: contact.name,
      clientEmail: contact.email || "",
    });
    setContactPopoverOpen(false);
    setIsAddingNewContact(false);
  };

  // Handle adding a new contact inline
  const handleAddNewContact = async () => {
    if (!newContactName.trim()) {
      toast.error("Please enter a contact name");
      return;
    }

    try {
      const newContact = await createContact.mutateAsync({
        name: newContactName.trim(),
        email: newProject.clientEmail || undefined,
      });

      setSelectedContactId(newContact.id);
      setNewProject({
        ...newProject,
        client: newContact.name,
      });
      setIsAddingNewContact(false);
      setNewContactName("");
      setContactPopoverOpen(false);
      toast.success("Contact created and selected");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedContactId(null);
      setIsAddingNewContact(false);
      setNewContactName("");
      setNewProject({
        name: "",
        description: "",
        client: "",
        clientEmail: "",
        value: "",
        budget: "",
        status: "pending",
        startDate: "",
        endDate: "",
      });
    }
  };

  // Open edit sheet with project data
  const openEditSheet = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      client_name: project.client_name,
      client_email: project.client_email || "",
      value: project.value.toString(),
      budget: project.budget.toString(),
      status: project.status,
      progress: project.progress.toString(),
      start_date: project.start_date?.split("T")[0] || "",
      end_date: project.end_date?.split("T")[0] || "",
      has_maintenance: project.has_maintenance || false,
      maintenance_amount: project.maintenance_amount?.toString() || "",
      maintenance_frequency: project.maintenance_frequency || "monthly",
      maintenance_start_date: project.maintenance_start_date?.split("T")[0] || "",
      maintenance_end_date: project.maintenance_end_date?.split("T")[0] || "",
      maintenance_notes: project.maintenance_notes || "",
    });
    setIsEditSheetOpen(true);
  };

  // One-click transition into maintenance mode: the build is done, the
  // client now pays a recurring amount and ongoing work stays billable.
  const handleEnterMaintenance = async (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await updateProject.mutateAsync({
        id: project.id,
        status: "maintenance" as ProjectStatus,
        has_maintenance: true,
        maintenance_start_date:
          project.maintenance_start_date || new Date().toISOString().split("T")[0],
      });
      toast.success(`${project.display_id} is now in maintenance mode`);
      openEditSheet(updated);
    } catch {
      // Error handled by hook
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    if (!editForm.name || !editForm.client_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateProject.mutateAsync({
        id: selectedProject.id,
        name: editForm.name,
        description: editForm.description || null,
        client_name: editForm.client_name,
        client_email: editForm.client_email || null,
        value: parseFloat(editForm.value.replace(/[$,]/g, "")) || 0,
        budget: parseFloat(editForm.budget.replace(/[$,]/g, "")) || 0,
        status: editForm.status,
        progress: parseInt(editForm.progress) || 0,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || null,
        has_maintenance: editForm.has_maintenance,
        maintenance_amount: parseFloat(editForm.maintenance_amount.replace(/[$,]/g, "")) || 0,
        maintenance_frequency: editForm.maintenance_frequency,
        maintenance_start_date: editForm.maintenance_start_date || null,
        maintenance_end_date: editForm.maintenance_end_date || null,
        maintenance_notes: editForm.maintenance_notes || null,
      });

      setIsEditSheetOpen(false);
      setSelectedProject(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast.error("Please fill in the project name");
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        name: newProject.name,
        description: newProject.description || null,
        client_name: newProject.client || null,
        client_email: newProject.clientEmail || null,
        value: parseFloat(newProject.value.replace(/[$,]/g, "")) || 0,
        budget: parseFloat(newProject.budget.replace(/[$,]/g, "")) || 0,
        status: newProject.status,
        start_date: newProject.startDate || undefined,
        end_date: newProject.endDate || null,
      });

      // Apply template workflow statuses if selected
      if (selectedTemplate && selectedTemplate !== "blank" && project) {
        const template = templates?.find(t => t.id === selectedTemplate);
        if (template?.default_statuses?.length) {
          try {
            await initializeWorkflow.mutateAsync({
              projectId: project.id,
              statuses: template.default_statuses.map((s, i) => ({
                name: s.name,
                category: s.category,
                color: s.color,
                position: i,
              })),
            });
          } catch {
            // Non-critical — project still created
          }
        }
      }

      setNewProject({
        name: "",
        description: "",
        client: "",
        clientEmail: "",
        value: "",
        budget: "",
        status: "pending",
        startDate: "",
        endDate: "",
      });
      setSelectedTemplate("blank");
      setSelectedContactId(null);
      setIsDialogOpen(false);

      if (project?.display_id) {
        navigateOrg(`/projects/${project.display_id}`);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const formatValue = (value: number) => {
    if (!canViewAmounts) return "••••••";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const d = dateString.includes("T") ? new Date(dateString) : new Date(dateString + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortableHead = ({
    label,
    sortId,
    className,
  }: {
    label: string;
    sortId: keyof Project;
    className?: string;
  }) => (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => toggleSort(sortId)}
      aria-sort={sortKey === sortId ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === sortId ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  );

  const statusSelect = (project: Project) => (
    <Select
      value={project.status}
      onValueChange={(v) => handleInlineStatusChange(project, v as ProjectStatus)}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-[130px] border-transparent px-2 text-xs font-semibold uppercase shadow-none",
          projectStatusStyles[project.status as keyof typeof projectStatusStyles] || "bg-slate-400 text-black"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {projectStatusOptions?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
        <p className="text-destructive">Failed to load projects</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Manage your consulting projects</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] hidden sm:flex">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {projectStatusOptions?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-sm border border-input overflow-hidden shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn("rounded-none h-8 px-2.5", viewMode === "table" && "bg-accent text-accent-foreground")}
              aria-label="Table view"
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("cards")}
              className={cn("rounded-none h-8 px-2.5", viewMode === "cards" && "bg-accent text-accent-foreground")}
              aria-label="Card view"
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchivedProjects(!showArchivedProjects)}
            className="border hidden md:inline-flex"
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchivedProjects ? "Hide Archived" : "Show Archived"}
          </Button>
          <Sheet open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <SheetTrigger asChild>
              <Button className="border shadow-sm hover:shadow-md transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="border-b border-border pb-4 mb-4">
              <SheetTitle>Create New Project</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {/* Template selector */}
              <div className="grid gap-2">
                <Label>Project Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    setSelectedTemplate(value);
                    if (value && value !== "blank") {
                      const template = templates?.find(t => t.id === value);
                      if (template) {
                        setNewProject(prev => ({
                          ...prev,
                          description: template.description || prev.description,
                        }));
                      }
                    }
                  }}
                >
                  <SelectTrigger className="border">
                    <SelectValue placeholder="Start from a template (optional)" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="blank">Blank Project</SelectItem>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        <span className="text-muted-foreground ml-2 text-xs">({template.category})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="border"
                />
              </div>

              {/* Contact Selection */}
              <div className="grid gap-2">
                <Label>Client Contact</Label>
                <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={contactPopoverOpen}
                      className="justify-between border w-full"
                    >
                      {selectedContactId
                        ? contacts?.find((c) => c.id === selectedContactId)?.name || newProject.client
                        : newProject.client || "Select or add a contact..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No contacts found
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => setIsAddingNewContact(true)}
                            className="cursor-pointer"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Contact
                          </CommandItem>
                        </CommandGroup>
                        {contacts && contacts.length > 0 && (
                          <>
                            <CommandSeparator />
                            <CommandGroup heading="Existing Contacts">
                              {contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={contact.name}
                                  onSelect={() => handleSelectContact(contact)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedContactId === contact.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{contact.name}</span>
                                    {contact.email && (
                                      <span className="text-xs text-muted-foreground">{contact.email}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                    {isAddingNewContact && (
                      <div className="p-3 border-t space-y-2">
                        <Input
                          placeholder="Contact name"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="border"
                          autoFocus
                        />
                        <Input
                          placeholder="Email (optional)"
                          type="email"
                          value={newProject.clientEmail}
                          onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                          className="border"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddNewContact}
                            disabled={createContact.isPending}
                            className="flex-1"
                          >
                            {createContact.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add Contact"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsAddingNewContact(false);
                              setNewContactName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Show email field if contact is selected or manually entered */}
              {(selectedContactId || newProject.client) && (
                <div className="grid gap-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={newProject.clientEmail}
                    onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                    className="border"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="value">Project Value ($)</Label>
                  <Input
                    id="value"
                    placeholder="0"
                    value={newProject.value}
                    onChange={(e) => setNewProject({ ...newProject, value: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    placeholder="0"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    className="border"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newProject.status}
                  onValueChange={(value: ProjectStatus) => setNewProject({ ...newProject, status: value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border">
                    {projectStatusOptions?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)} className="border">
                Cancel
              </Button>
              <Button onClick={handleCreateProject} className="border" disabled={createProject.isPending}>
                {createProject.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>

      {projects?.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No projects match your filters</p>
            <p className="text-sm text-muted-foreground mb-4">
              Adjust the search or status filter, or click "Show Archived" to include completed and cancelled projects
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <>
          {selectedProjects.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-md border">
              <span className="text-sm font-medium mr-2">
                {selectedProjects.size} selected
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Set Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("pending")}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("on_hold")}>
                    On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("completed")}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("cancelled")}>
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>

              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedProjects(new Set())}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
          <Card className="border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <SortableHead label="Project" sortId="name" />
                <SortableHead label="Client" sortId="client_name" className="hidden md:table-cell" />
                <SortableHead label="Status" sortId="status" />
                <SortableHead label="Progress" sortId="progress" className="hidden sm:table-cell" />
                <SortableHead label="Value" sortId="value" className="hidden lg:table-cell text-right" />
                <TableHead className="hidden xl:table-cell whitespace-nowrap">Open Tickets</TableHead>
                <SortableHead label="Start" sortId="start_date" className="hidden lg:table-cell" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className={cn("cursor-pointer", selectedProjects.has(project.id) && "bg-muted/50")}
                  onClick={() => navigateOrg(`/projects/${project.display_id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedProjects.has(project.id)}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium leading-tight">{project.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{project.display_id}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{project.client_name}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {statusSelect(project)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-1.5 w-20" />
                      <span className="text-xs font-mono w-9 text-right">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right font-mono">
                    {formatValue(project.value)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                      {getOpenTicketCount(project.id)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                    {formatDate(project.start_date)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border">
                        <DropdownMenuItem onClick={() => navigateOrg(`/projects/${project.display_id}`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => openEditSheet(project, e)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        {project.status !== "maintenance" && (
                          <DropdownMenuItem onClick={(e) => handleEnterMaintenance(project, e)}>
                            <Wrench className="h-4 w-4 mr-2" />
                            Enter Maintenance Mode
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => generateProjectPDF(project, tickets || [])}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateOrg("/tickets")}>
                          <Ticket className="h-4 w-4 mr-2" />
                          View Tickets
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteProject.mutate(project.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        </>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-border pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{project.display_id}</span>
                      {statusSelect(project)}
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 border border-transparent hover:border-border">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border">
                      <DropdownMenuItem onClick={() => navigateOrg(`/projects/${project.display_id}`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => openEditSheet(project, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      {project.status !== "maintenance" && (
                        <DropdownMenuItem onClick={(e) => handleEnterMaintenance(project, e)}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Enter Maintenance Mode
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => generateProjectPDF(project, tickets || [])}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateOrg("/tickets")}>
                        <Ticket className="h-4 w-4 mr-2" />
                        View Tickets
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteProject.mutate(project.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent
                className="pt-4 cursor-pointer"
                onClick={() => navigateOrg(`/projects/${project.display_id}`)}
              >
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.client_name}</span>
                    </div>
                    <span className="font-mono font-semibold">{formatValue(project.value)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span>{getOpenTicketCount(project.id)} open tickets</span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(project.start_date)}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Progress value={project.progress} className="h-2 flex-1" />
                    <span className="text-sm font-mono font-medium w-12 text-right">{project.progress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="border-b border-border pb-4 mb-4">
            <SheetTitle>Edit Project</SheetTitle>
          </SheetHeader>
          {selectedProject && (
            <div className="grid gap-4 py-4">
              <div className="p-3 bg-secondary rounded border border-border">
                <p className="font-mono text-xs text-muted-foreground">{selectedProject.display_id}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Project Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="border"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-client">Client Name *</Label>
                  <Input
                    id="edit-client"
                    value={editForm.client_name}
                    onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Client Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.client_email}
                    onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
                    className="border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Project Value ($)</Label>
                  <Input
                    id="edit-value"
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-budget">Budget ($)</Label>
                  <Input
                    id="edit-budget"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value: ProjectStatus) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border">
                      {projectStatusOptions?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                    className="border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="border"
                  />
                </div>
              </div>

              {/* Maintenance Section */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="edit-maintenance" className="text-base font-semibold">
                      Monthly Maintenance
                    </Label>
                  </div>
                  <Switch
                    id="edit-maintenance"
                    checked={editForm.has_maintenance}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, has_maintenance: checked })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable recurring maintenance payments for this project
                </p>

                {editForm.has_maintenance && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-maintenance-amount">Amount ($)</Label>
                        <Input
                          id="edit-maintenance-amount"
                          placeholder="500"
                          value={editForm.maintenance_amount}
                          onChange={(e) => setEditForm({ ...editForm, maintenance_amount: e.target.value })}
                          className="border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-maintenance-frequency">Frequency</Label>
                        <Select
                          value={editForm.maintenance_frequency}
                          onValueChange={(value) => setEditForm({ ...editForm, maintenance_frequency: value })}
                        >
                          <SelectTrigger className="border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border">
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-maintenance-start">Maintenance Start Date</Label>
                        <Input
                          id="edit-maintenance-start"
                          type="date"
                          value={editForm.maintenance_start_date}
                          onChange={(e) => setEditForm({ ...editForm, maintenance_start_date: e.target.value })}
                          className="border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-maintenance-end">Maintenance End Date</Label>
                        <Input
                          id="edit-maintenance-end"
                          type="date"
                          value={editForm.maintenance_end_date}
                          onChange={(e) => setEditForm({ ...editForm, maintenance_end_date: e.target.value })}
                          className="border"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-maintenance-notes">Maintenance Notes</Label>
                      <Textarea
                        id="edit-maintenance-notes"
                        placeholder="Details about what's included in maintenance..."
                        value={editForm.maintenance_notes}
                        onChange={(e) => setEditForm({ ...editForm, maintenance_notes: e.target.value })}
                        className="border"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-border pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => selectedProject && generateProjectPDF(selectedProject, tickets || [])}
              className="border"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditSheetOpen(false)} className="border">
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} className="border" disabled={updateProject.isPending}>
                {updateProject.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
