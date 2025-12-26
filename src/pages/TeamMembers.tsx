import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import {
  Users,
  Plus,
  Search,
  Clock,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  Briefcase,
  Loader2,
  Mail,
  UserPlus,
  Key,
  RefreshCw,
  X,
  Copy,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useTeamMembersWithProjects,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  TeamMemberWithProjects,
} from "@/hooks/useTeamMembers";
import { useInvitations, useCreateInvitation, useDeleteInvitation, useResendInvitation } from "@/hooks/useInvitations";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContractType = Database["public"]["Enums"]["contract_type"];
type MemberStatus = Database["public"]["Enums"]["member_status"];

const departments = ["Management", "Engineering", "Design", "Quality", "Operations"];
const contractTypes: ContractType[] = ["Full-time", "Part-time", "Contractor"];

export default function TeamMembers() {
  const { navigateOrg, getOrgPath } = useOrgNavigation();
  const canViewAmounts = useCanViewAmounts();
  const { data: teamMembers, isLoading, error } = useTeamMembersWithProjects();
  const createTeamMember = useCreateTeamMember();
  const updateTeamMember = useUpdateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();

  // Invitations
  const { data: invitations, isLoading: invitationsLoading } = useInvitations();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const resendInvitation = useResendInvitation();
  const { data: roles } = useRoles();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberWithProjects | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [sendingPasswordReset, setSendingPasswordReset] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "Engineering",
    hourlyRate: "",
    salary: "",
    contractType: "Full-time" as ContractType,
  });

  const filteredMembers = teamMembers?.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    const matchesContract = filterContract === "all" || member.contract_type === filterContract;
    return matchesSearch && matchesDepartment && matchesContract;
  }) || [];

  const activeMembers = teamMembers?.filter(m => m.status === "active").length || 0;
  const totalHours = teamMembers?.reduce((sum, m) => sum + m.total_hours, 0) || 0;
  const totalLaborCost = teamMembers?.reduce((sum, m) => sum + (m.total_hours * m.hourly_rate), 0) || 0;
  const contractors = teamMembers?.filter(m => m.contract_type === "Contractor").length || 0;

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTeamMember.mutateAsync({
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone || null,
        role: newMember.role,
        department: newMember.department,
        hourly_rate: parseFloat(newMember.hourlyRate) || 0,
        salary: parseFloat(newMember.salary) || 0,
        contract_type: newMember.contractType,
      });

      setNewMember({
        name: "",
        email: "",
        phone: "",
        role: "",
        department: "Engineering",
        hourlyRate: "",
        salary: "",
        contractType: "Full-time",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      await updateTeamMember.mutateAsync({
        id: editingMember.id,
        name: editingMember.name,
        email: editingMember.email,
        phone: editingMember.phone,
        role: editingMember.role,
        department: editingMember.department,
        hourly_rate: editingMember.hourly_rate,
        salary: editingMember.salary,
        contract_type: editingMember.contract_type,
      });
      setEditingMember(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (name === "You") {
      toast.error("Cannot delete your own account");
      return;
    }
    deleteTeamMember.mutate(id);
  };

  const toggleMemberStatus = (id: string, currentStatus: MemberStatus) => {
    updateTeamMember.mutate({
      id,
      status: currentStatus === "active" ? "inactive" : "active",
    });
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteRoleId) {
      toast.error("Please enter an email and select a role");
      return;
    }
    try {
      await createInvitation.mutateAsync({ email: inviteEmail, roleId: inviteRoleId });
      setInviteEmail("");
      setInviteRoleId("");
      setIsInviteDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSendPasswordReset = async (email: string, memberId: string) => {
    setSendingPasswordReset(memberId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(errorMessage);
    } finally {
      setSendingPasswordReset(null);
    }
  };

  const copyInviteLink = (token: string) => {
    const baseUrl = import.meta.env.PROD ? "https://app.soluly.com" : window.location.origin;
    const link = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  // Count pending invitations
  const pendingInvitations = invitations?.filter(
    (inv) => new Date(inv.expires_at) > new Date()
  ).length || 0;

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
        <p className="text-destructive">Failed to load team members</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your team across all projects</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 flex-1 sm:flex-none">
                <Mail className="h-4 w-4 mr-2" />
                Invite
                {pendingInvitations > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 flex items-center justify-center">
                    {pendingInvitations}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 sm:max-w-[425px]">
              <DialogHeader className="border-b-2 border-border pb-4">
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role *</Label>
                  <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The invited user will be able to access features based on this role's permissions.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="border-2">
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={createInvitation.isPending} className="border-2">
                  {createInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="border-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@company.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555-0100"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Developer"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={newMember.department} onValueChange={(value) => setNewMember({ ...newMember, department: value })}>
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
                  <Label htmlFor="contract">Contract Type</Label>
                  <Select value={newMember.contractType} onValueChange={(value: ContractType) => setNewMember({ ...newMember, contractType: value })}>
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
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="0"
                    value={newMember.hourlyRate}
                    onChange={(e) => setNewMember({ ...newMember, hourlyRate: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">Annual Salary ($)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="0"
                    value={newMember.salary}
                    onChange={(e) => setNewMember({ ...newMember, salary: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleAddMember} className="border-2" disabled={createTeamMember.isPending}>
                {createTeamMember.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-emerald-600 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold truncate">{activeMembers}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-blue-600 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold font-mono truncate">{totalHours}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-primary shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold font-mono truncate">{canViewAmounts ? `$${totalLaborCost.toLocaleString()}` : "••••••"}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Labor Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold truncate">{contractors}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Contractors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="border-b-2 border-border py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Pending Invitations
                <Badge variant="secondary">{invitations.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invitations.map((invitation) => {
                const isExpired = new Date(invitation.expires_at) < new Date();
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border-2 border-border">
                        <AvatarFallback className="bg-muted text-xs">
                          {invitation.email.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{invitation.email}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Role: {invitation.role?.name || "Unknown"}</span>
                          {invitation.inviter?.name && (
                            <>
                              <span>•</span>
                              <span>Invited by {invitation.inviter.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isExpired ? (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-2">Pending</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyInviteLink(invitation.token)}
                        title="Copy invite link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => resendInvitation.mutate(invitation.id)}
                        disabled={resendInvitation.isPending}
                        title="Resend invitation"
                      >
                        <RefreshCw className={`h-4 w-4 ${resendInvitation.isPending ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteInvitation.mutate(invitation.id)}
                        disabled={deleteInvitation.isPending}
                        title="Cancel invitation"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Team Members</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[200px] border-2"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[150px] border-2">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterContract} onValueChange={setFilterContract}>
                <SelectTrigger className="w-full sm:w-[150px] border-2">
                  <SelectValue placeholder="Contract" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="all">All Types</SelectItem>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile view - cards */}
          <div className="block sm:hidden divide-y-2 divide-border">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-4 cursor-pointer hover:bg-accent/50" onClick={() => navigateOrg(`/team/${member.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border-2 border-border shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{member.avatar || member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${member.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-400 text-black"}`}>
                      {member.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-2">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingMember(member);
                          setIsEditDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toggleMemberStatus(member.id, member.status);
                        }}>
                          <Users className="h-4 w-4 mr-2" />
                          {member.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleSendPasswordReset(member.email, member.id);
                        }} disabled={sendingPasswordReset === member.id}>
                          {sendingPasswordReset === member.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="h-4 w-4 mr-2" />
                          )}
                          Send Password Reset
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(member.id, member.name);
                        }}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className="text-muted-foreground">{member.department}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono">{canViewAmounts ? `$${member.hourly_rate}/hr` : "••••••"}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono">{member.total_hours}h</span>
                </div>
                {member.projects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.projects.slice(0, 2).map((p) => (
                      <Badge key={p.project_id} variant="outline" className="border-2 text-xs max-w-[100px] truncate" title={p.project?.name || p.project_id}>
                        {p.project?.name || p.project_id}
                      </Badge>
                    ))}
                    {member.projects.length > 2 && (
                      <Badge variant="outline" className="border-2 text-xs shrink-0">
                        +{member.projects.length - 2}
                      </Badge>
                    )}
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
                  <TableHead className="font-bold uppercase text-xs">Member</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Role</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Department</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Contract</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right">Rate/Hr</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Projects</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="border-b-2 cursor-pointer hover:bg-accent/50" onClick={() => navigateOrg(`/team/${member.id}`)}>
                    <TableCell>
                      <Link to={getOrgPath(`/team/${member.id}`)} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <Avatar className="h-8 w-8 border-2 border-border">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{member.avatar || member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-primary hover:underline">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>
                      <Badge variant={member.contract_type === "Full-time" ? "default" : member.contract_type === "Contractor" ? "secondary" : "outline"} className="border-2 border-border">
                        {member.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{canViewAmounts ? `$${member.hourly_rate}` : "••••••"}</TableCell>
                    <TableCell className="text-right font-mono">{member.total_hours}h</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {member.projects.length > 0 ? (
                          member.projects.slice(0, 2).map((p) => (
                            <Link key={p.project_id} to={getOrgPath(`/projects/${p.project?.display_id}`)} onClick={(e) => e.stopPropagation()}>
                              <Badge variant="outline" className="border-2 cursor-pointer hover:bg-accent text-xs max-w-[90px] truncate" title={p.project?.name || p.project_id}>
                                {p.project?.name || p.project_id}
                              </Badge>
                            </Link>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                        {member.projects.length > 2 && (
                          <Badge variant="outline" className="border-2 text-xs shrink-0">
                            +{member.projects.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={member.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-400 text-black"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-2">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingMember(member);
                            setIsEditDialogOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            toggleMemberStatus(member.id, member.status);
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            {member.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSendPasswordReset(member.email, member.id);
                          }} disabled={sendingPasswordReset === member.id}>
                            {sendingPasswordReset === member.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Key className="h-4 w-4 mr-2" />
                            )}
                            Send Password Reset
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(member.id, member.name);
                          }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No team members found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[500px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingMember.phone || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Input
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={editingMember.department} onValueChange={(value) => setEditingMember({ ...editingMember, department: value })}>
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
                  <Select value={editingMember.contract_type} onValueChange={(value: ContractType) => setEditingMember({ ...editingMember, contract_type: value })}>
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
                    value={editingMember.hourly_rate}
                    onChange={(e) => setEditingMember({ ...editingMember, hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Annual Salary ($)</Label>
                  <Input
                    type="number"
                    value={editingMember.salary}
                    onChange={(e) => setEditingMember({ ...editingMember, salary: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleEditMember} className="border-2" disabled={updateTeamMember.isPending}>
              {updateTeamMember.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
