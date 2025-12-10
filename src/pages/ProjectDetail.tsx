import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Ticket,
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  MoreVertical,
  Plus,
  FileText,
  CheckSquare,
  Clock,
  Send,
  Check,
  AlertCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

const initialInvoices = [
  { id: "INV-001", description: "Initial deposit - 30%", amount: 13500, status: "paid", dueDate: "Jan 20, 2024", paidDate: "Jan 18, 2024" },
  { id: "INV-002", description: "Milestone 1 - Discovery phase", amount: 9000, status: "paid", dueDate: "Feb 15, 2024", paidDate: "Feb 14, 2024" },
  { id: "INV-003", description: "Milestone 2 - Development phase", amount: 13500, status: "sent", dueDate: "Mar 15, 2024", paidDate: null },
  { id: "INV-004", description: "Final payment - Project completion", amount: 9000, status: "draft", dueDate: "Apr 30, 2024", paidDate: null },
];

const initialTodos = [
  { id: "1", text: "Complete requirements documentation", completed: true, priority: "high" },
  { id: "2", text: "Set up development environment", completed: true, priority: "medium" },
  { id: "3", text: "Design system architecture", completed: true, priority: "high" },
  { id: "4", text: "Implement user authentication", completed: false, priority: "high" },
  { id: "5", text: "Build dashboard components", completed: false, priority: "medium" },
  { id: "6", text: "Integrate CRM APIs", completed: false, priority: "medium" },
  { id: "7", text: "Write unit tests", completed: false, priority: "low" },
  { id: "8", text: "Client UAT session", completed: false, priority: "high" },
];

