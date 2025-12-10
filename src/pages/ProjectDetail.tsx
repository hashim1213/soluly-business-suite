import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Ticket, Users, Calendar, DollarSign, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - in a real app this would come from API/state management
const projectsData: Record<string, {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  tickets: number;
  value: string;
  client: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  team: string[];
}> = {
  "PRJ-001": {
    id: "PRJ-001",
    name: "Acme Corp",
    description: "Enterprise software implementation and consulting. This project involves a complete digital transformation including CRM integration, workflow automation, and custom dashboard development.",
    status: "active",
    progress: 75,
    tickets: 12,
    value: "$45,000",
    client: "John Smith",
    clientEmail: "john@acmecorp.com",
    startDate: "Jan 15, 2024",
    endDate: "Apr 30, 2024",
    team: ["You", "Sarah", "Mike"],
  },
  "PRJ-002": {
    id: "PRJ-002",
    name: "TechStart Inc",
    description: "Digital transformation strategy and execution. Helping TechStart modernize their legacy systems and adopt cloud-native technologies.",
    status: "active",
    progress: 40,
    tickets: 8,
    value: "$28,000",
    client: "Sarah Johnson",
    clientEmail: "sarah@techstart.io",
    startDate: "Feb 1, 2024",
    endDate: "May 15, 2024",
    team: ["You", "Emma"],
  },
  "PRJ-003": {
    id: "PRJ-003",
    name: "Global Solutions",
    description: "Process optimization and automation project. Streamlining operations and implementing automated workflows.",
    status: "active",
    progress: 90,
    tickets: 5,
    value: "$62,000",
    client: "Mike Chen",
    clientEmail: "mike@globalsol.com",
    startDate: "Dec 10, 2023",
    endDate: "Mar 1, 2024",
    team: ["You", "David", "Lisa"],
  },
  "PRJ-004": {
    id: "PRJ-004",
    name: "DataFlow Ltd",
    description: "Data analytics platform development. Building a comprehensive analytics solution with real-time dashboards.",
    status: "pending",
    progress: 15,
    tickets: 3,
    value: "$35,000",
    client: "Emma Wilson",
    clientEmail: "emma@dataflow.io",
    startDate: "Mar 1, 2024",
    endDate: "Jun 30, 2024",
    team: ["You"],
  },
  "PRJ-005": {
    id: "PRJ-005",
    name: "CloudNine Systems",
    description: "Cloud migration and infrastructure setup. Complete migration from on-premise to cloud infrastructure.",
    status: "completed",
    progress: 100,
    tickets: 0,
    value: "$52,000",
    client: "David Brown",
    clientEmail: "david@cloudnine.io",
    startDate: "Nov 5, 2023",
    endDate: "Feb 15, 2024",
    team: ["You", "Sarah", "Mike", "Emma"],
  },
  "PRJ-006": {
    id: "PRJ-006",
    name: "InnovateTech",
    description: "Product development consulting. Advising on product strategy and technical architecture.",
    status: "active",
    progress: 55,
    tickets: 7,
    value: "$38,000",
    client: "Lisa Anderson",
    clientEmail: "lisa@innovatetech.com",
    startDate: "Jan 20, 2024",
    endDate: "Apr 20, 2024",
    team: ["You", "David"],
  },
};

const projectTickets = [
  { id: "TKT-001", title: "Add export functionality to reports", priority: "high", status: "open", created: "Dec 8, 2024" },
  { id: "TKT-004", title: "Integration with Salesforce CRM", priority: "low", status: "open", created: "Dec 7, 2024" },
  { id: "TKT-008", title: "Extended support package quote", priority: "high", status: "in-progress", created: "Dec 3, 2024" },
];

const statusStyles = {
  active: "bg-chart-2 text-background",
  pending: "bg-chart-4 text-foreground",
  completed: "bg-primary text-primary-foreground",
};

const priorityStyles = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-chart-4 text-foreground",
  low: "bg-secondary text-secondary-foreground border-2 border-border",
};

const ticketStatusStyles = {
  open: "bg-chart-1 text-background",
  "in-progress": "bg-chart-2 text-background",
  pending: "bg-chart-4 text-foreground",
  closed: "bg-muted text-muted-foreground",
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const project = projectsData[projectId || ""];

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/projects")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/projects")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{project.id}</span>
            <Badge className={statusStyles[project.status as keyof typeof statusStyles]}>
              {project.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2">
              <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
              <DropdownMenuItem>Export Data</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{project.value}</div>
                <div className="text-sm text-muted-foreground">Project Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{project.tickets}</div>
                <div className="text-sm text-muted-foreground">Open Tickets</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{project.team.length}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Calendar className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Project Tickets</CardTitle>
                <Link to="/tickets">
                  <Button size="sm" className="border-2">
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Title</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Priority</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="border-b-2 cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={priorityStyles[ticket.priority as keyof typeof priorityStyles]}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles]}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ticket.created}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Client</div>
                <div className="font-medium">{project.client}</div>
                <div className="text-sm text-muted-foreground">{project.clientEmail}</div>
              </div>
              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Timeline</div>
                <div className="font-medium">{project.startDate} - {project.endDate}</div>
              </div>
              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Team</div>
                <div className="flex flex-wrap gap-2">
                  {project.team.map((member) => (
                    <Badge key={member} variant="secondary" className="border-2 border-border">
                      {member}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-2">Progress</div>
                <Progress value={project.progress} className="h-3" />
                <div className="text-right font-mono text-sm mt-1">{project.progress}%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
