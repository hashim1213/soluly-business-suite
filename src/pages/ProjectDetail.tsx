import { useParams, Link } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HiddenAmount } from "@/components/HiddenAmount";
import { useProjectByDisplayId, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useTicketsByProject, TicketWithProject } from "@/hooks/useTickets";
import { useProjectTeamMembers, useAddProjectTeamMember, useRemoveProjectTeamMember } from "@/hooks/useProjectTeamMembers";
import { useTeamMembersWithProjects } from "@/hooks/useTeamMembers";
import { useTimeEntriesByProject, useCreateTimeEntry, useDeleteTimeEntry } from "@/hooks/useTimeEntries";
import { useProjectInvoices, useCreateProjectInvoice, useUpdateProjectInvoice, useDeleteProjectInvoice, INVOICE_STATUSES, ProjectInvoice } from "@/hooks/useProjectInvoices";
import { useProjectTasks, useCreateProjectTask, useUpdateProjectTask, useToggleProjectTask, useDeleteProjectTask } from "@/hooks/useProjectTasks";
import { useProjectMilestones, useCreateProjectMilestone, useUpdateProjectMilestone, useToggleProjectMilestone, useDeleteProjectMilestone } from "@/hooks/useProjectMilestones";
import { useProjectCosts, useCreateProjectCost, useUpdateProjectCost, useDeleteProjectCost, COST_CATEGORIES } from "@/hooks/useProjectCosts";
import { useProjectContracts, useCreateProjectContract, useUpdateProjectContract, useDeleteProjectContract } from "@/hooks/useProjectContracts";
import { useProjectExternalMembers, useAddProjectExternalMember, useRemoveProjectExternalMember, useCreateContactAndAddToProject } from "@/hooks/useProjectExternalMembers";
import { useContacts } from "@/hooks/useContacts";
import { ProjectAccessManager } from "@/components/projects/ProjectAccessManager";
import { formatDistanceToNow, format } from "date-fns";
import { Loader2, Save } from "lucide-react";
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
  Upload,
  Download,
  FileSignature,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Pencil,
  Timer,
  Briefcase,
  ExternalLink,
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
import {
  projectStatusStyles,
  ticketStatusStyles,
  ticketPriorityStyles,
  milestoneStatusStyles,
  invoiceStatusStyles,
  documentTypeStyles,
  documentStatusStyles,
  costCategoryStyles,
  contractTypeStyles,
} from "@/lib/styles";

