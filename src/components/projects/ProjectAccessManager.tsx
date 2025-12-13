import { useState } from "react";
import {
  useProjectAccessList,
  useTeamMembersWithoutAccess,
  useGrantProjectAccess,
  useRevokeProjectAccess,
  ProjectAccessUser,
} from "@/hooks/useProjectAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus,
  Users,
  Crown,
  Lock,
  Unlock,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectAccessManagerProps {
  projectId: string;
  projectName: string;
}

export function ProjectAccessManager({ projectId, projectName }: ProjectAccessManagerProps) {
  const { data: accessList, isLoading } = useProjectAccessList(projectId);
  const { data: availableMembers } = useTeamMembersWithoutAccess(projectId);
  const grantAccess = useGrantProjectAccess();
  const revokeAccess = useRevokeProjectAccess();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ProjectAccessUser | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const handleGrantAccess = async () => {
    if (!selectedMember) return;

    await grantAccess.mutateAsync({
      teamMemberId: selectedMember,
      projectId,
    });

    setSelectedMember(null);
    setIsAddDialogOpen(false);
  };

  const handleRevokeAccess = async () => {
    if (!memberToRemove) return;

    await revokeAccess.mutateAsync({
      teamMemberId: memberToRemove.id,
      projectId,
    });

    setMemberToRemove(null);
  };

  const getAccessTypeIcon = (accessType: ProjectAccessUser["accessType"]) => {
    switch (accessType) {
      case "full":
        return <ShieldCheck className="h-4 w-4 text-chart-2" />;
      case "project_scoped":
        return <Shield className="h-4 w-4 text-chart-1" />;
      case "team_assigned":
        return <Users className="h-4 w-4 text-primary" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAccessTypeBadge = (user: ProjectAccessUser) => {
    if (user.isOwner) {
      return (
        <Badge className="bg-amber-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Owner
        </Badge>
      );
    }

    switch (user.accessType) {
      case "full":
        return (
          <Badge className="bg-chart-2 text-white">
            <Unlock className="h-3 w-3 mr-1" />
            Full Access
          </Badge>
        );
      case "project_scoped":
        return (
          <Badge className="bg-chart-1 text-white">
            <Lock className="h-3 w-3 mr-1" />
            Project Access
          </Badge>
        );
      case "team_assigned":
        return (
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            Team Member
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fullAccessCount = accessList?.filter((u) => u.accessType === "full").length || 0;
  const projectAccessCount = accessList?.filter((u) => u.accessType === "project_scoped").length || 0;
  const teamAssignedCount = accessList?.filter((u) => u.accessType === "team_assigned").length || 0;

  if (isLoading) {
    return (
      <Card className="border-2 border-border shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Project Access
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {accessList?.length || 0} users have access to this project
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="border-2" disabled={!availableMembers?.length}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 sm:max-w-[425px]">
                <DialogHeader className="border-b-2 border-border pb-4">
                  <DialogTitle>Grant Project Access</DialogTitle>
                  <DialogDescription>
                    Give a team member access to "{projectName}"
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Team Member</label>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isComboboxOpen}
                          className="w-full justify-between border-2"
                        >
                          {selectedMember
                            ? availableMembers?.find((m) => m.id === selectedMember)?.name
                            : "Select a team member..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search team members..." />
                          <CommandList>
                            <CommandEmpty>No team members found without access.</CommandEmpty>
                            <CommandGroup>
                              {availableMembers?.map((member) => (
                                <CommandItem
                                  key={member.id}
                                  value={member.name}
                                  onSelect={() => {
                                    setSelectedMember(member.id);
                                    setIsComboboxOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <Avatar className="h-6 w-6 border">
                                      <AvatarFallback className="text-xs bg-muted">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{member.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {member.roleName}
                                      </span>
                                    </div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedMember === member.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {!availableMembers?.length && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      All team members already have access to this project.
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t-2 border-border">
                    <Button
                      variant="outline"
                      className="border-2"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGrantAccess}
                      disabled={!selectedMember || grantAccess.isPending}
                    >
                      {grantAccess.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Grant Access
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {/* Access Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b-2 border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-chart-2" />
            <div>
              <div className="text-lg font-bold">{fullAccessCount}</div>
              <div className="text-xs text-muted-foreground">Full Access</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-chart-1" />
            <div>
              <div className="text-lg font-bold">{projectAccessCount}</div>
              <div className="text-xs text-muted-foreground">Project Only</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <div className="text-lg font-bold">{teamAssignedCount}</div>
              <div className="text-xs text-muted-foreground">Team Assigned</div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="font-bold uppercase text-xs">User</TableHead>
                <TableHead className="font-bold uppercase text-xs">Role</TableHead>
                <TableHead className="font-bold uppercase text-xs">Access Level</TableHead>
                <TableHead className="font-bold uppercase text-xs">Source</TableHead>
                <TableHead className="font-bold uppercase text-xs w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users have access to this project
                  </TableCell>
                </TableRow>
              ) : (
                accessList?.map((user) => (
                  <TableRow key={user.id} className="border-b-2">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-border">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.name}
                            {user.isOwner && <Crown className="h-3 w-3 text-amber-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.role}</span>
                    </TableCell>
                    <TableCell>{getAccessTypeBadge(user)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{user.accessSource}</span>
                    </TableCell>
                    <TableCell>
                      {user.canRemove ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setMemberToRemove(user)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revoke Access Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Project Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.name}'s access to this project?
              They will no longer be able to view or interact with project data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevokeAccess}
              disabled={revokeAccess.isPending}
            >
              {revokeAccess.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4 mr-2" />
              )}
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
