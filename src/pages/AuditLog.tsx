/**
 * Audit Log Page
 * Admin view for security events, business-data changes, and compliance monitoring
 */

import { Fragment, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Activity,
  Calendar,
  User,
  Eye,
  Database,
} from "lucide-react";
import {
  useAuditLog,
  useAuditLogStats,
  exportAuditLogCSV,
  eventTypeLabels,
  riskLevelConfig,
  SecurityEvent,
  SecurityEventType,
  RiskLevel,
  AuditLogFilters,
} from "@/hooks/useAuditLog";
import {
  useDataAuditLogs,
  getChangedFields,
  formatAuditValue,
  formatResourceType,
  dataAuditActionConfig,
  DataAuditAction,
  DataAuditFilters,
} from "@/hooks/useDataAuditLogs";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 50;

export default function AuditLog() {
  const { organization, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("security");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Data changes tab state
  const [dataFilters, setDataFilters] = useState<DataAuditFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data: teamMembers } = useTeamMembers();
  const { data: stats, isLoading: statsLoading } = useAuditLogStats();
  const { data: auditData, isLoading: logsLoading } = useAuditLog(filters, {
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: dataAuditLogs, isLoading: dataLogsLoading } =
    useDataAuditLogs(dataFilters);

  // Resource type options accumulate from loaded data so the select
  // stays populated even while a resource filter is applied
  const seenResourceTypesRef = useRef<Set<string>>(new Set());
  const resourceTypes = useMemo(() => {
    dataAuditLogs?.forEach((entry) =>
      seenResourceTypesRef.current.add(entry.resource_type)
    );
    return Array.from(seenResourceTypesRef.current).sort();
  }, [dataAuditLogs]);

  const canViewAuditLog = hasPermission("settings", "manage_org");

  const totalPages = Math.ceil((auditData?.total || 0) / PAGE_SIZE);

  const handleExport = async () => {
    if (!organization?.id) return;

    setIsExporting(true);
    try {
      const csv = await exportAuditLogCSV(organization.id, filters);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Audit log exported successfully");
    } catch (error) {
      toast.error("Failed to export audit log");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "all"
  );

  const clearDataFilters = () => {
    setDataFilters({});
    setExpandedRowId(null);
  };

  const hasActiveDataFilters = Object.values(dataFilters).some(
    (v) => v && v !== "all"
  );

  if (!canViewAuditLog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to view the audit log.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Log
          </h1>
          <p className="text-muted-foreground">
            Security events and activity monitoring for compliance
          </p>
        </div>
        {activeTab === "security" && (
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="border"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="border">
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            Security Events
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm">
            Data Changes
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------- */}
        {/* Security Events tab (existing functionality, unchanged)        */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="security" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Total Events</span>
                </div>
                <p className="text-2xl font-semibold">
                  {statsLoading ? "-" : stats?.total.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Last 24 Hours</span>
                </div>
                <p className="text-2xl font-semibold">
                  {statsLoading ? "-" : stats?.last24Hours.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">High Risk</span>
                </div>
                <p className="text-2xl font-semibold">
                  {statsLoading
                    ? "-"
                    : (
                        (stats?.byRiskLevel.high || 0) +
                        (stats?.byRiskLevel.critical || 0)
                      ).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Last 7 Days</span>
                </div>
                <p className="text-2xl font-semibold">
                  {statsLoading ? "-" : stats?.last7Days.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Event Type</Label>
                  <Select
                    value={filters.eventType || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, eventType: value as SecurityEventType | "all" })
                    }
                  >
                    <SelectTrigger className="w-48 border">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="all">All Events</SelectItem>
                      {Object.entries(eventTypeLabels).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Risk Level</Label>
                  <Select
                    value={filters.riskLevel || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, riskLevel: value as RiskLevel | "all" })
                    }
                  >
                    <SelectTrigger className="w-36 border">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="all">All Levels</SelectItem>
                      {Object.entries(riskLevelConfig).map(([level, config]) => (
                        <SelectItem key={level} value={level}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <Select
                    value={filters.userId || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        userId: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-48 border">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="all">All Users</SelectItem>
                      {teamMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value || undefined })
                    }
                    className="w-36 border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value || undefined })
                    }
                    className="w-36 border"
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card className="border">
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : auditData?.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Events Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters"
                      : "Security events will appear here"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData?.events.map((event) => {
                      const riskConfig = riskLevelConfig[event.risk_level];
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(event.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {eventTypeLabels[event.event_type] || event.event_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{event.team_member?.name || "System"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${riskConfig.bgColor} ${riskConfig.color} border-0`}
                            >
                              {riskConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {auditData && auditData.total > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(page * PAGE_SIZE, auditData.total)} of{" "}
                    {auditData.total} events
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* Data Changes tab (business-data audit trail)                    */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="data" className="space-y-6">
          {/* Filters */}
          <Card className="border">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Select
                    value={dataFilters.action || "all"}
                    onValueChange={(value) =>
                      setDataFilters({
                        ...dataFilters,
                        action: value as DataAuditAction | "all",
                      })
                    }
                  >
                    <SelectTrigger className="w-36 border">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="all">All Actions</SelectItem>
                      {Object.entries(dataAuditActionConfig).map(
                        ([action, config]) => (
                          <SelectItem key={action} value={action}>
                            {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Resource</Label>
                  <Select
                    value={dataFilters.resourceType || "all"}
                    onValueChange={(value) =>
                      setDataFilters({ ...dataFilters, resourceType: value })
                    }
                  >
                    <SelectTrigger className="w-48 border">
                      <SelectValue placeholder="All resources" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      <SelectItem value="all">All Resources</SelectItem>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatResourceType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Search</Label>
                  <Input
                    type="search"
                    placeholder="Resource, member, ID..."
                    value={dataFilters.search || ""}
                    onChange={(e) =>
                      setDataFilters({
                        ...dataFilters,
                        search: e.target.value || undefined,
                      })
                    }
                    className="w-48 border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dataFilters.dateFrom || ""}
                    onChange={(e) =>
                      setDataFilters({
                        ...dataFilters,
                        dateFrom: e.target.value || undefined,
                      })
                    }
                    className="w-36 border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dataFilters.dateTo || ""}
                    onChange={(e) =>
                      setDataFilters({
                        ...dataFilters,
                        dateTo: e.target.value || undefined,
                      })
                    }
                    className="w-36 border"
                  />
                </div>

                {hasActiveDataFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDataFilters}
                    className="text-muted-foreground"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Changes Table */}
          <Card className="border">
            <CardContent className="p-0">
              {dataLogsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !dataAuditLogs || dataAuditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Data Changes Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveDataFilters
                      ? "Try adjusting your filters"
                      : "Changes to business data will appear here"}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataAuditLogs.map((entry) => {
                        const actionConfig =
                          dataAuditActionConfig[entry.action] ??
                          dataAuditActionConfig.update;
                        const changedFields =
                          entry.action === "update"
                            ? getChangedFields(entry.old_values, entry.new_values)
                            : [];
                        const isExpanded = expandedRowId === entry.id;
                        const summaryValues =
                          entry.action === "insert"
                            ? entry.new_values
                            : entry.old_values;

                        return (
                          <Fragment key={entry.id}>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() =>
                                setExpandedRowId(isExpanded ? null : entry.id)
                              }
                            >
                              <TableCell className="py-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRowId(
                                      isExpanded ? null : entry.id
                                    );
                                  }}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "" : "-rotate-90"
                                    }`}
                                  />
                                </Button>
                              </TableCell>
                              <TableCell
                                className="text-muted-foreground whitespace-nowrap"
                                title={
                                  entry.created_at
                                    ? format(
                                        new Date(entry.created_at),
                                        "MMMM d, yyyy 'at' h:mm:ss a"
                                      )
                                    : undefined
                                }
                              >
                                {entry.created_at
                                  ? formatDistanceToNow(
                                      new Date(entry.created_at),
                                      { addSuffix: true }
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {entry.team_member?.name || "System"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`${actionConfig.bgColor} ${actionConfig.color} border-0`}
                                >
                                  {actionConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {formatResourceType(entry.resource_type)}
                                  </span>
                                  {entry.resource_id && (
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {entry.resource_id.slice(0, 8)}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {entry.action === "update"
                                  ? `${changedFields.length} field${
                                      changedFields.length === 1 ? "" : "s"
                                    } changed`
                                  : entry.action === "insert"
                                    ? "New record"
                                    : "Record deleted"}
                              </TableCell>
                            </TableRow>

                            {isExpanded && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell
                                  colSpan={6}
                                  className="bg-muted/40 p-4"
                                >
                                  {entry.action === "update" ? (
                                    changedFields.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        No field changes recorded.
                                      </p>
                                    ) : (
                                      <div className="rounded-md border bg-background overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-xs w-48">
                                                Field
                                              </TableHead>
                                              <TableHead className="text-xs">
                                                Old Value
                                              </TableHead>
                                              <TableHead className="text-xs">
                                                New Value
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {changedFields.map((change) => (
                                              <TableRow key={change.field}>
                                                <TableCell className="font-mono text-xs">
                                                  {change.field}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground break-all">
                                                  {formatAuditValue(
                                                    change.oldValue
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-xs break-all">
                                                  {formatAuditValue(
                                                    change.newValue
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )
                                  ) : (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                                        {entry.action === "insert"
                                          ? "Created with values"
                                          : "Deleted record values"}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                        {Object.entries(summaryValues || {})
                                          .filter(
                                            ([key, value]) =>
                                              key !== "updated_at" &&
                                              value !== null &&
                                              value !== ""
                                          )
                                          .map(([key, value]) => (
                                            <div key={key} className="text-xs">
                                              <span className="font-mono text-muted-foreground">
                                                {key}:{" "}
                                              </span>
                                              <span className="break-all">
                                                {formatAuditValue(value, 60)}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {dataAuditLogs.length} most recent change
                      {dataAuditLogs.length === 1 ? "" : "s"}
                      {dataAuditLogs.length >= 200 ? " (limited to 200)" : ""}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent &&
                format(
                  new Date(selectedEvent.created_at),
                  "MMMM d, yyyy 'at' h:mm:ss a"
                )}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Event Type
                  </Label>
                  <p className="font-medium">
                    {eventTypeLabels[selectedEvent.event_type]}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Risk Level
                  </Label>
                  <Badge
                    variant="secondary"
                    className={`${riskLevelConfig[selectedEvent.risk_level].bgColor} ${riskLevelConfig[selectedEvent.risk_level].color} border-0`}
                  >
                    {riskLevelConfig[selectedEvent.risk_level].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedEvent.team_member?.name || "System"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.team_member?.email}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    IP Address
                  </Label>
                  <p className="font-medium">
                    {selectedEvent.ip_address || "Not recorded"}
                  </p>
                </div>
              </div>

              {Object.keys(selectedEvent.event_details).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Additional Details
                  </Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedEvent.event_details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEvent.user_agent && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    User Agent
                  </Label>
                  <p className="text-sm text-muted-foreground break-all">
                    {selectedEvent.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
