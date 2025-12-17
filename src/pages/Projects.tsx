import { useState } from "react";
import { Plus, MoreVertical, Users, Ticket, Loader2, Check, ChevronsUpDown, UserPlus, Calendar, FileText, Edit, Download } from "lucide-react";
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
import { toast } from "sonner";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject, Project } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { useContacts, useCreateContact, Contact } from "@/hooks/useContacts";
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
    ["Start Date:", project.start_date ? new Date(project.start_date).toLocaleDateString() : "N/A"],
    ["End Date:", project.end_date ? new Date(project.end_date).toLocaleDateString() : "N/A"],
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
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
  });

  // Count open tickets per project
  const getOpenTicketCount = (projectId: string) => {
    return tickets?.filter(t => t.project_id === projectId && t.status !== "closed").length || 0;
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
    });
    setIsEditSheetOpen(true);
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
      });

      setIsEditSheetOpen(false);
      setSelectedProject(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.client) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProject.mutateAsync({
        name: newProject.name,
        description: newProject.description || null,
        client_name: newProject.client,
        client_email: newProject.clientEmail || null,
        value: parseFloat(newProject.value.replace(/[$,]/g, "")) || 0,
        budget: parseFloat(newProject.budget.replace(/[$,]/g, "")) || 0,
        status: newProject.status,
        start_date: newProject.startDate || undefined,
        end_date: newProject.endDate || null,
      });

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
      setSelectedContactId(null);
      setIsDialogOpen(false);
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your consulting projects</p>
        </div>
        <Sheet open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <SheetTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader className="border-b-2 border-border pb-4 mb-4">
              <SheetTitle>Create New Project</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="border-2"
                />
              </div>

              {/* Contact Selection */}
              <div className="grid gap-2">
                <Label>Client Contact *</Label>
                <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={contactPopoverOpen}
                      className="justify-between border-2 w-full"
                    >
                      {selectedContactId
                        ? contacts?.find((c) => c.id === selectedContactId)?.name || newProject.client
                        : newProject.client || "Select or add a contact..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-2" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandList>
                        <CommandEmpty>
                          {isAddingNewContact ? (
                            <div className="p-2 space-y-2">
                              <Input
                                placeholder="Enter contact name"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                                className="border-2"
                                autoFocus
                              />
                              <Input
                                placeholder="Email (optional)"
                                type="email"
                                value={newProject.clientEmail}
                                onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
                                className="border-2"
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
                          ) : (
                            <div className="p-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">No contacts found</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddingNewContact(true)}
                                className="w-full"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add New Contact
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        {contacts && contacts.length > 0 && (
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
                        )}
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => setIsAddingNewContact(true)}
                            className="cursor-pointer"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Contact
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
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
                    className="border-2"
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
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    placeholder="0"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newProject.status}
                  onValueChange={(value: ProjectStatus) => setNewProject({ ...newProject, status: value })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
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
                    className="border-2"
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
                    className="border-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateProject} className="border-2" disabled={createProject.isPending}>
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

      {projects?.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {projects?.map((project) => (
            <Card key={project.id} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b-2 border-border pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{project.display_id}</span>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${
                          projectStatusStyles[project.status as keyof typeof projectStatusStyles] || "bg-slate-400 text-black"
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 border-2 border-transparent hover:border-border">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-2">
                      <DropdownMenuItem onClick={() => navigateOrg(`/projects/${project.display_id}`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => openEditSheet(project, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
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
                    <span className="font-mono font-bold">{formatValue(project.value)}</span>
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
          <SheetHeader className="border-b-2 border-border pb-4 mb-4">
            <SheetTitle>Edit Project</SheetTitle>
          </SheetHeader>
          {selectedProject && (
            <div className="grid gap-4 py-4">
              <div className="p-3 bg-secondary rounded border-2 border-border">
                <p className="font-mono text-xs text-muted-foreground">{selectedProject.display_id}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Project Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border-2"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="border-2"
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
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Client Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.client_email}
                    onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
                    className="border-2"
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
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-budget">Budget ($)</Label>
                  <Input
                    id="edit-budget"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="border-2"
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
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    className="border-2"
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
                    className="border-2"
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
                    className="border-2"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t-2 border-border pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => selectedProject && generateProjectPDF(selectedProject, tickets || [])}
              className="border-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditSheetOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} className="border-2" disabled={updateProject.isPending}>
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
