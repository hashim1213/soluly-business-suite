import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Clock,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  FileSignature,
  Briefcase,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// All team members across the organization
const initialTeamMembers = [
  { id: "1", name: "You", email: "you@company.com", phone: "+1 555-0100", role: "Project Lead", department: "Management", hourlyRate: 150, salary: 120000, contractType: "Full-time", status: "active", projects: ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-004", "PRJ-005", "PRJ-006"], totalHours: 160, avatar: "Y" },
  { id: "2", name: "Sarah Chen", email: "sarah@company.com", phone: "+1 555-0101", role: "Senior Developer", department: "Engineering", hourlyRate: 95, salary: 95000, contractType: "Full-time", status: "active", projects: ["PRJ-001", "PRJ-005"], totalHours: 120, avatar: "SC" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", phone: "+1 555-0102", role: "Designer", department: "Design", hourlyRate: 85, salary: 0, contractType: "Contractor", status: "active", projects: ["PRJ-001", "PRJ-005"], totalHours: 80, avatar: "MJ" },
  { id: "4", name: "Emma Wilson", email: "emma@company.com", phone: "+1 555-0103", role: "Developer", department: "Engineering", hourlyRate: 90, salary: 90000, contractType: "Full-time", status: "active", projects: ["PRJ-002", "PRJ-005"], totalHours: 60, avatar: "EW" },
  { id: "5", name: "David Brown", email: "david@company.com", phone: "+1 555-0104", role: "QA Engineer", department: "Quality", hourlyRate: 75, salary: 75000, contractType: "Full-time", status: "active", projects: ["PRJ-003", "PRJ-006"], totalHours: 40, avatar: "DB" },
  { id: "6", name: "Lisa Park", email: "lisa@company.com", phone: "+1 555-0105", role: "Business Analyst", department: "Operations", hourlyRate: 80, salary: 80000, contractType: "Full-time", status: "active", projects: ["PRJ-003"], totalHours: 30, avatar: "LP" },
  { id: "7", name: "James Lee", email: "james@company.com", phone: "+1 555-0106", role: "DevOps Engineer", department: "Engineering", hourlyRate: 100, salary: 100000, contractType: "Full-time", status: "active", projects: [], totalHours: 0, avatar: "JL" },
  { id: "8", name: "Anna Martinez", email: "anna@company.com", phone: "+1 555-0107", role: "UI Designer", department: "Design", hourlyRate: 80, salary: 0, contractType: "Contractor", status: "inactive", projects: [], totalHours: 45, avatar: "AM" },
];

const projectsMap: Record<string, string> = {
  "PRJ-001": "Acme Corp",
  "PRJ-002": "TechStart Inc",
  "PRJ-003": "Global Solutions",
  "PRJ-004": "DataFlow Ltd",
  "PRJ-005": "CloudNine Systems",
  "PRJ-006": "InnovateTech",
};

const departments = ["Management", "Engineering", "Design", "Quality", "Operations"];
const contractTypes = ["Full-time", "Part-time", "Contractor"];

export default function TeamMembers() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<typeof initialTeamMembers[0] | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "Engineering",
    hourlyRate: "",
    salary: "",
    contractType: "Full-time",
  });

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    const matchesContract = filterContract === "all" || member.contractType === filterContract;
    return matchesSearch && matchesDepartment && matchesContract;
  });

  const activeMembers = teamMembers.filter(m => m.status === "active").length;
  const totalHours = teamMembers.reduce((sum, m) => sum + m.totalHours, 0);
  const totalLaborCost = teamMembers.reduce((sum, m) => sum + (m.totalHours * m.hourlyRate), 0);
  const contractors = teamMembers.filter(m => m.contractType === "Contractor").length;

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    const member = {
      id: String(Date.now()),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      role: newMember.role,
      department: newMember.department,
      hourlyRate: parseInt(newMember.hourlyRate) || 0,
      salary: parseInt(newMember.salary) || 0,
      contractType: newMember.contractType,
      status: "active",
      projects: [],
      totalHours: 0,
      avatar: newMember.name.split(" ").map(n => n[0]).join("").toUpperCase(),
    };

    setTeamMembers([...teamMembers, member]);
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
    toast.success("Team member added successfully");
  };

  const handleEditMember = () => {
    if (!editingMember) return;
    setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? editingMember : m));
    setEditingMember(null);
    setIsEditDialogOpen(false);
    toast.success("Team member updated");
  };

  const handleDeleteMember = (id: string) => {
    if (id === "1") {
      toast.error("Cannot delete your own account");
      return;
    }
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    toast.success("Team member removed");
  };

  const toggleMemberStatus = (id: string) => {
    setTeamMembers(teamMembers.map(m =>
      m.id === id ? { ...m, status: m.status === "active" ? "inactive" : "active" } : m
    ));
    toast.success("Status updated");
  };

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
                  <Select value={newMember.contractType} onValueChange={(value) => setNewMember({ ...newMember, contractType: value })}>
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
              <Button onClick={handleAddMember} className="border-2">
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
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{member.avatar}</AvatarFallback>
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
                    <Badge variant={member.contractType === "Full-time" ? "default" : member.contractType === "Contractor" ? "secondary" : "outline"} className="border-2 border-border">
                      {member.contractType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${member.hourlyRate}</TableCell>
                  <TableCell className="text-right font-mono">{member.totalHours}h</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.length > 0 ? (
                        member.projects.slice(0, 2).map((projectId) => (
                          <Link key={projectId} to={`/projects/${projectId}`}>
                            <Badge variant="outline" className="border-2 cursor-pointer hover:bg-accent text-xs">
                              {projectsMap[projectId] || projectId}
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-2">
                        <DropdownMenuItem onClick={() => {
                          setEditingMember(member);
                          setIsEditDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMemberStatus(member.id)}>
                          <Users className="h-4 w-4 mr-2" />
                          {member.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMember(member.id)}>
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
                    value={editingMember.phone}
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
                  <Select value={editingMember.contractType} onValueChange={(value) => setEditingMember({ ...editingMember, contractType: value })}>
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
                    value={editingMember.hourlyRate}
                    onChange={(e) => setEditingMember({ ...editingMember, hourlyRate: parseInt(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Annual Salary ($)</Label>
                  <Input
                    type="number"
                    value={editingMember.salary}
                    onChange={(e) => setEditingMember({ ...editingMember, salary: parseInt(e.target.value) || 0 })}
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
            <Button onClick={handleEditMember} className="border-2">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
