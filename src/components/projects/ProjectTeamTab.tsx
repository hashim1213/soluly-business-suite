import { format } from "date-fns";
import {
  Clock,
  DollarSign,
  Loader2,
  MoreVertical,
  Plus,
  Timer,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ProjectAccessManager } from "@/components/projects/ProjectAccessManager";
import { contractTypeStyles } from "@/lib/styles";
import type { TeamMemberWithProjects } from "@/hooks/useTeamMembers";
import type { TimeEntryWithTeamMember } from "@/hooks/useTimeEntries";

export interface ProjectTeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  hourlyRate: number;
  salary: number;
  contractType: string;
  hoursOnProject: number;
  totalPaid: number;
}

export interface ExternalCollaboratorRow {
  id: string;
  contactId: string;
  name: string;
  email: string;
  role: string;
  company: string;
  avatar: string;
}

export interface NewTimeEntryForm {
  memberId: string;
  hours: string;
  description: string;
  billable: boolean;
}

interface ProjectTeamTabProps {
  projectId: string;
  projectName: string;
  totalHours: number;
  billableHours: number;
  teamMembers: ProjectTeamMemberRow[];
  externalMembers: ExternalCollaboratorRow[];
  availableTeamMembers: TeamMemberWithProjects[];
  isAddingMember: boolean;
  onManageTeam: () => void;
  onAddExternalMember: () => void;
  onAddTeamMember: (member: { id: string; name: string }) => void;
  onRemoveTeamMember: (memberId: string) => void;
  onRemoveExternalMember: (memberId: string) => void;
  timeEntries: TimeEntryWithTeamMember[] | undefined;
  timeEntriesLoading: boolean;
  isTimeEntryDialogOpen: boolean;
  onTimeEntryDialogOpenChange: (open: boolean) => void;
  newTimeEntry: NewTimeEntryForm;
  onNewTimeEntryChange: (entry: NewTimeEntryForm) => void;
  onAddTimeEntry: () => void;
  onDeleteTimeEntry: (entryId: string, memberId: string, hours: number) => void;
}

export function ProjectTeamTab({
  projectId,
  projectName,
  totalHours,
  billableHours,
  teamMembers,
  externalMembers,
  availableTeamMembers,
  isAddingMember,
  onManageTeam,
  onAddExternalMember,
  onAddTeamMember,
  onRemoveTeamMember,
  onRemoveExternalMember,
  timeEntries,
  timeEntriesLoading,
  isTimeEntryDialogOpen,
  onTimeEntryDialogOpenChange,
  newTimeEntry,
  onNewTimeEntryChange,
  onAddTimeEntry,
  onDeleteTimeEntry,
}: ProjectTeamTabProps) {
  const totalPaid = teamMembers.reduce((sum, m) => sum + m.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-secondary">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold font-mono">{totalHours}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-chart-2">
                <Clock className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-semibold font-mono">{billableHours}</div>
                <div className="text-sm text-muted-foreground">Billable Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-chart-1">
                <Users className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{teamMembers.length}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-primary">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-semibold font-mono">
                  ${totalPaid.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Team (internal members on this project) */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Project Team</CardTitle>
                <Badge variant="secondary" className="border border-border">{teamMembers.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Internal members assigned to this project — hours, rates, and payments
              </p>
            </div>
            <Button size="sm" variant="outline" className="border" onClick={onManageTeam}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members assigned yet. Add someone from the available team members below.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Member</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Role</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Contract</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Hours</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Rate/Hr</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Salary</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Paid</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} className="border-b">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
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
                    <TableCell className="text-right font-mono font-semibold">${member.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 border border-transparent hover:border-border">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onRemoveTeamMember(member.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove from project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* External Collaborators */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>External Collaborators</CardTitle>
                <Badge variant="secondary" className="border border-border">{externalMembers.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Clients and outside stakeholders involved in this project
              </p>
            </div>
            <Button size="sm" variant="outline" className="border" onClick={onAddExternalMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Collaborator
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {externalMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No external collaborators yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {externalMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-chart-1 text-background text-xs">{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role}
                        {member.company ? ` • ${member.company}` : member.email ? ` • ${member.email}` : ""}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 border border-transparent hover:border-destructive hover:text-destructive"
                    onClick={() => onRemoveExternalMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Team Members (rest of the organization) */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Available Team Members</CardTitle>
                <Badge variant="secondary" className="border border-border">{availableTeamMembers.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Organization members not yet assigned to this project
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {availableTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Everyone in your organization is already on this project
            </div>
          ) : (
            <div className="divide-y divide-border">
              {availableTeamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-secondary text-xs">
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role}
                        {member.department ? ` • ${member.department}` : ""}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border"
                    disabled={isAddingMember}
                    onClick={() => onAddTeamMember({ id: member.id, name: member.name })}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to project
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Access Manager */}
      <ProjectAccessManager projectId={projectId} projectName={projectName} />

      {/* Time Entries */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time Entries</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Recent hours logged on this project
              </p>
            </div>
            <Dialog open={isTimeEntryDialogOpen} onOpenChange={onTimeEntryDialogOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[425px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Log Time Entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="time-member">Team Member *</Label>
                    <Select value={newTimeEntry.memberId} onValueChange={(value) => onNewTimeEntryChange({ ...newTimeEntry, memberId: value })}>
                      <SelectTrigger className="border">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent className="border">
                        {teamMembers.map((member) => (
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
                      onChange={(e) => onNewTimeEntryChange({ ...newTimeEntry, hours: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time-desc">Description</Label>
                    <Textarea
                      id="time-desc"
                      placeholder="What did you work on?"
                      value={newTimeEntry.description}
                      onChange={(e) => onNewTimeEntryChange({ ...newTimeEntry, description: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="time-billable"
                      checked={newTimeEntry.billable}
                      onCheckedChange={(checked) => onNewTimeEntryChange({ ...newTimeEntry, billable: checked as boolean })}
                      className="border"
                    />
                    <Label htmlFor="time-billable" className="text-sm cursor-pointer">
                      Billable hours
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => onTimeEntryDialogOpenChange(false)} className="border">
                    Cancel
                  </Button>
                  <Button onClick={onAddTimeEntry} className="border">
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
          ) : !timeEntries || timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Date</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Member</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Description</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Hours</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Type</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-b">
                    <TableCell className="text-muted-foreground">{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{entry.team_member?.name || "Unknown"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.description || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{entry.hours}h</TableCell>
                    <TableCell>
                      {entry.billable ? (
                        <Badge className="bg-emerald-600 text-white">Billable</Badge>
                      ) : (
                        <Badge variant="secondary" className="border border-border">Non-billable</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 border border-transparent hover:border-destructive hover:text-destructive"
                        onClick={() => onDeleteTimeEntry(entry.id, entry.team_member_id, entry.hours)}
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
    </div>
  );
}