const timelineEvents = [
  { id: "1", date: "Jan 15, 2024", title: "Project Kickoff", description: "Initial meeting with stakeholders", type: "milestone", completed: true },
  { id: "2", date: "Jan 22, 2024", title: "Discovery Phase Complete", description: "Requirements gathered and documented", type: "milestone", completed: true },
  { id: "3", date: "Feb 5, 2024", title: "Design Approval", description: "UI/UX designs approved by client", type: "milestone", completed: true },
  { id: "4", date: "Feb 20, 2024", title: "Development Sprint 1", description: "Core functionality implemented", type: "milestone", completed: true },
  { id: "5", date: "Mar 10, 2024", title: "Development Sprint 2", description: "Integration features", type: "milestone", completed: false },
  { id: "6", date: "Mar 25, 2024", title: "Testing Phase", description: "QA and bug fixes", type: "milestone", completed: false },
  { id: "7", date: "Apr 15, 2024", title: "UAT", description: "User acceptance testing", type: "milestone", completed: false },
  { id: "8", date: "Apr 30, 2024", title: "Go Live", description: "Production deployment", type: "milestone", completed: false },
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

const invoiceStatusStyles = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-chart-1 text-background",
  paid: "bg-chart-2 text-background",
  overdue: "bg-destructive text-destructive-foreground",
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [todos, setTodos] = useState(initialTodos);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [newTodo, setNewTodo] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState("medium");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    description: "",
    amount: "",
    dueDate: "",
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date(2024, 0)); // January 2024

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

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = {
      id: String(todos.length + 1),
      text: newTodo,
      completed: false,
      priority: newTodoPriority,
    };
    setTodos([...todos, todo]);
    setNewTodo("");
    toast.success("Task added");
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    toast.success("Task removed");
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.description || !newInvoice.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      description: newInvoice.description,
      amount: parseInt(newInvoice.amount),
      status: "draft",
      dueDate: newInvoice.dueDate || "TBD",
      paidDate: null,
    };

    setInvoices([...invoices, invoice]);
    setNewInvoice({ description: "", amount: "", dueDate: "" });
    setIsInvoiceDialogOpen(false);
    toast.success("Invoice created");
  };

  const sendInvoice = (invoiceId: string) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: "sent" } : inv
    ));
    toast.success("Invoice sent to client");
  };

  const markInvoicePaid = (invoiceId: string) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: "paid", paidDate: today } : inv
    ));
    toast.success("Invoice marked as paid");
  };

  // Calculate invoice totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + inv.amount, 0);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  const isDateInProjectRange = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const startParts = project.startDate.split(" ");
    const endParts = project.endDate.split(" ");
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const startDate = new Date(parseInt(startParts[2]), months[startParts[0]], parseInt(startParts[1].replace(",", "")));
    const endDate = new Date(parseInt(endParts[2]), months[endParts[0]], parseInt(endParts[1].replace(",", "")));
    return checkDate >= startDate && checkDate <= endDate;
  };

  const hasMilestone = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return timelineEvents.some(event => {
      const parts = event.date.split(" ");
      const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      const eventDate = new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1].replace(",", "")));
      return eventDate.getTime() === checkDate.getTime();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const inRange = isDateInProjectRange(day);
      const milestone = hasMilestone(day);
      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center text-sm relative ${
            inRange ? "bg-chart-2/20 font-medium" : ""
          } ${milestone ? "ring-2 ring-primary" : ""}`}
        >
          {day}
          {milestone && (
            <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
          )}
        </div>
      );
    }

    return days;
  };

  const completedTodos = todos.filter(t => t.completed).length;
  const todoProgress = Math.round((completedTodos / todos.length) * 100);

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
                <CalendarIcon className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="border-2 border-border p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4 mr-1" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CheckSquare className="h-4 w-4 mr-1" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">${totalInvoiced.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Invoiced</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                    <Check className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">${totalPaid.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Paid</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                    <AlertCircle className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">${totalOutstanding.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Outstanding</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="border-2">
                      <Plus className="h-4 w-4 mr-2" />
                      New Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[425px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="inv-desc">Description *</Label>
                        <Input
                          id="inv-desc"
                          placeholder="Invoice description"
                          value={newInvoice.description}
                          onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="inv-amount">Amount ($) *</Label>
                          <Input
                            id="inv-amount"
                            type="number"
                            placeholder="0"
                            value={newInvoice.amount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                            className="border-2"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="inv-due">Due Date</Label>
                          <Input
                            id="inv-due"
                            type="date"
                            value={newInvoice.dueDate}
                            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                            className="border-2"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateInvoice} className="border-2">
                        Create Invoice
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Invoice</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Due Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Paid Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-b-2">
                      <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                      <TableCell className="font-medium">{invoice.description}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusStyles[invoice.status as keyof typeof invoiceStatusStyles]}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invoice.paidDate || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 border-2 border-transparent hover:border-border"
                              onClick={() => sendInvoice(invoice.id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {invoice.status === "sent" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 border-2 border-transparent hover:border-border"
                              onClick={() => markInvoicePaid(invoice.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="todos" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-2 border-border shadow-sm">
                <CardHeader className="border-b-2 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Project Tasks</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {completedTodos} of {todos.length} tasks completed
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add a new task..."
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTodo()}
                      className="border-2"
                    />
                    <Select value={newTodoPriority} onValueChange={setNewTodoPriority}>
                      <SelectTrigger className="w-32 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2">
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addTodo} className="border-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`flex items-center gap-3 p-3 border-2 border-border ${
                          todo.completed ? "bg-muted/50" : "bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className="border-2"
                        />
                        <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                          {todo.text}
                        </span>
                        <Badge className={priorityStyles[todo.priority as keyof typeof priorityStyles]}>
                          {todo.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-2 border-border shadow-sm">
                <CardHeader className="border-b-2 border-border">
                  <CardTitle>Task Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span className="font-mono font-bold">{todoProgress}%</span>
                      </div>
                      <Progress value={todoProgress} className="h-3" />
                    </div>
                    <div className="border-t-2 border-border pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Tasks</span>
                        <span className="font-bold">{todos.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-bold text-chart-2">{completedTodos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-bold">{todos.length - completedTodos}</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-border pt-4 space-y-3">
                      <div className="text-sm font-medium">By Priority</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-destructive">High</span>
                        <span className="font-bold">{todos.filter(t => t.priority === "high" && !t.completed).length} remaining</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-chart-4">Medium</span>
                        <span className="font-bold">{todos.filter(t => t.priority === "medium" && !t.completed).length} remaining</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Low</span>
                        <span className="font-bold">{todos.filter(t => t.priority === "low" && !t.completed).length} remaining</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-6">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 pl-10">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          event.completed
                            ? "bg-chart-2 border-chart-2"
                            : "bg-background border-border"
                        }`}
                      >
                        {event.completed ? (
                          <Check className="h-3 w-3 text-background" />
                        ) : (
                          <Circle className="h-2 w-2 text-muted-foreground" />
                        )}
                      </div>

                      <div className={`flex-1 pb-6 ${index === timelineEvents.length - 1 ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">{event.date}</span>
                          {event.completed && (
                            <Badge className="bg-chart-2 text-background">Completed</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Project Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth} className="border-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[140px] text-center">
                    {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextMonth} className="border-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="h-10 flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 border-2 border-border">
                {renderCalendar()}
              </div>

              <div className="flex items-center gap-6 mt-4 pt-4 border-t-2 border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-chart-2/20" />
                  <span className="text-sm text-muted-foreground">Project Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-primary" />
                  <span className="text-sm text-muted-foreground">Milestone</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">Project Duration</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div className="font-medium">{project.startDate}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">End Date</div>
                    <div className="font-medium">{project.endDate}</div>
                  </div>
                </div>
                <Progress value={project.progress} className="h-3" />
                <div className="text-sm text-muted-foreground text-right">{project.progress}% complete</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
