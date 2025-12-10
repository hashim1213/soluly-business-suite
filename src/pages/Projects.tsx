import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const initialProjects = [
  {
    id: "PRJ-001",
    name: "Acme Corp",
    description: "Enterprise software implementation and consulting",
    status: "active",
    progress: 75,
    tickets: 12,
    value: "$45,000",
    client: "John Smith",
    startDate: "Jan 15, 2024",
  },
  {
    id: "PRJ-002",
    name: "TechStart Inc",
    description: "Digital transformation strategy and execution",
    status: "active",
    progress: 40,
    tickets: 8,
    value: "$28,000",
    client: "Sarah Johnson",
    startDate: "Feb 1, 2024",
  },
  {
    id: "PRJ-003",
    name: "Global Solutions",
    description: "Process optimization and automation project",
    status: "active",
    progress: 90,
    tickets: 5,
    value: "$62,000",
    client: "Mike Chen",
    startDate: "Dec 10, 2023",
  },
  {
    id: "PRJ-004",
    name: "DataFlow Ltd",
    description: "Data analytics platform development",
    status: "pending",
    progress: 15,
    tickets: 3,
    value: "$35,000",
    client: "Emma Wilson",
    startDate: "Mar 1, 2024",
  },
  {
    id: "PRJ-005",
    name: "CloudNine Systems",
    description: "Cloud migration and infrastructure setup",
    status: "completed",
    progress: 100,
    tickets: 0,
    value: "$52,000",
    client: "David Brown",
    startDate: "Nov 5, 2023",
  },
  {
    id: "PRJ-006",
    name: "InnovateTech",
    description: "Product development consulting",
    status: "active",
    progress: 55,
    tickets: 7,
    value: "$38,000",
    client: "Lisa Anderson",
    startDate: "Jan 20, 2024",
  },
];

const statusStyles = {
  active: "bg-chart-2 text-background",
  pending: "bg-chart-4 text-foreground",
  completed: "bg-primary text-primary-foreground",
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(initialProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
    clientEmail: "",
    value: "",
    status: "pending",
  });

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.client) {
      toast.error("Please fill in all required fields");
      return;
    }

    const projectId = `PRJ-${String(projects.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const project = {
      id: projectId,
      name: newProject.name,
      description: newProject.description,
      status: newProject.status,
      progress: 0,
      tickets: 0,
      value: newProject.value ? `$${newProject.value.replace(/[$,]/g, "")}` : "$0",
      client: newProject.client,
      startDate: today,
    };

    setProjects([project, ...projects]);
    setNewProject({
      name: "",
      description: "",
      client: "",
      clientEmail: "",
      value: "",
      status: "pending",
    });
    setIsDialogOpen(false);
    toast.success("Project created successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your consulting projects</p>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
                    onValueChange={(value) => setNewProject({ ...newProject, status: value })}
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
              <Button onClick={handleCreateProject} className="border-2">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="border-b-2 border-border pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{project.id}</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${
                        statusStyles[project.status as keyof typeof statusStyles]
                      }`}
                    >
                      {project.status}
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
                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/tickets")}>
                      View Tickets
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent
              className="pt-4 cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.client}</span>
                  </div>
                  <span className="font-mono font-bold">{project.value}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span>{project.tickets} open tickets</span>
                  </div>
                  <span className="text-muted-foreground">{project.startDate}</span>
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
    </div>
  );
}
