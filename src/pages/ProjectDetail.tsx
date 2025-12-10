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
  Building,
  UserPlus,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

// Company team members (internal)
const companyTeamMembers = [
  { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Developer", avatar: "SC" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Designer", avatar: "MJ" },
  { id: "4", name: "Emma Wilson", email: "emma@company.com", role: "Developer", avatar: "EW" },
  { id: "5", name: "David Brown", email: "david@company.com", role: "QA Engineer", avatar: "DB" },
  { id: "6", name: "Lisa Park", email: "lisa@company.com", role: "Business Analyst", avatar: "LP" },
];

// Mock data - in a real app this would come from API/state management
const projectsData: Record<string, {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  tickets: number;
  client: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  internalTeam: Array<{ id: string; name: string; email: string; role: string; avatar: string }>;
  externalTeam: Array<{ id: string; name: string; email: string; role: string; company: string; avatar: string }>;
}> = {
  "PRJ-001": {
    id: "PRJ-001",
    name: "Acme Corp",
    description: "Enterprise software implementation and consulting. This project involves a complete digital transformation including CRM integration, workflow automation, and custom dashboard development.",
    status: "active",
    progress: 75,
    tickets: 12,
    client: "John Smith",
    clientEmail: "john@acmecorp.com",
    startDate: "Jan 15, 2024",
    endDate: "Apr 30, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
      { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Developer", avatar: "SC" },
      { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Designer", avatar: "MJ" },
    ],
    externalTeam: [
      { id: "e1", name: "John Smith", email: "john@acmecorp.com", role: "Product Owner", company: "Acme Corp", avatar: "JS" },
      { id: "e2", name: "Alice Wang", email: "alice@acmecorp.com", role: "Technical Lead", company: "Acme Corp", avatar: "AW" },
    ],
  },
  "PRJ-002": {
    id: "PRJ-002",
    name: "TechStart Inc",
    description: "Digital transformation strategy and execution. Helping TechStart modernize their legacy systems and adopt cloud-native technologies.",
    status: "active",
    progress: 40,
    tickets: 8,
    client: "Sarah Johnson",
    clientEmail: "sarah@techstart.io",
    startDate: "Feb 1, 2024",
    endDate: "May 15, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
      { id: "4", name: "Emma Wilson", email: "emma@company.com", role: "Developer", avatar: "EW" },
    ],
    externalTeam: [
      { id: "e1", name: "Sarah Johnson", email: "sarah@techstart.io", role: "CEO", company: "TechStart Inc", avatar: "SJ" },
    ],
  },
  "PRJ-003": {
    id: "PRJ-003",
    name: "Global Solutions",
    description: "Process optimization and automation project. Streamlining operations and implementing automated workflows.",
    status: "active",
    progress: 90,
    tickets: 5,
    client: "Mike Chen",
    clientEmail: "mike@globalsol.com",
    startDate: "Dec 10, 2023",
    endDate: "Mar 1, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
      { id: "5", name: "David Brown", email: "david@company.com", role: "QA Engineer", avatar: "DB" },
      { id: "6", name: "Lisa Park", email: "lisa@company.com", role: "Business Analyst", avatar: "LP" },
    ],
    externalTeam: [
      { id: "e1", name: "Mike Chen", email: "mike@globalsol.com", role: "Operations Director", company: "Global Solutions", avatar: "MC" },
    ],
  },
  "PRJ-004": {
    id: "PRJ-004",
    name: "DataFlow Ltd",
    description: "Data analytics platform development. Building a comprehensive analytics solution with real-time dashboards.",
    status: "pending",
    progress: 15,
    tickets: 3,
    client: "Emma Wilson",
    clientEmail: "emma@dataflow.io",
    startDate: "Mar 1, 2024",
    endDate: "Jun 30, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
    ],
    externalTeam: [
      { id: "e1", name: "Emma Davis", email: "emma@dataflow.io", role: "CTO", company: "DataFlow Ltd", avatar: "ED" },
    ],
  },
  "PRJ-005": {
    id: "PRJ-005",
    name: "CloudNine Systems",
    description: "Cloud migration and infrastructure setup. Complete migration from on-premise to cloud infrastructure.",
    status: "completed",
    progress: 100,
    tickets: 0,
    client: "David Brown",
    clientEmail: "david@cloudnine.io",
    startDate: "Nov 5, 2023",
    endDate: "Feb 15, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
      { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Developer", avatar: "SC" },
      { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Designer", avatar: "MJ" },
      { id: "4", name: "Emma Wilson", email: "emma@company.com", role: "Developer", avatar: "EW" },
    ],
    externalTeam: [
      { id: "e1", name: "David Lee", email: "david@cloudnine.io", role: "IT Director", company: "CloudNine Systems", avatar: "DL" },
      { id: "e2", name: "Rachel Kim", email: "rachel@cloudnine.io", role: "System Admin", company: "CloudNine Systems", avatar: "RK" },
    ],
  },
  "PRJ-006": {
    id: "PRJ-006",
    name: "InnovateTech",
    description: "Product development consulting. Advising on product strategy and technical architecture.",
    status: "active",
    progress: 55,
    tickets: 7,
    client: "Lisa Anderson",
    clientEmail: "lisa@innovatetech.com",
    startDate: "Jan 20, 2024",
    endDate: "Apr 20, 2024",
    internalTeam: [
      { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y" },
      { id: "5", name: "David Brown", email: "david@company.com", role: "QA Engineer", avatar: "DB" },
    ],
    externalTeam: [
      { id: "e1", name: "Lisa Anderson", email: "lisa@innovatetech.com", role: "Product Manager", company: "InnovateTech", avatar: "LA" },
    ],
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
  { id: "1", text: "Complete requirements documentation", completed: true, priority: "high", assignee: "You" },
  { id: "2", text: "Set up development environment", completed: true, priority: "medium", assignee: "Sarah Chen" },
  { id: "3", text: "Design system architecture", completed: true, priority: "high", assignee: "You" },
  { id: "4", text: "Implement user authentication", completed: false, priority: "high", assignee: "Sarah Chen" },
  { id: "5", text: "Build dashboard components", completed: false, priority: "medium", assignee: "Mike Johnson" },
  { id: "6", text: "Integrate CRM APIs", completed: false, priority: "medium", assignee: "You" },
  { id: "7", text: "Write unit tests", completed: false, priority: "low", assignee: "Emma Wilson" },
  { id: "8", text: "Client UAT session", completed: false, priority: "high", assignee: "You" },
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
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState("medium");
  const [newTodoAssignee, setNewTodoAssignee] = useState("You");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [addMemberType, setAddMemberType] = useState<"internal" | "external">("internal");
  const [newExternalMember, setNewExternalMember] = useState({
    name: "",
    email: "",
    role: "",
    company: "",
  });
  const [newInvoice, setNewInvoice] = useState({
    description: "",
    amount: "",
    dueDate: "",
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date(2024, 0)); // January 2024

  const projectData = projectsData[projectId || ""];
  const [internalTeam, setInternalTeam] = useState(projectData?.internalTeam || []);
  const [externalTeam, setExternalTeam] = useState(projectData?.externalTeam || []);

  if (!projectData) {
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

  const project = { ...projectData, internalTeam, externalTeam };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
    const todo = todos.find(t => t.id === id);
    if (todo) {
      toast.success(todo.completed ? "Task marked as incomplete" : "Task completed!");
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    const todo = {
      id: String(Date.now()),
      text: newTodo,
      completed: false,
      priority: newTodoPriority,
      assignee: newTodoAssignee,
    };
    setTodos([...todos, todo]);
    setNewTodo("");
    setNewTodoDescription("");
    setNewTodoPriority("medium");
    setNewTodoAssignee("You");
    setIsTaskDialogOpen(false);
    toast.success("Task added successfully");
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

  const addInternalMember = (member: typeof companyTeamMembers[0]) => {
    if (internalTeam.find(m => m.id === member.id)) {
      toast.error("Team member already added");
      return;
    }
    setInternalTeam([...internalTeam, member]);
    toast.success(`${member.name} added to the project`);
  };

  const removeInternalMember = (memberId: string) => {
    if (memberId === "1") {
      toast.error("Cannot remove the project lead");
      return;
    }
    setInternalTeam(internalTeam.filter(m => m.id !== memberId));
    toast.success("Team member removed");
  };

  const addExternalMember = () => {
    if (!newExternalMember.name || !newExternalMember.email) {
      toast.error("Please fill in name and email");
      return;
    }
    const member = {
      id: `e${Date.now()}`,
      name: newExternalMember.name,
      email: newExternalMember.email,
      role: newExternalMember.role || "Stakeholder",
      company: newExternalMember.company || project.name,
      avatar: newExternalMember.name.split(" ").map(n => n[0]).join("").toUpperCase(),
    };
    setExternalTeam([...externalTeam, member]);
    setNewExternalMember({ name: "", email: "", role: "", company: "" });
    setIsAddMemberDialogOpen(false);
    toast.success(`${member.name} added as external team member`);
  };

  const removeExternalMember = (memberId: string) => {
    setExternalTeam(externalTeam.filter(m => m.id !== memberId));
    toast.success("External team member removed");
  };

  // Calculate invoice totals - Project value is total invoiced
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + inv.amount, 0);

  // Project value is the total invoiced amount
  const projectValue = `$${totalInvoiced.toLocaleString()}`;

  // Total team members
  const totalTeamMembers = internalTeam.length + externalTeam.length;

  // Available company members to add (not already in project)
  const availableCompanyMembers = companyTeamMembers.filter(
    m => !internalTeam.find(t => t.id === m.id)
  );

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
  const todoProgress = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

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
                <div className="text-2xl font-bold font-mono">{projectValue}</div>
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
        <Card
          className="border-2 border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsTeamDialogOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalTeamMembers}</div>
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

      {/* Team Members Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Project Team</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Internal Team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Company Team</h4>
                  <Badge variant="secondary" className="border-2 border-border">{internalTeam.length}</Badge>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-2" onClick={() => setAddMemberType("internal")}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[400px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Add Company Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
                      {availableCompanyMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">All company members are already on this project</p>
                      ) : (
                        availableCompanyMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border-2 border-border hover:bg-accent/50 cursor-pointer"
                            onClick={() => addInternalMember(member)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-border">
                                <AvatarFallback className="bg-secondary text-xs">{member.avatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {internalTeam.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border-2 border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border-2 border-border">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role} • {member.email}</div>
                      </div>
                    </div>
                    {member.id !== "1" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                        onClick={() => removeInternalMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* External Team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Client Team ({project.name})</h4>
                  <Badge variant="secondary" className="border-2 border-border">{externalTeam.length}</Badge>
                </div>
                <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-2">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[400px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Add External Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ext-name">Name *</Label>
                        <Input
                          id="ext-name"
                          placeholder="Full name"
                          value={newExternalMember.name}
                          onChange={(e) => setNewExternalMember({ ...newExternalMember, name: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ext-email">Email *</Label>
                        <Input
                          id="ext-email"
                          type="email"
                          placeholder="email@company.com"
                          value={newExternalMember.email}
                          onChange={(e) => setNewExternalMember({ ...newExternalMember, email: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ext-role">Role</Label>
                        <Input
                          id="ext-role"
                          placeholder="e.g., Product Owner, Technical Lead"
                          value={newExternalMember.role}
                          onChange={(e) => setNewExternalMember({ ...newExternalMember, role: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ext-company">Company</Label>
                        <Input
                          id="ext-company"
                          placeholder={project.name}
                          value={newExternalMember.company}
                          onChange={(e) => setNewExternalMember({ ...newExternalMember, company: e.target.value })}
                          className="border-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={addExternalMember} className="border-2">
                        Add Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {externalTeam.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 border-2 border-dashed border-border">No external team members</p>
                ) : (
                  externalTeam.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border-2 border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-border">
                          <AvatarFallback className="bg-chart-1 text-background text-xs">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role} • {member.company}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                        onClick={() => removeExternalMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Team</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs border-2 border-transparent hover:border-border"
                        onClick={() => setIsTeamDialogOpen(true)}
                      >
                        Manage
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {internalTeam.slice(0, 3).map((member) => (
                        <Badge key={member.id} variant="secondary" className="border-2 border-border">
                          {member.name}
                        </Badge>
                      ))}
                      {internalTeam.length > 3 && (
                        <Badge variant="secondary" className="border-2 border-border">
                          +{internalTeam.length - 3} more
                        </Badge>
                      )}
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
                    <div className="text-sm text-muted-foreground">Total Invoiced (Project Value)</div>
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
                    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="border-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-2 sm:max-w-[425px]">
                        <DialogHeader className="border-b-2 border-border pb-4">
                          <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="task-title">Task Title *</Label>
                            <Input
                              id="task-title"
                              placeholder="What needs to be done?"
                              value={newTodo}
                              onChange={(e) => setNewTodo(e.target.value)}
                              className="border-2"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="task-priority">Priority</Label>
                              <Select value={newTodoPriority} onValueChange={setNewTodoPriority}>
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
                              <Label htmlFor="task-assignee">Assignee</Label>
                              <Select value={newTodoAssignee} onValueChange={setNewTodoAssignee}>
                                <SelectTrigger className="border-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-2">
                                  {internalTeam.map((member) => (
                                    <SelectItem key={member.id} value={member.name}>
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                          <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="border-2">
                            Cancel
                          </Button>
                          <Button onClick={addTodo} className="border-2">
                            Add Task
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
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
                        <div className="flex-1">
                          <span className={`${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                            {todo.text}
                          </span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Assigned to {todo.assignee}
                          </div>
                        </div>
                        <Badge className={priorityStyles[todo.priority as keyof typeof priorityStyles]}>
                          {todo.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {todos.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border">
                        No tasks yet. Add one to get started!
                      </div>
                    )}
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
