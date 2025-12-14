import { useState } from "react";
import { Plus, MoreVertical, Users, Ticket, Loader2 } from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { Database } from "@/integrations/supabase/types";
import { projectStatusStyles } from "@/lib/styles";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export default function Projects() {
  const { navigateOrg } = useOrgNavigation();
  const { data: projects, isLoading, error } = useProjects();
  const { data: tickets } = useTickets();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
    clientEmail: "",
    value: "",
    status: "pending" as ProjectStatus,
  });

  // Count open tickets per project
  const getOpenTicketCount = (projectId: string) => {
    return tickets?.filter(t => t.project_id === projectId && t.status !== "closed").length || 0;
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
        status: newProject.status,
      });

      setNewProject({
        name: "",
        description: "",
        client: "",
        clientEmail: "",
        value: "",
        status: "pending",
      });
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const formatValue = (value: number) => {
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Client Name *</Label>
                  <Input
                    id="client"
                    placeholder="Client name"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    className="border-2"
                  />
                </div>
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
              </div>
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
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
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
          </DialogContent>
        </Dialog>
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateOrg(`/projects/${project.display_id}`)}>
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateOrg("/tickets")}>
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
    </div>
  );
}
