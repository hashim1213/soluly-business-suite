/**
 * Audit Log Page
 * Admin view for security events and compliance monitoring
 */

import { useState, useMemo } from "react";
import { format } from "date-fns";
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
import {
  Shield,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Activity,
  Calendar,
  User,
  Eye,
  Filter,
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
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 50;

export default function AuditLog() {
  const { organization, hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: teamMembers } = useTeamMembers();
  const { data: stats, isLoading: statsLoading } = useAuditLogStats();
  const { data: auditData, isLoading: logsLoading } = useAuditLog(filters, {
    page,
    pageSize: PAGE_SIZE,
  });

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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Log
          </h1>
          <p className="text-muted-foreground">
            Security events and activity monitoring for compliance
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="border-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Total Events</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? "-" : stats?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last 24 Hours</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? "-" : stats?.last24Hours.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">High Risk</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading
                ? "-"
                : (
                    (stats?.byRiskLevel.high || 0) +
                    (stats?.byRiskLevel.critical || 0)
                  ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last 7 Days</span>
            </div>
            <p className="text-2xl font-bold">
              {statsLoading ? "-" : stats?.last7Days.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2">
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
                <SelectTrigger className="w-48 border-2">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent className="border-2">
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
                <SelectTrigger className="w-36 border-2">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent className="border-2">
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
                <SelectTrigger className="w-48 border-2">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent className="border-2">
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
                className="w-36 border-2"
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
                className="w-36 border-2"
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
      <Card className="border-2">
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
