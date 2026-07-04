import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeEntriesByMember, useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry, TimeEntryWithProject } from "@/hooks/useTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { SessionTracker } from "@/components/SessionTracker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Plus,
  Calendar,
  Briefcase,
  TrendingUp,
  Loader2,
  Trash2,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign,
  UserCheck,
  Shield
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Link, useSearchParams } from "react-router-dom";

export default function MyHours() {
  const { member } = useAuth();
  const { getOrgPath } = useOrgNavigation();
  const { data: timeEntries, isLoading: entriesLoading } = useTimeEntriesByMember(member?.id);
  const { data: projects } = useProjects();
  const createTimeEntry = useCreateTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const [searchParams, setSearchParams] = useSearchParams();

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Quick entry form state
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithProject | null>(null);
  const [quickEntry, setQuickEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    project_id: "",
    description: "",
    billable: true,
  });

  // Open the Log Time dialog when navigated with ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsQuickEntryOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Get assigned projects for the current member
  const assignedProjects = useMemo(() => {
    if (!projects || !member) return projects || [];
    // For now, show all projects - in a more restrictive setup, you'd filter by assignment
    return projects;
  }, [projects, member]);

  // Calculate week boundaries
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Filter entries for current week
  const weekEntries = useMemo(() => {
    if (!timeEntries) return [];
    return timeEntries.filter((entry) => {
      const entryDate = parseISO(entry.date + "T00:00:00");
      return isWithinInterval(entryDate, { start: currentWeekStart, end: weekEnd });
    });
  }, [timeEntries, currentWeekStart, weekEnd]);

  // Calculate weekly stats
  const weekStats = useMemo(() => {
    const totalHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);
    const billableHours = weekEntries.reduce((sum, e) => e.billable ? sum + e.hours : sum, 0);
    const nonBillableHours = totalHours - billableHours;
    const entriesByDay: Record<string, number> = {};

    weekEntries.forEach((entry) => {
      const day = entry.date;
      entriesByDay[day] = (entriesByDay[day] || 0) + entry.hours;
    });

    return { totalHours, billableHours, nonBillableHours, entriesByDay };
  }, [weekEntries]);

  // Generate week days for the grid
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEE"),
        dayNum: format(date, "d"),
        isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      });
    }
    return days;
  }, [currentWeekStart]);

  const resetQuickEntry = () => {
    setQuickEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      hours: "",
      project_id: "",
      description: "",
      billable: true,
    });
    setEditingEntry(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsQuickEntryOpen(open);
    if (!open) resetQuickEntry();
  };

  const handleQuickEntry = async () => {
    if (!member?.id || !quickEntry.hours || !quickEntry.date) return;

    const hours = parseFloat(quickEntry.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      return;
    }

    if (editingEntry) {
      await updateTimeEntry.mutateAsync({
        id: editingEntry.id,
        oldHours: editingEntry.hours,
        date: quickEntry.date,
        hours,
        project_id: quickEntry.project_id || null,
        description: quickEntry.description || null,
        billable: quickEntry.billable,
      });
    } else {
      await createTimeEntry.mutateAsync({
        team_member_id: member.id,
        date: quickEntry.date,
        hours,
        project_id: quickEntry.project_id || null,
        description: quickEntry.description || null,
        billable: quickEntry.billable,
      });
    }

    resetQuickEntry();
    setIsQuickEntryOpen(false);
  };

  // Open the dialog pre-filled to edit an existing entry
  const handleEditEntry = (entry: TimeEntryWithProject) => {
    setEditingEntry(entry);
    setQuickEntry({
      date: entry.date,
      hours: String(entry.hours),
      project_id: entry.project_id || "",
      description: entry.description || "",
      billable: entry.billable,
    });
    setIsQuickEntryOpen(true);
  };

  // Open the create dialog pre-filled from an existing entry with today's date
  const handleDuplicateEntry = (entry: TimeEntryWithProject) => {
    setEditingEntry(null);
    setQuickEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      hours: String(entry.hours),
      project_id: entry.project_id || "",
      description: entry.description || "",
      billable: entry.billable,
    });
    setIsQuickEntryOpen(true);
  };

  const handleDeleteEntry = async (entry: TimeEntryWithProject) => {
    if (!member?.id) return;
    await deleteTimeEntry.mutateAsync({
      id: entry.id,
      memberId: member.id,
      hours: entry.hours,
      projectId: entry.project_id,
    });
  };

  // Quick log for a specific day
  const handleQuickDayLog = (date: string) => {
    setQuickEntry((prev) => ({ ...prev, date }));
    setIsQuickEntryOpen(true);
  };

  if (!member) {
    return (
      <div className="p-6">
        <Card className="border border-border">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Team Member Profile</h3>
            <p className="text-muted-foreground">
              Your account is not linked to a team member profile. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">Track and manage your work hours</p>
        <Dialog open={isQuickEntryOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="border">
              <Plus className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </DialogTrigger>
          <DialogContent className="border sm:max-w-[425px]">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle>{editingEntry ? "Edit Time Entry" : "Log Time"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={quickEntry.date}
                    onChange={(e) => setQuickEntry({ ...quickEntry, date: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hours *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    placeholder="e.g., 8"
                    value={quickEntry.hours}
                    onChange={(e) => setQuickEntry({ ...quickEntry, hours: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select
                  value={quickEntry.project_id || "none"}
                  onValueChange={(value) => setQuickEntry({ ...quickEntry, project_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="border">
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="none">No Project</SelectItem>
                    {assignedProjects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What did you work on?"
                  value={quickEntry.description}
                  onChange={(e) => setQuickEntry({ ...quickEntry, description: e.target.value })}
                  className="border"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Billable</Label>
                  <p className="text-xs text-muted-foreground">Mark as billable hours</p>
                </div>
                <Switch
                  checked={quickEntry.billable}
                  onCheckedChange={(checked) => setQuickEntry({ ...quickEntry, billable: checked })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)} className="border">
                Cancel
              </Button>
              <Button
                onClick={handleQuickEntry}
                disabled={createTimeEntry.isPending || updateTimeEntry.isPending || !quickEntry.hours || !quickEntry.date}
                className="border"
              >
                {(createTimeEntry.isPending || updateTimeEntry.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEntry ? "Edit Time Entry" : "Log Time"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Session Tracker */}
      <SessionTracker />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-semibold">{weekStats.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billable</p>
                <p className="text-2xl font-semibold">{weekStats.billableHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Billable</p>
                <p className="text-2xl font-semibold">{weekStats.nonBillableHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-semibold">{(member.total_hours || 0).toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar View */}
      <Card className="border border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Timesheet</CardTitle>
              <CardDescription>
                {format(currentWeekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                className="border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="border"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                className="border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayHours = weekStats.entriesByDay[day.date] || 0;
              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-colors hover:bg-muted/50 ${
                    day.isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => handleQuickDayLog(day.date)}
                >
                  <p className="text-xs text-muted-foreground font-medium">{day.dayName}</p>
                  <p className={`text-lg font-semibold ${day.isToday ? "text-primary" : ""}`}>{day.dayNum}</p>
                  <div className="mt-2">
                    {dayHours > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {dayHours.toFixed(1)}h
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                        <Plus className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card className="border border-border">
        <CardHeader className="border-b border-border">
          <CardTitle>Recent Time Entries</CardTitle>
          <CardDescription>Your logged hours from this week</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {entriesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : weekEntries.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Time Entries This Week</h3>
              <p className="text-muted-foreground mb-4">Start logging your hours to track your work.</p>
              <Button onClick={() => setIsQuickEntryOpen(true)} className="border">
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Entry
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-border">
                {weekEntries.map((entry) => {
                  const isSelfLogged = !entry.logged_by || entry.logged_by === entry.team_member_id;
                  return (
                    <div key={entry.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{format(parseISO(entry.date + "T00:00:00"), "EEE, MMM d")}</span>
                            <Badge variant={entry.billable ? "default" : "secondary"} className="text-xs">
                              {entry.hours}h
                            </Badge>
                            {!isSelfLogged && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 gap-1">
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
                          </div>
                          {entry.project && (
                            <Link
                              to={getOrgPath(`/projects/${entry.project.display_id}`)}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Briefcase className="h-3 w-3" />
                              {entry.project.name}
                            </Link>
                          )}
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditEntry(entry)}
                            title="Edit entry"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDuplicateEntry(entry)}
                            title="Duplicate entry"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEntry(entry)}
                            disabled={deleteTimeEntry.isPending}
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="font-semibold uppercase text-xs">Date</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Project</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Description</TableHead>
                      <TableHead className="font-semibold uppercase text-xs w-[80px]">Hours</TableHead>
                      <TableHead className="font-semibold uppercase text-xs w-[120px]">Type</TableHead>
                      <TableHead className="font-semibold uppercase text-xs w-[100px]">Logged By</TableHead>
                      <TableHead className="font-semibold uppercase text-xs w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekEntries.map((entry) => {
                      const isSelfLogged = !entry.logged_by || entry.logged_by === entry.team_member_id;
                      return (
                        <TableRow key={entry.id} className="border-b border-border hover:bg-muted/30">
                          <TableCell>
                            <span className="font-medium">{format(parseISO(entry.date + "T00:00:00"), "EEE, MMM d")}</span>
                          </TableCell>
                          <TableCell>
                            {entry.project ? (
                              <Link
                                to={getOrgPath(`/projects/${entry.project.display_id}`)}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <Briefcase className="h-3 w-3" />
                                <span className="truncate max-w-[150px]" title={entry.project.name}>
                                  {entry.project.name}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={entry.description || ""}>
                              {entry.description || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.hours}h</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.billable ? "default" : "outline"}>
                              {entry.billable ? "Billable" : "Non-Billable"}
                            </Badge>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditEntry(entry)}
                                title="Edit entry"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDuplicateEntry(entry)}
                                title="Duplicate entry"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteEntry(entry)}
                                disabled={deleteTimeEntry.isPending}
                                title="Delete entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
    </div>
  );
}