// Company team members (internal) with salary and hours tracking
const companyTeamMembers = [
  { id: "1", name: "You", email: "you@company.com", role: "Project Lead", avatar: "Y", hourlyRate: 150, salary: 120000, hoursWorked: 160, totalPaid: 24000, contractType: "Full-time" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Developer", avatar: "SC", hourlyRate: 95, salary: 95000, hoursWorked: 120, totalPaid: 11400, contractType: "Full-time" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "Designer", avatar: "MJ", hourlyRate: 85, salary: 0, hoursWorked: 80, totalPaid: 6800, contractType: "Contractor" },
  { id: "4", name: "Emma Wilson", email: "emma@company.com", role: "Developer", avatar: "EW", hourlyRate: 90, salary: 90000, hoursWorked: 60, totalPaid: 5400, contractType: "Full-time" },
  { id: "5", name: "David Brown", email: "david@company.com", role: "QA Engineer", avatar: "DB", hourlyRate: 75, salary: 75000, hoursWorked: 40, totalPaid: 3000, contractType: "Full-time" },
  { id: "6", name: "Lisa Park", email: "lisa@company.com", role: "Business Analyst", avatar: "LP", hourlyRate: 80, salary: 80000, hoursWorked: 30, totalPaid: 2400, contractType: "Full-time" },
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

// projectTickets is now fetched from the database using useTicketsByProject hook


const priorityStyles = {
  high: "bg-red-600 text-white",
  medium: "bg-amber-500 text-black",
  low: "bg-slate-300 text-black border border-slate-400",
};

const contractTypeLabels = {
  nda: "NDA",
  service: "Service Agreement",
  employee: "Employee Contract",
  contractor: "Contractor Agreement",
};

const costCategoryLabels = {
  labor: "Labor",
  infrastructure: "Infrastructure",
  software: "Software",
  external: "External Services",
  other: "Other",
};

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { navigateOrg, getOrgPath } = useOrgNavigation();
  const { canViewAmounts } = useAuth();

  // Form state
  const [newTodo, setNewTodo] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState("medium");
  const [newTodoAssignee, setNewTodoAssignee] = useState("");
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
    invoiceNumber: "",
    notes: "",
    status: "draft" as "draft" | "sent" | "paid" | "overdue",
  });
  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    paidDate: string;
    invoiceNumber: string;
    notes: string;
    status: "draft" | "sent" | "paid" | "overdue";
    fileUrl: string;
    fileName: string;
  } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    name: "",
    type: "nda",
  });
  const [newCost, setNewCost] = useState({
    description: "",
    category: "infrastructure",
    amount: "",
    recurring: false,
    date: new Date().toISOString().split("T")[0],
  });
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [isEditMilestoneDialogOpen, setIsEditMilestoneDialogOpen] = useState(false);
  const [isCalendarDetailOpen, setIsCalendarDetailOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [isTimeEntryDialogOpen, setIsTimeEntryDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{
    id: string;
    title: string;
    description: string | null;
    due_date: string;
    completed: boolean;
  } | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [newTimeEntry, setNewTimeEntry] = useState({
    memberId: "",
    hours: "",
    description: "",
    billable: true,
  });
  const [newTodoDueDate, setNewTodoDueDate] = useState("");

  // Fetch the database project by display_id
  const { data: dbProject, isLoading: projectLoading } = useProjectByDisplayId(projectId);

  // Fetch tickets for this project from the database
  const { data: projectTickets, isLoading: ticketsLoading } = useTicketsByProject(dbProject?.id);

  // Fetch project team members from database
  const { data: projectTeamMembers, isLoading: teamLoading } = useProjectTeamMembers(dbProject?.id);

  // Fetch all team members for adding new members
  const { data: allTeamMembers } = useTeamMembersWithProjects();

  // Fetch time entries for this project
  const { data: dbTimeEntries, isLoading: timeEntriesLoading } = useTimeEntriesByProject(dbProject?.id);

  // Fetch project invoices, tasks, milestones, costs, contracts from database
  const { data: invoices, isLoading: invoicesLoading } = useProjectInvoices(dbProject?.id);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(dbProject?.id);
  const { data: milestones, isLoading: milestonesLoading } = useProjectMilestones(dbProject?.id);
  const { data: costs, isLoading: costsLoading } = useProjectCosts(dbProject?.id);
  const { data: contracts, isLoading: contractsLoading } = useProjectContracts(dbProject?.id);

  // Hooks for updating/deleting projects
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // Hooks for team management
  const addProjectTeamMember = useAddProjectTeamMember();
  const removeProjectTeamMember = useRemoveProjectTeamMember();

  // Hooks for time entries
  const createTimeEntry = useCreateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();

  // Hooks for project invoices
  const createInvoice = useCreateProjectInvoice();
  const updateInvoice = useUpdateProjectInvoice();
  const deleteInvoice = useDeleteProjectInvoice();

  // Hooks for project tasks
  const createTask = useCreateProjectTask();
  const updateTask = useUpdateProjectTask();
  const toggleTask = useToggleProjectTask();
  const deleteTask = useDeleteProjectTask();

  // Hooks for project milestones
  const createMilestone = useCreateProjectMilestone();
  const updateMilestone = useUpdateProjectMilestone();
  const toggleMilestone = useToggleProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();

  // Hooks for project costs
  const createCost = useCreateProjectCost();
  const updateCost = useUpdateProjectCost();
  const deleteCost = useDeleteProjectCost();

  // Hooks for project contracts
  const createContract = useCreateProjectContract();
  const updateContract = useUpdateProjectContract();
  const deleteContract = useDeleteProjectContract();

  // Hooks for external members
  const { data: externalMembers } = useProjectExternalMembers(dbProject?.id);
  const addExternalMemberMutation = useAddProjectExternalMember();
  const removeExternalMemberMutation = useRemoveProjectExternalMember();
  const createContactAndAdd = useCreateContactAndAddToProject();

  // Fetch all contacts for selection
  const { data: allContacts } = useContacts();

  // Edit project state
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editProjectData, setEditProjectData] = useState<{
    name: string;
    description: string;
    status: string;
    progress: number;
    value: number;
    budget: number;
    client_name: string;
    client_email: string;
    start_date: string;
  } | null>(null);

  const projectData = projectsData[projectId || ""];

  // Map external members from database to UI format
  const externalTeam = useMemo(() => {
    if (!externalMembers) return [];
    return externalMembers.map(em => ({
      id: em.id,
      contactId: em.contact_id,
      name: em.contact?.name || "Unknown",
      email: em.contact?.email || "",
      role: em.role || em.contact?.job_title || "Stakeholder",
      company: em.contact?.company?.name || "",
      avatar: em.contact?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "??",
    }));
  }, [externalMembers]);

  // Available contacts to add (not already on project)
  const availableContacts = useMemo(() => {
    if (!allContacts || !externalMembers) return allContacts || [];
    const assignedContactIds = new Set(externalMembers.map(em => em.contact_id));
    return allContacts.filter(c => !assignedContactIds.has(c.id));
  }, [allContacts, externalMembers]);

  // State for external member dialog
  const [externalMemberMode, setExternalMemberMode] = useState<"select" | "create">("select");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedContactRole, setSelectedContactRole] = useState<string>("");

  // Map database team members to the format used in the UI
  const internalTeam = useMemo(() => {
    if (!projectTeamMembers) return [];
    return projectTeamMembers.map(ptm => ({
      id: ptm.team_member_id,
      name: ptm.team_member?.name || "Unknown",
      email: ptm.team_member?.email || "",
      role: ptm.team_member?.role || "Team Member",
      avatar: ptm.team_member?.avatar || ptm.team_member?.name?.slice(0, 2).toUpperCase() || "??",
      hourlyRate: ptm.team_member?.hourly_rate || 0,
      salary: ptm.team_member?.salary || 0,
      hoursWorked: ptm.hours_logged,
      contractType: ptm.team_member?.contract_type || "Full-time",
    }));
  }, [projectTeamMembers]);

  // Available team members to add (not already on project)
  const availableTeamMembers = useMemo(() => {
    if (!allTeamMembers || !projectTeamMembers) return [];
    const assignedIds = new Set(projectTeamMembers.map(ptm => ptm.team_member_id));
    return allTeamMembers.filter(tm => !assignedIds.has(tm.id) && tm.status === "active");
  }, [allTeamMembers, projectTeamMembers]);

  // Calculate labor costs from database time entries (moved before early returns)
  const laborCosts = useMemo(() => {
    if (!dbTimeEntries) return 0;
    return dbTimeEntries.reduce((sum, entry) => {
      const hourlyRate = entry.team_member?.hourly_rate || 0;
      return sum + (entry.hours * hourlyRate);
    }, 0);
  }, [dbTimeEntries]);

  // Calculate total hours and billable amount from database (moved before early returns)
  const totalHours = useMemo(() => {
    if (!dbTimeEntries) return 0;
    return dbTimeEntries.reduce((sum, e) => sum + e.hours, 0);
  }, [dbTimeEntries]);

  const billableHours = useMemo(() => {
    if (!dbTimeEntries) return 0;
    return dbTimeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);
  }, [dbTimeEntries]);

  // Calculate hours by team member using database (moved before early returns)
  const hoursByMember = useMemo(() => {
    return internalTeam.map(member => {
      return {
        ...member,
        hoursOnProject: member.hoursWorked,
        totalPaid: member.hoursWorked * member.hourlyRate,
      };
    });
  }, [internalTeam]);

  // Show loading state while fetching from database
  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/projects")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show not found if no database project exists
  if (!dbProject) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/projects")} className="border-2 border-transparent hover:border-border">
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

  // Use database project as the source of truth, with mock data as fallback for UI elements not yet in DB
  const project = {
    id: dbProject.display_id,
    name: dbProject.name,
    description: dbProject.description || "",
    status: dbProject.status,
    progress: dbProject.progress,
    tickets: projectTickets?.length || 0,
    client: dbProject.client_name,
    clientEmail: dbProject.client_email || "",
    startDate: dbProject.start_date || "",
    endDate: "",
    internalTeam,
    externalTeam,
  };

  const toggleTodo = async (id: string, currentCompleted: boolean) => {
    try {
      await toggleTask.mutateAsync({ id, completed: !currentCompleted });
    } catch (error) {
      // Error handled by hook
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !dbProject) {
      toast.error("Please enter a task title");
      return;
    }
    try {
      await createTask.mutateAsync({
        project_id: dbProject.id,
        title: newTodo,
        priority: newTodoPriority as "high" | "medium" | "low",
        assignee_id: newTodoAssignee || undefined,
        due_date: newTodoDueDate || undefined,
      });
      setNewTodo("");
      setNewTodoDescription("");
      setNewTodoPriority("medium");
      setNewTodoAssignee("");
      setNewTodoDueDate("");
      setIsTaskDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.description || !newInvoice.amount || !dbProject) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createInvoice.mutateAsync({
        project_id: dbProject.id,
        description: newInvoice.description,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.dueDate || undefined,
        invoice_number: newInvoice.invoiceNumber || undefined,
        notes: newInvoice.notes || undefined,
        status: newInvoice.status,
      });
      setNewInvoice({ description: "", amount: "", dueDate: "", invoiceNumber: "", notes: "", status: "draft" });
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditInvoice = (invoice: ProjectInvoice) => {
    setEditingInvoice({
      id: invoice.id,
      description: invoice.description,
      amount: invoice.amount,
      dueDate: invoice.due_date || "",
      paidDate: invoice.paid_date || "",
      invoiceNumber: invoice.invoice_number || "",
      notes: invoice.notes || "",
      status: invoice.status,
      fileUrl: invoice.file_url || "",
      fileName: invoice.file_name || "",
    });
    setIsEditInvoiceDialogOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    try {
      await updateInvoice.mutateAsync({
        id: editingInvoice.id,
        description: editingInvoice.description,
        amount: editingInvoice.amount,
        due_date: editingInvoice.dueDate || undefined,
        paid_date: editingInvoice.paidDate || undefined,
        invoice_number: editingInvoice.invoiceNumber || undefined,
        notes: editingInvoice.notes || undefined,
        status: editingInvoice.status,
        file_url: editingInvoice.fileUrl || undefined,
        file_name: editingInvoice.fileName || undefined,
      });
      setEditingInvoice(null);
      setIsEditInvoiceDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteInvoice.mutateAsync(invoiceId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        status: "sent",
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const markInvoicePaid = async (invoiceId: string) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const addInternalMember = async (member: { id: string; name: string }) => {
    if (!dbProject) return;
    try {
      await addProjectTeamMember.mutateAsync({
        projectId: dbProject.id,
        teamMemberId: member.id,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const removeInternalMember = async (memberId: string) => {
    if (!dbProject) return;
    try {
      await removeProjectTeamMember.mutateAsync({
        projectId: dbProject.id,
        teamMemberId: memberId,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Edit project handlers
  const handleStartEditProject = () => {
    if (!dbProject) return;
    setEditProjectData({
      name: dbProject.name,
      description: dbProject.description || "",
      status: dbProject.status,
      progress: dbProject.progress,
      value: dbProject.value,
      budget: dbProject.budget || 0,
      client_name: dbProject.client_name,
      client_email: dbProject.client_email || "",
      start_date: dbProject.start_date ? dbProject.start_date.split("T")[0] : "",
    });
    setIsEditProjectDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!dbProject || !editProjectData) return;
    try {
      await updateProject.mutateAsync({
        id: dbProject.id,
        name: editProjectData.name,
        description: editProjectData.description || null,
        status: editProjectData.status as "active" | "pending" | "completed",
        progress: editProjectData.progress,
        value: editProjectData.value,
        budget: editProjectData.budget,
        client_name: editProjectData.client_name,
        client_email: editProjectData.client_email || null,
        start_date: editProjectData.start_date || null,
      });
      toast.success("Project updated successfully");
      setIsEditProjectDialogOpen(false);
      setEditProjectData(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteProject = async () => {
    if (!dbProject) return;
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await deleteProject.mutateAsync(dbProject.id);
      toast.success("Project deleted");
      navigateOrg("/projects");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddExternalFromContact = async () => {
    if (!selectedContactId || !dbProject) {
      toast.error("Please select a contact");
      return;
    }
    try {
      await addExternalMemberMutation.mutateAsync({
        project_id: dbProject.id,
        contact_id: selectedContactId,
        role: selectedContactRole || undefined,
      });
      setSelectedContactId("");
      setSelectedContactRole("");
      setIsAddMemberDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddExternalNewContact = async () => {
    if (!newExternalMember.name || !dbProject) {
      toast.error("Please enter at least a name");
      return;
    }
    try {
      await createContactAndAdd.mutateAsync({
        project_id: dbProject.id,
        name: newExternalMember.name,
        email: newExternalMember.email || undefined,
        job_title: newExternalMember.role || undefined,
        // company_id could be added if we implement company selection
      });
      setNewExternalMember({ name: "", email: "", role: "", company: "" });
      setExternalMemberMode("select");
      setIsAddMemberDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveExternalMember = async (memberId: string) => {
    try {
      await removeExternalMemberMutation.mutateAsync(memberId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUploadContract = async () => {
    if (!newContract.name || !dbProject) {
      toast.error("Please enter a contract name");
      return;
    }

    try {
      await createContract.mutateAsync({
        project_id: dbProject.id,
        name: newContract.name,
        type: newContract.type,
        status: "pending",
      });
      setNewContract({ name: "", type: "nda" });
      setIsContractDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await deleteContract.mutateAsync(contractId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.amount || !dbProject) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCost.mutateAsync({
        project_id: dbProject.id,
        description: newCost.description,
        category: newCost.category,
        amount: parseFloat(newCost.amount),
        date: newCost.date || new Date().toISOString().split("T")[0],
        recurring: newCost.recurring,
      });
      setNewCost({ description: "", category: "infrastructure", amount: "", recurring: false, date: new Date().toISOString().split("T")[0] });
      setIsCostDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      await deleteCost.mutateAsync(costId);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Milestone functions
  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.date || !dbProject) {
      toast.error("Please fill in title and date");
      return;
    }
    try {
      await createMilestone.mutateAsync({
        project_id: dbProject.id,
        title: newMilestone.title,
        description: newMilestone.description || undefined,
        due_date: newMilestone.date,
      });
      setNewMilestone({ title: "", description: "", date: "" });
      setIsMilestoneDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;
    try {
      await updateMilestone.mutateAsync({
        id: editingMilestone.id,
        title: editingMilestone.title,
        description: editingMilestone.description || undefined,
        due_date: editingMilestone.due_date,
      });
      setEditingMilestone(null);
      setIsEditMilestoneDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await deleteMilestone.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleMilestoneComplete = async (id: string, currentCompleted: boolean) => {
    try {
      await toggleMilestone.mutateAsync({ id, completed: !currentCompleted });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Time entry functions
  const addTimeEntry = async () => {
    if (!dbProject || !newTimeEntry.memberId || !newTimeEntry.hours) {
      toast.error("Please select a team member and enter hours");
      return;
    }

    const hoursValue = parseFloat(newTimeEntry.hours);
    if (isNaN(hoursValue) || hoursValue <= 0 || hoursValue > 24) {
      toast.error("Hours must be between 0.01 and 24");
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        team_member_id: newTimeEntry.memberId,
        project_id: dbProject.id,
        date: new Date().toISOString().split("T")[0],
        hours: hoursValue,
        description: newTimeEntry.description || null,
        billable: newTimeEntry.billable,
      });
      setNewTimeEntry({ memberId: "", hours: "", description: "", billable: true });
      setIsTimeEntryDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteTimeEntry = async (entryId: string, memberId: string, hours: number) => {
    if (!dbProject) return;
    if (!confirm("Delete this time entry?")) return;
    try {
      await deleteTimeEntry.mutateAsync({
        id: entryId,
        memberId,
        hours,
        projectId: dbProject.id,
      });
    } catch (error) {
      // Error handled by hook
    }
  };


  // Get milestones for a specific date
  const getMilestonesForDate = (date: Date) => {
    if (!milestones) return [];
    return milestones.filter(event => {
      const eventDate = new Date(event.due_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Handle calendar day click
  const handleCalendarDayClick = (day: number) => {
    const clickedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dayMilestones = getMilestonesForDate(clickedDate);
    if (dayMilestones.length > 0 || isDateInProjectRange(day)) {
      setSelectedCalendarDate(clickedDate);
      setIsCalendarDetailOpen(true);
    }
  };

  // Calculate invoice totals - Project value is total invoiced
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalPaid = invoices?.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalOutstanding = invoices?.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + inv.amount, 0) || 0;

  // Calculate total costs (non-labor + auto-calculated labor)
  const nonLaborCosts = costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
  const totalCosts = nonLaborCosts + laborCosts;

  // Calculate profit
  const projectProfit = totalInvoiced - totalCosts;
  const profitMargin = totalInvoiced > 0 ? Math.round((projectProfit / totalInvoiced) * 100) : 0;

  // Project value is the total invoiced amount
  const projectValue = `$${totalInvoiced.toLocaleString()}`;

  // Total team members
  const totalTeamMembers = internalTeam.length + externalTeam.length;

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
    // Return false if no valid dates
    if (!project.startDate) return false;

    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);

    // Parse date - handle both ISO format (2024-01-15) and text format (Jan 15, 2024)
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      // Try ISO format first
      if (dateStr.includes("-")) {
        return new Date(dateStr);
      }
      // Try text format (Jan 15, 2024)
      const parts = dateStr.split(" ");
      if (parts.length < 3) return null;
      const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      return new Date(parseInt(parts[2]), months[parts[0]], parseInt(parts[1].replace(",", "")));
    };

    const startDate = parseDate(project.startDate);
    const endDate = parseDate(project.endDate);

    if (!startDate) return false;

    // If no end date, just check if on or after start date
    if (!endDate) {
      return checkDate >= startDate;
    }

    return checkDate >= startDate && checkDate <= endDate;
  };

  const getMilestoneForDay = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return milestones?.find(event => {
      const eventDate = new Date(event.due_date);
      return eventDate.toDateString() === checkDate.toDateString();
    });
  };

  const hasMilestone = (day: number) => {
    return getMilestoneForDay(day) !== undefined;
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
      const milestone = getMilestoneForDay(day);
      const hasMilestoneOnDay = milestone !== undefined;
      days.push(
        <div
          key={day}
          onClick={() => handleCalendarDayClick(day)}
          className={`h-10 flex items-center justify-center text-sm relative cursor-pointer hover:bg-accent/50 transition-colors ${
            inRange ? "bg-chart-2/20 font-medium" : ""
          } ${hasMilestoneOnDay ? (
            milestone.completed ? "ring-2 ring-chart-2" :
            milestone.missed ? "ring-2 ring-destructive" : "ring-2 ring-primary"
          ) : ""}`}
        >
          {day}
          {hasMilestoneOnDay && (
            <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
              milestone.completed ? "bg-chart-2" :
              milestone.missed ? "bg-destructive" : "bg-primary"
            }`} />
          )}
        </div>
      );
    }

    return days;
  };

  const completedTodos = tasks?.filter(t => t.completed).length || 0;
  const totalTodos = tasks?.length || 0;
  const todoProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" onClick={() => navigateOrg("/projects")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{project.id}</span>
            <Badge className={projectStatusStyles[project.status as keyof typeof projectStatusStyles] || "bg-slate-400 text-black"}>
              {project.status}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="border-2" onClick={handleStartEditProject} disabled={!dbProject}>
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit Project</span>
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
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteProject}>Delete Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
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
              <div className={`h-10 w-10 border-2 border-border flex items-center justify-center ${projectProfit >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className={`text-2xl font-bold font-mono ${projectProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  ${projectProfit.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Profit ({profitMargin}%)</div>
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
                      {availableTeamMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">All team members are already on this project</p>
                      ) : (
                        availableTeamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border-2 border-border hover:bg-accent/50 cursor-pointer"
                            onClick={() => addInternalMember(member)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-border">
                                <AvatarFallback className="bg-secondary text-xs">{member.avatar || member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.role} • {member.department}</div>
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
                <Dialog open={isAddMemberDialogOpen} onOpenChange={(open) => {
                    setIsAddMemberDialogOpen(open);
                    if (!open) {
                      setExternalMemberMode("select");
                      setSelectedContactId("");
                      setSelectedContactRole("");
                      setNewExternalMember({ name: "", email: "", role: "", company: "" });
                    }
                  }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-2">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[450px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Add External Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Mode toggle */}
                      <div className="flex gap-2">
                        <Button
                          variant={externalMemberMode === "select" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 border-2"
                          onClick={() => setExternalMemberMode("select")}
                        >
                          Select from Contacts
                        </Button>
                        <Button
                          variant={externalMemberMode === "create" ? "default" : "outline"}
                          size="sm"
                          className="flex-1 border-2"
                          onClick={() => setExternalMemberMode("create")}
                        >
                          Create New Contact
                        </Button>
                      </div>

                      {externalMemberMode === "select" ? (
                        <>
                          <div className="grid gap-2">
                            <Label>Select Contact *</Label>
                            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                              <SelectTrigger className="border-2">
                                <SelectValue placeholder="Choose a contact..." />
                              </SelectTrigger>
                              <SelectContent className="border-2">
                                {availableContacts.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground text-center">
                                    No contacts available
                                  </div>
                                ) : (
                                  availableContacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                      <span className="font-medium">{contact.name}</span>
                                      {contact.company?.name && (
                                        <span className="text-muted-foreground ml-2">({contact.company.name})</span>
                                      )}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="ext-select-role">Role on Project</Label>
                            <Input
                              id="ext-select-role"
                              placeholder="e.g., Product Owner, Technical Lead"
                              value={selectedContactRole}
                              onChange={(e) => setSelectedContactRole(e.target.value)}
                              className="border-2"
                            />
                          </div>
                        </>
                      ) : (
                        <>
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
                            <Label htmlFor="ext-email">Email</Label>
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
                            <Label htmlFor="ext-role">Role / Job Title</Label>
                            <Input
                              id="ext-role"
                              placeholder="e.g., Product Owner, Technical Lead"
                              value={newExternalMember.role}
                              onChange={(e) => setNewExternalMember({ ...newExternalMember, role: e.target.value })}
                              className="border-2"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This will create a new contact in your CRM and add them to this project.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      {externalMemberMode === "select" ? (
                        <Button
                          onClick={handleAddExternalFromContact}
                          className="border-2"
                          disabled={!selectedContactId || addExternalMemberMutation.isPending}
                        >
                          {addExternalMemberMutation.isPending ? "Adding..." : "Add Member"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAddExternalNewContact}
                          className="border-2"
                          disabled={!newExternalMember.name || createContactAndAdd.isPending}
                        >
                          {createContactAndAdd.isPending ? "Creating..." : "Create & Add"}
                        </Button>
                      )}
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
                          <div className="text-xs text-muted-foreground">{member.role}{member.company ? ` • ${member.company}` : member.email ? ` • ${member.email}` : ""}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                        onClick={() => handleRemoveExternalMember(member.id)}
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
          <TabsTrigger value="contracts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileSignature className="h-4 w-4 mr-1" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wallet className="h-4 w-4 mr-1" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Briefcase className="h-4 w-4 mr-1" />
            Team
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
                    <Link to={getOrgPath("/tickets")}>
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
                      {ticketsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Loading tickets...
                          </TableCell>
                        </TableRow>
                      ) : !projectTickets || projectTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No tickets for this project yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        projectTickets.map((ticket) => (
                          <TableRow
                            key={ticket.id}
                            className="border-b-2 cursor-pointer hover:bg-accent/50"
                            onClick={() => navigateOrg(`/tickets/${ticket.display_id}`)}
                          >
                            <TableCell className="font-mono text-sm">{ticket.display_id}</TableCell>
                            <TableCell className="font-medium">{ticket.title}</TableCell>
                            <TableCell>
                              <Badge className={ticketPriorityStyles[ticket.priority as keyof typeof ticketPriorityStyles] || "bg-slate-400 text-black"}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={ticketStatusStyles[ticket.status as keyof typeof ticketStatusStyles] || "bg-slate-400 text-black"}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                    <div className="text-sm text-muted-foreground mb-1">Contracted Value</div>
                    <div className="font-mono font-bold text-lg">
                      <HiddenAmount value={Number(dbProject?.value || 0)} />
                    </div>
                  </div>
                  <div className="border-t-2 border-border pt-4">
                    <div className="text-sm text-muted-foreground mb-1">Project Budget</div>
                    <div className="font-mono font-bold text-lg">
                      <HiddenAmount value={Number(dbProject?.budget || 0)} />
                    </div>
                    {(dbProject?.budget || 0) > 0 && canViewAmounts() && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Budget Used</span>
                          <span className={laborCosts > (dbProject?.budget || 0) ? "text-destructive font-medium" : ""}>
                            {((laborCosts / (dbProject?.budget || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min((laborCosts / (dbProject?.budget || 1)) * 100, 100)}
                          className={`h-2 ${laborCosts > (dbProject?.budget || 0) ? "[&>div]:bg-destructive" : ""}`}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          <HiddenAmount value={laborCosts} /> of <HiddenAmount value={Number(dbProject?.budget || 0)} /> used
                        </div>
                      </div>
                    )}
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
                  <DialogContent className="border-2 sm:max-w-[500px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
                          <Label htmlFor="inv-number">Invoice Number</Label>
                          <Input
                            id="inv-number"
                            placeholder="e.g., INV-2024-001"
                            value={newInvoice.invoiceNumber}
                            onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                            className="border-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid gap-2">
                          <Label htmlFor="inv-status">Status</Label>
                          <Select
                            value={newInvoice.status}
                            onValueChange={(value: "draft" | "sent" | "paid" | "overdue") =>
                              setNewInvoice({ ...newInvoice, status: value })
                            }
                          >
                            <SelectTrigger className="border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-2">
                              {INVOICE_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="inv-notes">Notes</Label>
                        <Textarea
                          id="inv-notes"
                          placeholder="Additional notes..."
                          value={newInvoice.notes}
                          onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                          className="border-2"
                          rows={2}
                        />
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
                    <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Invoice #</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Due Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">File</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((invoice) => (
                    <TableRow key={invoice.id} className="border-b-2">
                      <TableCell className="font-mono text-sm">{invoice.display_id}</TableCell>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number || "-"}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={invoice.description}>
                        {invoice.description}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusStyles[invoice.status as keyof typeof invoiceStatusStyles] || "bg-slate-400 text-black"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.file_url ? (
                          <a
                            href={invoice.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <FileText className="h-3 w-3" />
                            {invoice.file_name || "View"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 border-2 border-transparent hover:border-border"
                            onClick={() => openEditInvoice(invoice)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Invoice Dialog */}
          <Dialog open={isEditInvoiceDialogOpen} onOpenChange={setIsEditInvoiceDialogOpen}>
            <DialogContent className="border-2 sm:max-w-[500px]">
              <DialogHeader className="border-b-2 border-border pb-4">
                <DialogTitle>Edit Invoice</DialogTitle>
              </DialogHeader>
              {editingInvoice && (
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-inv-desc">Description *</Label>
                    <Input
                      id="edit-inv-desc"
                      placeholder="Invoice description"
                      value={editingInvoice.description}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-inv-amount">Amount ($) *</Label>
                      <Input
                        id="edit-inv-amount"
                        type="number"
                        placeholder="0"
                        value={editingInvoice.amount}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: parseFloat(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-inv-number">Invoice Number</Label>
                      <Input
                        id="edit-inv-number"
                        placeholder="e.g., INV-2024-001"
                        value={editingInvoice.invoiceNumber}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-inv-due">Due Date</Label>
                      <Input
                        id="edit-inv-due"
                        type="date"
                        value={editingInvoice.dueDate}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-inv-status">Status</Label>
                      <Select
                        value={editingInvoice.status}
                        onValueChange={(value: "draft" | "sent" | "paid" | "overdue") =>
                          setEditingInvoice({ ...editingInvoice, status: value })
                        }
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2">
                          {INVOICE_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingInvoice.status === "paid" && (
                    <div className="grid gap-2">
                      <Label htmlFor="edit-inv-paid">Paid Date</Label>
                      <Input
                        id="edit-inv-paid"
                        type="date"
                        value={editingInvoice.paidDate}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, paidDate: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-inv-file-url">File URL</Label>
                    <Input
                      id="edit-inv-file-url"
                      placeholder="https://..."
                      value={editingInvoice.fileUrl}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, fileUrl: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-inv-file-name">File Name</Label>
                    <Input
                      id="edit-inv-file-name"
                      placeholder="invoice.pdf"
                      value={editingInvoice.fileName}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, fileName: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-inv-notes">Notes</Label>
                    <Textarea
                      id="edit-inv-notes"
                      placeholder="Additional notes..."
                      value={editingInvoice.notes}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                      className="border-2"
                      rows={2}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                <Button variant="outline" onClick={() => setIsEditInvoiceDialogOpen(false)} className="border-2">
                  Cancel
                </Button>
                <Button onClick={handleUpdateInvoice} className="border-2">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                        {completedTodos} of {totalTodos} tasks completed
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
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="task-due">Due Date</Label>
                            <Input
                              id="task-due"
                              type="date"
                              value={newTodoDueDate}
                              onChange={(e) => setNewTodoDueDate(e.target.value)}
                              className="border-2"
                            />
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
                    {tasks?.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 border-2 border-border ${
                          task.completed ? "bg-muted/50" : "bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTodo(task.id, task.completed)}
                          className="border-2"
                        />
                        <div className="flex-1">
                          <span className={`${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            {task.assignee?.profiles?.full_name && (
                              <span>Assigned to {task.assignee.profiles.full_name}</span>
                            )}
                            {task.due_date && (
                              <>
                                {task.assignee?.profiles?.full_name && <span>•</span>}
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge className={ticketPriorityStyles[task.priority as keyof typeof ticketPriorityStyles] || "bg-slate-400 text-black"}>
                          {task.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                          onClick={() => deleteTodo(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!tasks || tasks.length === 0) && (
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
                        <span className="font-bold">{totalTodos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-bold text-chart-2">{completedTodos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-bold">{totalTodos - completedTodos}</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-border pt-4 space-y-3">
                      <div className="text-sm font-medium">By Priority</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-destructive">High</span>
                        <span className="font-bold">{tasks?.filter(t => t.priority === "high" && !t.completed).length || 0} remaining</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-chart-4">Medium</span>
                        <span className="font-bold">{tasks?.filter(t => t.priority === "medium" && !t.completed).length || 0} remaining</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Low</span>
                        <span className="font-bold">{tasks?.filter(t => t.priority === "low" && !t.completed).length || 0} remaining</span>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Timeline</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {milestones?.filter(m => m.completed).length || 0} of {milestones?.length || 0} milestones completed
                  </p>
                </div>
                <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="border-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[425px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Add Milestone</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="milestone-title">Title *</Label>
                        <Input
                          id="milestone-title"
                          placeholder="Milestone title"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="milestone-desc">Description</Label>
                        <Textarea
                          id="milestone-desc"
                          placeholder="Brief description"
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="milestone-date">Date *</Label>
                        <Input
                          id="milestone-date"
                          type="date"
                          value={newMilestone.date}
                          onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                          className="border-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={handleAddMilestone} className="border-2" disabled={createMilestone.isPending}>
                        {createMilestone.isPending ? "Adding..." : "Add Milestone"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-6">
                  {milestones?.map((event, index) => (
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

                      <div className={`flex-1 pb-6 ${index === (milestones?.length || 0) - 1 ? "pb-0" : ""}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-muted-foreground">{event.due_date}</span>
                            {event.completed && (
                              <Badge className="bg-emerald-600 text-white">Completed</Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-2">
                              <DropdownMenuItem onClick={() => handleToggleMilestoneComplete(event.id, event.completed)}>
                                <Check className="h-4 w-4 mr-2" />
                                {event.completed ? "Mark Incomplete" : "Mark Complete"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingMilestone(event);
                                setIsEditMilestoneDialogOpen(true);
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMilestone(event.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!milestones || milestones.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border ml-10">
                      No milestones yet. Add one to get started!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Milestone Dialog */}
          <Dialog open={isEditMilestoneDialogOpen} onOpenChange={setIsEditMilestoneDialogOpen}>
            <DialogContent className="border-2 sm:max-w-[425px]">
              <DialogHeader className="border-b-2 border-border pb-4">
                <DialogTitle>Edit Milestone</DialogTitle>
              </DialogHeader>
              {editingMilestone && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-milestone-title">Title *</Label>
                    <Input
                      id="edit-milestone-title"
                      value={editingMilestone.title}
                      onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-milestone-desc">Description</Label>
                    <Textarea
                      id="edit-milestone-desc"
                      value={editingMilestone.description}
                      onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-milestone-date">Due Date</Label>
                    <Input
                      id="edit-milestone-date"
                      type="date"
                      onChange={(e) => {
                        if (e.target.value) {
                          setEditingMilestone({ ...editingMilestone, due_date: e.target.value });
                        }
                      }}
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground">Current: {new Date(editingMilestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                <Button variant="outline" onClick={() => setIsEditMilestoneDialogOpen(false)} className="border-2">
                  Cancel
                </Button>
                <Button onClick={handleUpdateMilestone} className="border-2" disabled={updateMilestone.isPending}>
                  {updateMilestone.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t-2 border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-chart-2/20" />
                  <span className="text-sm text-muted-foreground">Project Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-primary" />
                  <span className="text-sm text-muted-foreground">Pending Milestone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-chart-2" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-destructive" />
                  <span className="text-sm text-muted-foreground">Missed Deadline</span>
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

          {/* Calendar Day Detail Dialog */}
          <Dialog open={isCalendarDetailOpen} onOpenChange={setIsCalendarDetailOpen}>
            <DialogContent className="border-2 sm:max-w-[425px]">
              <DialogHeader className="border-b-2 border-border pb-4">
                <DialogTitle>
                  {selectedCalendarDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {selectedCalendarDate && getMilestonesForDate(selectedCalendarDate).length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Milestones</h4>
                    {getMilestonesForDate(selectedCalendarDate).map((milestone) => (
                      <div key={milestone.id} className="p-3 border-2 border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{milestone.title}</h5>
                          {milestone.completed && (
                            <Badge className="bg-emerald-600 text-white text-xs">Completed</Badge>
                          )}
                          {milestone.missed && (
                            <Badge className="bg-red-600 text-white text-xs">Missed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {selectedCalendarDate && isDateInProjectRange(selectedCalendarDate.getDate()) ? (
                      <p>No milestones scheduled for this date. This day is within the project duration.</p>
                    ) : (
                      <p>No events on this date.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end border-t-2 border-border pt-4">
                <Button variant="outline" onClick={() => setIsCalendarDetailOpen(false)} className="border-2">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Contracts</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage NDAs, service agreements, and employee contracts
                  </p>
                </div>
                <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="border-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[425px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Upload Contract</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contract-name">Contract Name *</Label>
                        <Input
                          id="contract-name"
                          placeholder="e.g., Non-Disclosure Agreement"
                          value={newContract.name}
                          onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contract-type">Contract Type</Label>
                        <Select value={newContract.type} onValueChange={(value) => setNewContract({ ...newContract, type: value })}>
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-2">
                            <SelectItem value="nda">NDA</SelectItem>
                            <SelectItem value="service">Service Agreement</SelectItem>
                            <SelectItem value="employee">Employee Contract</SelectItem>
                            <SelectItem value="contractor">Contractor Agreement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>File</Label>
                        <div className="border-2 border-dashed border-border p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 10MB</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsContractDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={handleUploadContract} className="border-2" disabled={createContract.isPending}>
                        {createContract.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!contracts || contracts.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contracts uploaded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 hover:bg-transparent">
                      <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Name</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Created</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts?.map((contract) => (
                      <TableRow key={contract.id} className="border-b-2">
                        <TableCell className="font-mono text-sm">{contract.display_id}</TableCell>
                        <TableCell className="font-medium">{contract.name}</TableCell>
                        <TableCell>
                          <Badge className={documentTypeStyles[contract.type as keyof typeof documentTypeStyles] || "bg-slate-400 text-black"}>
                            {contractTypeLabels[contract.type as keyof typeof contractTypeLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={documentStatusStyles[contract.status as keyof typeof documentStatusStyles] || "bg-slate-400 text-black"}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {contract.file_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 border-2 border-transparent hover:border-border"
                                onClick={() => window.open(contract.file_url!, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{contracts?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Contracts</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{contracts?.filter(c => c.type === "nda").length || 0}</div>
                <div className="text-sm text-muted-foreground">NDAs</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{contracts?.filter(c => c.type === "employee" || c.type === "contractor").length || 0}</div>
                <div className="text-sm text-muted-foreground">Team Contracts</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{contracts?.filter(c => c.status === "signed" || c.status === "active").length || 0}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">${totalCosts.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Costs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                    <DollarSign className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">${totalInvoiced.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 border-2 border-border flex items-center justify-center ${projectProfit >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold font-mono ${projectProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      ${projectProfit.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 border-2 border-border flex items-center justify-center ${profitMargin >= 20 ? "bg-emerald-600" : profitMargin >= 0 ? "bg-amber-500" : "bg-red-600"}`}>
                    <span className={`text-sm font-bold ${profitMargin >= 20 || profitMargin < 0 ? "text-white" : "text-black"}`}>%</span>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold font-mono ${profitMargin >= 20 ? "text-emerald-600" : profitMargin >= 0 ? "text-amber-600" : "text-red-600"}`}>
                      {profitMargin}%
                    </div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Costs</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track labor, infrastructure, and other project expenses
                  </p>
                </div>
                <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="border-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cost
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[425px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Add Project Cost</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cost-desc">Description *</Label>
                        <Input
                          id="cost-desc"
                          placeholder="e.g., Development Labor"
                          value={newCost.description}
                          onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cost-category">Category</Label>
                          <Select value={newCost.category} onValueChange={(value) => setNewCost({ ...newCost, category: value })}>
                            <SelectTrigger className="border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-2">
                              <SelectItem value="labor">Labor</SelectItem>
                              <SelectItem value="infrastructure">Infrastructure</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="external">External Services</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cost-amount">Amount ($) *</Label>
                          <Input
                            id="cost-amount"
                            type="number"
                            placeholder="0"
                            value={newCost.amount}
                            onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                            className="border-2"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cost-recurring"
                          checked={newCost.recurring}
                          onCheckedChange={(checked) => setNewCost({ ...newCost, recurring: checked as boolean })}
                          className="border-2"
                        />
                        <Label htmlFor="cost-recurring" className="text-sm cursor-pointer">
                          Recurring monthly cost
                        </Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsCostDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={handleAddCost} className="border-2">
                        Add Cost
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!costs || costs.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No costs recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 hover:bg-transparent">
                      <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Category</TableHead>
                      <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs?.map((cost) => (
                      <TableRow key={cost.id} className="border-b-2">
                        <TableCell className="font-mono text-sm">{cost.id}</TableCell>
                        <TableCell className="font-medium">{cost.description}</TableCell>
                        <TableCell>
                          <Badge className={costCategoryStyles[cost.category as keyof typeof costCategoryStyles] || "bg-slate-400 text-black"}>
                            {costCategoryLabels[cost.category as keyof typeof costCategoryLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">${cost.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{cost.date}</TableCell>
                        <TableCell>
                          {cost.recurring ? (
                            <Badge variant="secondary" className="border-2 border-border">Recurring</Badge>
                          ) : (
                            <Badge variant="outline" className="border-2">One-time</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                            onClick={() => handleDeleteCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Cost Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Labor costs - auto-calculated from time entries */}
                {laborCosts > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        Labor
                        <Badge variant="secondary" className="text-xs border-2 border-border">Auto-calculated</Badge>
                      </span>
                      <span className="font-mono font-bold">${laborCosts.toLocaleString()} ({totalCosts > 0 ? Math.round((laborCosts / totalCosts) * 100) : 0}%)</span>
                    </div>
                    <Progress value={totalCosts > 0 ? Math.round((laborCosts / totalCosts) * 100) : 0} className="h-2" />
                  </div>
                )}
                {/* Other costs from manual entries */}
                {Object.entries(costCategoryLabels).filter(([key]) => key !== "labor").map(([key, label]) => {
                  const categoryTotal = costs?.filter(c => c.category === key).reduce((sum, c) => sum + c.amount, 0) || 0;
                  const percentage = totalCosts > 0 ? Math.round((categoryTotal / totalCosts) * 100) : 0;
                  return categoryTotal > 0 ? (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-mono font-bold">${categoryTotal.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Profit Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-mono font-bold">${totalInvoiced.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor Costs (from time entries)</span>
                    <span className="font-mono font-bold text-destructive">-${laborCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other Costs</span>
                    <span className="font-mono font-bold text-destructive">-${nonLaborCosts.toLocaleString()}</span>
                  </div>
                  <div className="border-t-2 border-border pt-3 flex justify-between">
                    <span className="font-semibold">Net Profit</span>
                    <span className={`font-mono font-bold text-lg ${projectProfit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                      ${projectProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="border-t-2 border-border pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Profit Margin</div>
                  <div className="flex items-center gap-4">
                    <Progress value={Math.max(0, profitMargin)} className="h-3 flex-1" />
                    <span className={`font-mono font-bold ${profitMargin >= 20 ? "text-chart-2" : profitMargin >= 0 ? "" : "text-destructive"}`}>
                      {profitMargin}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {profitMargin >= 30 ? "Excellent profit margin" :
                     profitMargin >= 20 ? "Good profit margin" :
                     profitMargin >= 10 ? "Moderate profit margin" :
                     profitMargin >= 0 ? "Low profit margin" : "Project is operating at a loss"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{totalHours}</div>
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                    <Clock className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{billableHours}</div>
                    <div className="text-sm text-muted-foreground">Billable Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                    <Users className="h-5 w-5 text-background" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{internalTeam.length}</div>
                    <div className="text-sm text-muted-foreground">Team Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                    <DollarSign className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">
                      ${hoursByMember.reduce((sum, m) => sum + m.totalPaid, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Breakdown */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hours worked, rates, and payment breakdown
                  </p>
                </div>
                <Button size="sm" variant="outline" className="border-2" onClick={() => setIsTeamDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Member</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Role</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Contract</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Rate/Hr</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Salary</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hoursByMember.map((member) => (
                    <TableRow key={member.id} className="border-b-2">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-border">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <Badge className={contractTypeStyles[member.contractType as keyof typeof contractTypeStyles] || "bg-slate-400 text-black"}>
                          {member.contractType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{member.hoursOnProject}h</TableCell>
                      <TableCell className="text-right font-mono">${member.hourlyRate}</TableCell>
                      <TableCell className="text-right font-mono">
                        {member.salary > 0 ? `$${member.salary.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">${member.totalPaid.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Project Access Manager */}
          {dbProject?.id && (
            <ProjectAccessManager projectId={dbProject.id} projectName={dbProject.name} />
          )}

          {/* Time Entries */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Time Entries</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recent hours logged on this project
                  </p>
                </div>
                <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="border-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Time
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[425px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Log Time Entry</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="time-member">Team Member *</Label>
                        <Select value={newTimeEntry.memberId} onValueChange={(value) => setNewTimeEntry({ ...newTimeEntry, memberId: value })}>
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent className="border-2">
                            {internalTeam.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="time-hours">Hours *</Label>
                        <Input
                          id="time-hours"
                          type="number"
                          step="0.5"
                          placeholder="8"
                          value={newTimeEntry.hours}
                          onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="time-desc">Description</Label>
                        <Textarea
                          id="time-desc"
                          placeholder="What did you work on?"
                          value={newTimeEntry.description}
                          onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
                          className="border-2"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="time-billable"
                          checked={newTimeEntry.billable}
                          onCheckedChange={(checked) => setNewTimeEntry({ ...newTimeEntry, billable: checked as boolean })}
                          className="border-2"
                        />
                        <Label htmlFor="time-billable" className="text-sm cursor-pointer">
                          Billable hours
                        </Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                      <Button variant="outline" onClick={() => setIsTimeEntryDialogOpen(false)} className="border-2">
                        Cancel
                      </Button>
                      <Button onClick={addTimeEntry} className="border-2">
                        Log Time
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {timeEntriesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : !dbTimeEntries || dbTimeEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No time entries yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 hover:bg-transparent">
                      <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Member</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                      <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                      <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbTimeEntries?.map((entry) => (
                      <TableRow key={entry.id} className="border-b-2">
                        <TableCell className="text-muted-foreground">{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">{entry.team_member?.name || "Unknown"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{entry.description || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{entry.hours}h</TableCell>
                        <TableCell>
                          {entry.billable ? (
                            <Badge className="bg-emerald-600 text-white">Billable</Badge>
                          ) : (
                            <Badge variant="secondary" className="border-2 border-border">Non-billable</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 border-2 border-transparent hover:border-destructive hover:text-destructive"
                            onClick={() => handleDeleteTimeEntry(entry.id, entry.team_member_id, entry.hours)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editProjectData && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-project-name">Project Name *</Label>
                <Input
                  id="edit-project-name"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                  className="border-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editProjectData.status}
                    onValueChange={(v) => setEditProjectData({ ...editProjectData, status: v })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-project-progress">Progress (%)</Label>
                  <Input
                    id="edit-project-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editProjectData.progress}
                    onChange={(e) => setEditProjectData({ ...editProjectData, progress: parseInt(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-project-value">Contracted Value ($)</Label>
                  <Input
                    id="edit-project-value"
                    type="number"
                    value={editProjectData.value}
                    onChange={(e) => setEditProjectData({ ...editProjectData, value: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-project-budget">Project Budget ($)</Label>
                  <Input
                    id="edit-project-budget"
                    type="number"
                    value={editProjectData.budget}
                    onChange={(e) => setEditProjectData({ ...editProjectData, budget: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-project-start-date">Start Date</Label>
                <Input
                  id="edit-project-start-date"
                  type="date"
                  value={editProjectData.start_date}
                  onChange={(e) => setEditProjectData({ ...editProjectData, start_date: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="border-t-2 border-border pt-4">
                <h4 className="font-semibold mb-3">Client Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project-client-name">Client Name *</Label>
                    <Input
                      id="edit-project-client-name"
                      value={editProjectData.client_name}
                      onChange={(e) => setEditProjectData({ ...editProjectData, client_name: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project-client-email">Client Email</Label>
                    <Input
                      id="edit-project-client-email"
                      type="email"
                      value={editProjectData.client_email}
                      onChange={(e) => setEditProjectData({ ...editProjectData, client_email: e.target.value })}
                      className="border-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditProjectDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleSaveProject} className="border-2" disabled={updateProject.isPending}>
              {updateProject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
