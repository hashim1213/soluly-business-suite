import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Database } from "@/integrations/supabase/types";

type ContractType = Database["public"]["Enums"]["contract_type"];
type MemberStatus = Database["public"]["Enums"]["member_status"];

const departments = ["Management", "Engineering", "Design", "Quality", "Operations"];
const contractTypes: ContractType[] = ["Full-time", "Part-time", "Contractor"];

export default function TeamMembers() {
  const navigate = useNavigate();
  const { data: teamMembers, isLoading, error } = useTeamMembersWithProjects();
  const createTeamMember = useCreateTeamMember();
  const updateTeamMember = useUpdateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberWithProjects | null>(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage your team across all projects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Users className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeMembers}</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                <Clock className="h-5 w-5 text-background" />
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
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${totalLaborCost.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Labor Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{contractors}</div>
                <div className="text-sm text-muted-foreground">Contractors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableRow key={member.id} className="border-b-2 cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/team/${member.id}`)}>
                  <TableCell>
                    <Link to={`/team/${member.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                  <TableCell className="text-right font-mono">${member.hourly_rate}</TableCell>
                  <TableCell className="text-right font-mono">{member.total_hours}h</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.length > 0 ? (
                        member.projects.slice(0, 2).map((p) => (
                          <Link key={p.project_id} to={`/projects/${p.project?.display_id}`} onClick={(e) => e.stopPropagation()}>
                            <Badge variant="outline" className="border-2 cursor-pointer hover:bg-accent text-xs">
                              {p.project?.name || p.project_id}
                            </Badge>
                          </Link>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No projects</span>
                      )}
                      {member.projects.length > 2 && (
                        <Badge variant="outline" className="border-2 text-xs">
                          +{member.projects.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={member.status === "active" ? "bg-chart-2 text-background" : "bg-muted text-muted-foreground"}>
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
