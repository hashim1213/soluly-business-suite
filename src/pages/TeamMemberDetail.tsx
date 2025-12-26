import { useParams, Link } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useState } from "react";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Edit,
  Loader2,
  Save,
  Trash2,
  MoreVertical,
  Users,
  Briefcase,
  Plus,
  Check,
  X,
  Key,
  UserCheck,
  Shield,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from "@/hooks/useTeamMembers";
import {
  useTimeEntriesByMember,
  useCreateTimeEntry,
  useDeleteTimeEntry,
} from "@/hooks/useTimeEntries";
import {
  usePaymentsByMember,
  usePaymentSummary,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  useMarkPaymentPaid,
  PaymentMethod,
  PaymentStatus,
} from "@/hooks/usePayments";
import { useProjects } from "@/hooks/useProjects";
import { useAddProjectTeamMember, useRemoveProjectTeamMember } from "@/hooks/useProjectTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { formatDistanceToNow, format } from "date-fns";

type ContractType = Database["public"]["Enums"]["contract_type"];
type MemberStatus = Database["public"]["Enums"]["member_status"];

const departments = ["Management", "Engineering", "Design", "Quality", "Operations"];
const contractTypes: ContractType[] = ["Full-time", "Part-time", "Contractor"];
const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "check", label: "Check" },
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "e_transfer", label: "E-Transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export default function TeamMemberDetail() {
  const { memberId } = useParams();
  const { navigateOrg, getOrgPath } = useOrgNavigation();
  const canViewAmounts = useCanViewAmounts();

  const { data: member, isLoading, error } = useTeamMember(memberId);
  const { data: timeEntries, isLoading: timeEntriesLoading } = useTimeEntriesByMember(memberId);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsByMember(memberId);
  const { data: paymentSummary } = usePaymentSummary(memberId);
  const { data: projects } = useProjects();

  const updateTeamMember = useUpdateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();
  const createTimeEntry = useCreateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const addProjectTeamMember = useAddProjectTeamMember();
  const removeProjectTeamMember = useRemoveProjectTeamMember();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const markPaymentPaid = useMarkPaymentPaid();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTimeEntryDialogOpen, setIsTimeEntryDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAssignProjectDialogOpen, setIsAssignProjectDialogOpen] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);

  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    hourly_rate: number;
    salary: number;
    contract_type: ContractType;
    status: MemberStatus;
  } | null>(null);

  const [newTimeEntry, setNewTimeEntry] = useState({
    project_id: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    description: "",
    billable: true,
  });

  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    period_start: "",
    period_end: "",
    payment_method: "direct_deposit" as PaymentMethod,
    reference_number: "",
    notes: "",
  });

  const handleStartEdit = () => {
    if (!member) return;
    setEditData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role,
      department: member.department,
      hourly_rate: member.hourly_rate,
      salary: member.salary,
      contract_type: member.contract_type,
      status: member.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!member || !editData) return;
    try {
      await updateTeamMember.mutateAsync({
        id: member.id,
        name: editData.name,
        email: editData.email,
        phone: editData.phone || null,
        role: editData.role,
        department: editData.department,
        hourly_rate: editData.hourly_rate,
        salary: editData.salary,
        contract_type: editData.contract_type,
        status: editData.status,
      });
      setIsEditDialogOpen(false);
      setEditData(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) return;
    try {
      await deleteTeamMember.mutateAsync(member.id);
      navigateOrg("/team");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleStatus = async () => {
    if (!member) return;
    try {
      await updateTeamMember.mutateAsync({
        id: member.id,
        status: member.status === "active" ? "inactive" : "active",
      });
      toast.success(`${member.name} is now ${member.status === "active" ? "inactive" : "active"}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSendPasswordReset = async () => {
    if (!member) return;
    setSendingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${member.email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(errorMessage);
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!member || !newTimeEntry.hours) {
      toast.error("Please enter hours");
      return;
    }

    const hoursValue = parseFloat(newTimeEntry.hours);
    if (isNaN(hoursValue) || hoursValue <= 0 || hoursValue > 24) {
      toast.error("Hours must be between 0.01 and 24");
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        team_member_id: member.id,
        project_id: newTimeEntry.project_id && newTimeEntry.project_id !== "" ? newTimeEntry.project_id : null,
        date: newTimeEntry.date,
        hours: hoursValue,
        description: newTimeEntry.description || null,
        billable: newTimeEntry.billable,
      });
      setNewTimeEntry({
        project_id: "",
        date: new Date().toISOString().split("T")[0],
        hours: "",
        description: "",
        billable: true,
      });
      setIsTimeEntryDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteTimeEntry = async (id: string, hours: number, projectId?: string | null) => {
    if (!member) return;
    if (!confirm("Delete this time entry?")) return;
    try {
      await deleteTimeEntry.mutateAsync({ id, memberId: member.id, hours, projectId });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddPayment = async () => {
    if (!member || !newPayment.amount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await createPayment.mutateAsync({
        team_member_id: member.id,
        amount: parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date,
        period_start: newPayment.period_start || null,
        period_end: newPayment.period_end || null,
        payment_method: newPayment.payment_method,
        reference_number: newPayment.reference_number || null,
        notes: newPayment.notes || null,
        status: "paid",
      });
      setNewPayment({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        period_start: "",
        period_end: "",
        payment_method: "direct_deposit",
        reference_number: "",
        notes: "",
      });
      setIsPaymentDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await deletePayment.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/team")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Team Member Not Found</h2>
            <p className="text-muted-foreground">This team member doesn't exist or was deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalHours = member.total_hours;
  const billableHours = timeEntries?.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0) || 0;
  const totalEarned = billableHours * member.hourly_rate;
  const totalPaid = paymentSummary?.totalPaid || 0;
  const outstanding = totalEarned - totalPaid;
  const projectCount = member.projects.length;

  // Calculate project breakdown
  const projectBreakdown = member.projects.map(p => ({
    project_id: p.project_id,
    name: p.project?.name || "Unknown Project",
    display_id: p.project?.display_id || "",
    hours: p.hours_logged,
    earnings: p.hours_logged * member.hourly_rate,
  }));

  const totalProjectHours = projectBreakdown.reduce((sum, p) => sum + p.hours, 0);

  // Get available projects (not already assigned)
  const assignedProjectIds = new Set(member.projects.map(p => p.project_id));
  const availableProjects = projects?.filter(p => !assignedProjectIds.has(p.id) && p.status !== "completed") || [];

  // Handlers for project assignment
  const handleAssignProject = async (projectId: string) => {
    if (!member) return;
    try {
      await addProjectTeamMember.mutateAsync({
        projectId,
        teamMemberId: member.id,
      });
      setIsAssignProjectDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveFromProject = async (projectId: string) => {
    if (!member) return;
    if (!confirm("Remove this team member from the project?")) return;
    try {
      await removeProjectTeamMember.mutateAsync({
        projectId,
        teamMemberId: member.id,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Calculate tenure from created_at
  const createdDate = new Date(member.created_at);
  const now = new Date();
  const tenureMonths = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const tenureYears = Math.floor(tenureMonths / 12);
  const remainingMonths = tenureMonths % 12;
  const tenureText = tenureYears > 0 ? `${tenureYears}y ${remainingMonths}m` : `${remainingMonths}m`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigateOrg("/team")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-border shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-xl">
              {member.avatar || member.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{member.name}</h1>
              <Badge className={`text-xs ${member.status === "active" ? "bg-chart-2 text-background" : "bg-muted text-muted-foreground"}`}>
                {member.status}
              </Badge>
              <Badge variant={member.contract_type === "Full-time" ? "default" : "secondary"} className="border-2 border-border text-xs hidden sm:inline-flex">
                {member.contract_type}
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">{member.role} • {member.department}</p>
            <Badge variant={member.contract_type === "Full-time" ? "default" : "secondary"} className="border-2 border-border text-xs sm:hidden mt-1">
              {member.contract_type}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="border-2 flex-1 sm:flex-none" onClick={handleStartEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2">
              <DropdownMenuItem onClick={handleToggleStatus}>
                <Users className="h-4 w-4 mr-2" />
                {member.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendPasswordReset} disabled={sendingPasswordReset}>
                {sendingPasswordReset ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Send Password Reset
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-chart-1 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-background" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold font-mono truncate">{totalHours}h</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-chart-2 shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-background" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold font-mono truncate">{canViewAmounts ? `$${totalEarned.toLocaleString()}` : "••••••"}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-primary shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold font-mono text-chart-2 truncate">{canViewAmounts ? `$${totalPaid.toLocaleString()}` : "••••••"}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center shrink-0 ${outstanding > 0 ? "bg-chart-4" : "bg-muted"}`}>
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-lg sm:text-2xl font-bold font-mono truncate ${outstanding > 0 ? "text-chart-4" : ""}`}>
                  {canViewAmounts ? `$${outstanding.toLocaleString()}` : "••••••"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="border-2 border-border p-1 bg-background w-full flex flex-wrap sm:w-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm">
            Time
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm">
            Payments
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm">
            Projects
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                    {member.email}
                  </a>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Compensation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-mono font-bold">{canViewAmounts ? `$${member.hourly_rate}/hr` : "••••••"}</span>
                </div>
                {member.salary > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Salary</span>
                    <span className="font-mono font-bold">{canViewAmounts ? `$${member.salary.toLocaleString()}` : "••••••"}</span>
                  </div>
                )}
                <div className="border-t-2 border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billable Hours</span>
                    <span className="font-mono font-bold">{billableHours}h</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-mono font-bold">{canViewAmounts ? `$${totalEarned.toLocaleString()}` : "••••••"}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-mono font-bold text-chart-2">{canViewAmounts ? `$${totalPaid.toLocaleString()}` : "••••••"}</span>
                  </div>
                  {outstanding > 0 && (
                    <div className="flex justify-between mt-2">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-mono font-bold text-chart-4">{canViewAmounts ? `$${outstanding.toLocaleString()}` : "••••••"}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">{tenureText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{member.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Type</span>
                  <Badge variant={member.contract_type === "Full-time" ? "default" : "secondary"} className="border-2 border-border">
                    {member.contract_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={member.status === "active" ? "bg-chart-2 text-background" : "bg-muted text-muted-foreground"}>
                    {member.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Projects</span>
                  <span className="font-bold">{projectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Time Entries</span>
                  <span className="font-bold">{timeEntries?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Rate</span>
                  <span className="font-mono font-bold">{canViewAmounts ? `$${member.hourly_rate}/hr` : "••••••"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Entries Tab */}
        <TabsContent value="hours" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Time Entries</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {billableHours} billable • {totalHours - billableHours} non-billable
                  </p>
                </div>
                <Button className="border-2 w-full sm:w-auto" onClick={() => setIsTimeEntryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {timeEntriesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : !timeEntries || timeEntries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No time entries yet.</p>
                  <Button variant="outline" className="mt-4 border-2" onClick={() => setIsTimeEntryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log First Entry
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="block sm:hidden divide-y-2 divide-border">
                    {timeEntries.map((entry) => {
                      const isSelfLogged = !entry.logged_by || entry.logged_by === entry.team_member_id;
                      return (
                        <div key={entry.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-mono font-bold text-lg">{entry.hours}h</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(entry.date), "MMM d, yyyy")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelfLogged ? (
                                <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-600">
                                  <UserCheck className="h-3 w-3" />
                                  Self
                                </Badge>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600">
                                        <Shield className="h-3 w-3" />
                                        Admin
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Logged by {entry.logged_by_member?.name || "Admin"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {entry.billable ? (
                                <Badge className="bg-chart-2 text-background text-xs">Billable</Badge>
                              ) : (
                                <Badge variant="secondary" className="border-2 border-border text-xs">Non-billable</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTimeEntry(entry.id, entry.hours, entry.project_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {entry.project && (
                            <Link to={getOrgPath(`/projects/${entry.project.display_id}`)} className="text-primary hover:underline text-sm block">
                              {entry.project.name}
                            </Link>
                          )}
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 hover:bg-transparent">
                          <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Project</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                          <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Logged By</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeEntries.map((entry) => {
                          const isSelfLogged = !entry.logged_by || entry.logged_by === entry.team_member_id;
                          return (
                            <TableRow key={entry.id} className="border-b-2">
                              <TableCell className="text-muted-foreground">
                                {format(new Date(entry.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                {entry.project ? (
                                  <Link to={getOrgPath(`/projects/${entry.project.display_id}`)} className="text-primary hover:underline">
                                    {entry.project.name}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">No project</span>
                                )}
                              </TableCell>
                              <TableCell>{entry.description || "-"}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{entry.hours}h</TableCell>
                              <TableCell>
                                {entry.billable ? (
                                  <Badge className="bg-chart-2 text-background">Billable</Badge>
                                ) : (
                                  <Badge variant="secondary" className="border-2 border-border">Non-billable</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isSelfLogged ? (
                                  <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-600">
                                    <UserCheck className="h-3 w-3" />
                                    Self
                                  </Badge>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600">
                                          <Shield className="h-3 w-3" />
                                          Admin
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Logged by {entry.logged_by_member?.name || "Admin"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTimeEntry(entry.id, entry.hours, entry.project_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Earned</div>
                <div className="text-xl sm:text-2xl font-bold font-mono">{canViewAmounts ? `$${totalEarned.toLocaleString()}` : "••••••"}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Paid</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-chart-2">{canViewAmounts ? `$${totalPaid.toLocaleString()}` : "••••••"}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Outstanding</div>
                <div className={`text-xl sm:text-2xl font-bold font-mono ${outstanding > 0 ? "text-chart-4" : "text-chart-2"}`}>
                  {canViewAmounts ? `$${outstanding.toLocaleString()}` : "••••••"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base sm:text-lg">Payment History</CardTitle>
                <Button className="border-2 w-full sm:w-auto" onClick={() => setIsPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : !payments || payments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history.</p>
                  <Button variant="outline" className="mt-4 border-2" onClick={() => setIsPaymentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="block sm:hidden divide-y-2 divide-border">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono font-bold text-lg">{canViewAmounts ? `$${payment.amount.toLocaleString()}` : "••••••"}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${payment.status === "paid" ? "bg-chart-2 text-background" : payment.status === "pending" ? "bg-chart-4 text-foreground" : "bg-muted text-muted-foreground"}`}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {paymentMethods.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                          </span>
                          <div className="flex gap-1">
                            {payment.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-chart-2 hover:text-chart-2"
                                onClick={() => markPaymentPaid.mutate(payment.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {payment.period_start && payment.period_end && (
                          <div className="text-xs text-muted-foreground">
                            Period: {format(new Date(payment.period_start), "MMM d")} - {format(new Date(payment.period_end), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 hover:bg-transparent">
                          <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Period</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Method</TableHead>
                          <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} className="border-b-2">
                            <TableCell className="font-medium">
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.period_start && payment.period_end
                                ? `${format(new Date(payment.period_start), "MMM d")} - ${format(new Date(payment.period_end), "MMM d, yyyy")}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {paymentMethods.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {canViewAmounts ? `$${payment.amount.toLocaleString()}` : "••••••"}
                            </TableCell>
                            <TableCell>
                              <Badge className={payment.status === "paid" ? "bg-chart-2 text-background" : payment.status === "pending" ? "bg-chart-4 text-foreground" : "bg-muted text-muted-foreground"}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {payment.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-chart-2 hover:text-chart-2"
                                    onClick={() => markPaymentPaid.mutate(payment.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          {projectBreakdown.length > 0 && (
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Project Hours Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {projectBreakdown.map((project) => {
                  const percentage = totalProjectHours > 0 ? Math.round((project.hours / totalProjectHours) * 100) : 0;
                  return (
                    <div key={project.project_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        {project.display_id ? (
                          <Link to={getOrgPath(`/projects/${project.display_id}`)} className="text-primary hover:underline font-medium">
                            {project.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{project.name}</span>
                        )}
                        <span className="font-mono font-bold">{project.hours}h ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base sm:text-lg">Assigned Projects</CardTitle>
                <Dialog open={isAssignProjectDialogOpen} onOpenChange={setIsAssignProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="border-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign to Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 sm:max-w-[400px]">
                    <DialogHeader className="border-b-2 border-border pb-4">
                      <DialogTitle>Assign to Project</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
                      {availableProjects.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No available projects to assign</p>
                      ) : (
                        availableProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 border-2 border-border hover:bg-accent/50 cursor-pointer"
                            onClick={() => handleAssignProject(project.id)}
                          >
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-xs text-muted-foreground">{project.display_id} • {project.client_name}</div>
                            </div>
                            <Badge className={project.status === "active" ? "bg-chart-2 text-background" : "bg-chart-4 text-foreground"}>
                              {project.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projectBreakdown.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No projects assigned yet.</p>
                  <Button variant="outline" className="mt-4 border-2" onClick={() => setIsAssignProjectDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign First Project
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="block sm:hidden divide-y-2 divide-border">
                    {projectBreakdown.map((project) => (
                      <div key={project.project_id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            {project.display_id ? (
                              <Link to={getOrgPath(`/projects/${project.display_id}`)} className="font-medium text-primary hover:underline">
                                {project.name}
                              </Link>
                            ) : (
                              <span className="font-medium">{project.name}</span>
                            )}
                            <div className="text-xs text-muted-foreground">{project.display_id}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromProject(project.project_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hours: <span className="font-mono">{project.hours}h</span></span>
                          <span className="font-mono font-bold">{canViewAmounts ? `$${project.earnings.toLocaleString()}` : "••••••"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop view - table */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 hover:bg-transparent">
                          <TableHead className="font-bold uppercase text-xs">Project</TableHead>
                          <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                          <TableHead className="font-bold uppercase text-xs text-right">Earnings</TableHead>
                          <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectBreakdown.map((project) => (
                          <TableRow key={project.project_id} className="border-b-2">
                            <TableCell>
                              {project.display_id ? (
                                <Link to={getOrgPath(`/projects/${project.display_id}`)} className="font-medium text-primary hover:underline">
                                  {project.name}
                                </Link>
                              ) : (
                                <span className="font-medium">{project.name}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">{project.hours}h</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {canViewAmounts ? `$${project.earnings.toLocaleString()}` : "••••••"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {project.display_id && (
                                  <Link to={getOrgPath(`/projects/${project.display_id}`)}>
                                    <Button variant="ghost" size="sm" className="border-2 border-transparent hover:border-border">
                                      View
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveFromProject(project.project_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role *</Label>
                  <Input
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={editData.department} onValueChange={(value) => setEditData({ ...editData, department: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Contract Type</Label>
                  <Select value={editData.contract_type} onValueChange={(value: ContractType) => setEditData({ ...editData, contract_type: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {contractTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    value={editData.hourly_rate}
                    onChange={(e) => setEditData({ ...editData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Annual Salary ($)</Label>
                  <Input
                    type="number"
                    value={editData.salary}
                    onChange={(e) => setEditData({ ...editData, salary: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editData.status} onValueChange={(value: MemberStatus) => setEditData({ ...editData, status: value })}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="border-2" disabled={updateTeamMember.isPending}>
              {updateTeamMember.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Time Entry Dialog */}
      <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[425px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Log Time Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select value={newTimeEntry.project_id || "none"} onValueChange={(value) => setNewTimeEntry({ ...newTimeEntry, project_id: value === "none" ? "" : value })}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="none">No project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newTimeEntry.date}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, date: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Hours *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  placeholder="0.00"
                  value={newTimeEntry.hours}
                  onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What did you work on?"
                value={newTimeEntry.description}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
                className="border-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billable"
                checked={newTimeEntry.billable}
                onCheckedChange={(checked) => setNewTimeEntry({ ...newTimeEntry, billable: checked as boolean })}
              />
              <Label htmlFor="billable" className="cursor-pointer">Billable hours</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsTimeEntryDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleAddTimeEntry} className="border-2" disabled={createTimeEntry.isPending}>
              {createTimeEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Log Time
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[425px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Period Start</Label>
                <Input
                  type="date"
                  value={newPayment.period_start}
                  onChange={(e) => setNewPayment({ ...newPayment, period_start: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Period End</Label>
                <Input
                  type="date"
                  value={newPayment.period_end}
                  onChange={(e) => setNewPayment({ ...newPayment, period_end: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={newPayment.payment_method} onValueChange={(value: PaymentMethod) => setNewPayment({ ...newPayment, payment_method: value })}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Check #, transaction ID, etc."
                value={newPayment.reference_number}
                onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                className="border-2"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                className="border-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleAddPayment} className="border-2" disabled={createPayment.isPending}>
              {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
