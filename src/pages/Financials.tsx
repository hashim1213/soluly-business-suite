import { useState } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useFinancialsOverview, ProjectFinancials } from "@/hooks/useFinancials";
import { useBusinessCostsSummary, BUSINESS_COST_CATEGORIES } from "@/hooks/useBusinessCosts";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Building,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectStatusStyles } from "@/lib/styles";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export default function Financials() {
  const { navigateOrg } = useOrgNavigation();
  const { data: financials, isLoading, error } = useFinancialsOverview();
  const { data: businessCostsSummary } = useBusinessCostsSummary();
  const canViewAmounts = useCanViewAmounts();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof ProjectFinancials>("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Helper to format currency with permission check
  const safeFormatCurrency = (value: number) => {
    if (!canViewAmounts) return "••••••";
    return formatCurrency(value);
  };

  // Calculate combined financials with business costs
  const totalBusinessCosts = businessCostsSummary?.totalAmount || 0;
  const combinedProfit = (financials?.totalProfit || 0) - totalBusinessCosts;
  const combinedCosts = (financials?.totalCosts || 0) + totalBusinessCosts;

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
        <p className="text-destructive">Failed to load financial data</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!financials) {
    return null;
  }

  // Filter and sort projects
  const filteredProjects = financials.projects.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const handleSort = (column: keyof ProjectFinancials) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">
          Overview of project finances, revenue, and profitability
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-blue-600">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">
                  {safeFormatCurrency(financials.totalProjectValue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Project Value
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-emerald-600">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">
                  {safeFormatCurrency(financials.totalPaid)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Revenue Collected
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-amber-500">
                <Receipt className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">
                  {safeFormatCurrency(financials.totalOutstanding)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Outstanding
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 border-2 border-border flex items-center justify-center ${
                  financials.totalProfit >= 0 ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {financials.totalProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-white" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    financials.totalProfit >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {safeFormatCurrency(financials.totalProfit)}
                </div>
                <div className="text-sm text-muted-foreground">Net Profit</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Costs Summary */}
      {totalBusinessCosts > 0 && (
        <Card className="border-2 border-border shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-orange-500">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Business Operating Costs</div>
                  <div className="text-xl font-bold font-mono">
                    {safeFormatCurrency(totalBusinessCosts)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Combined Net Profit</div>
                  <div className={`text-xl font-bold font-mono ${combinedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {safeFormatCurrency(combinedProfit)}
                  </div>
                </div>
                <Button variant="outline" className="border-2" onClick={() => navigateOrg("/expenses")}>
                  View Expenses
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Project Costs</div>
            <div className="text-xl font-bold font-mono">
              {safeFormatCurrency(financials.totalCosts)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Labor: {safeFormatCurrency(financials.totalLaborCosts)} | Other:{" "}
              {safeFormatCurrency(financials.totalNonLaborCosts)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Avg. Margin</div>
            <div
              className={`text-xl font-bold font-mono ${
                financials.averageMargin >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatPercent(financials.averageMargin)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Invoiced</div>
            <div className="text-xl font-bold font-mono">
              {safeFormatCurrency(financials.totalInvoiced)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active Projects</div>
            <div className="text-xl font-bold">
              {financials.projects.filter((p) => p.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Table */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project Financials
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-2">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="border-2">
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedProjects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border">
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      Project{" "}
                      {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("value")}
                    >
                      Value{" "}
                      {sortBy === "value" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("paid")}
                    >
                      Revenue{" "}
                      {sortBy === "paid" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("costs")}
                    >
                      Costs{" "}
                      {sortBy === "costs" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("profit")}
                    >
                      Profit{" "}
                      {sortBy === "profit" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("margin")}
                    >
                      Margin{" "}
                      {sortBy === "margin" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="border-b-2 border-border cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigateOrg(`/projects/${project.display_id}`)
                      }
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {project.client_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            projectStatusStyles[
                              project.status as keyof typeof projectStatusStyles
                            ] || "bg-slate-400 text-black"
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {safeFormatCurrency(project.value)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {safeFormatCurrency(project.paid)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {safeFormatCurrency(project.costs)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          project.profit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {project.profit >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {safeFormatCurrency(project.profit)}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          project.margin >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercent(project.margin)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Totals Row */}
        {sortedProjects.length > 0 && (
          <div className="border-t-2 border-border bg-muted/30 p-4">
            <div className="grid grid-cols-7 text-sm font-medium">
              <div>
                <span className="text-muted-foreground">Total</span> (
                {sortedProjects.length} projects)
              </div>
              <div></div>
              <div className="text-right font-mono">
                {safeFormatCurrency(
                  sortedProjects.reduce((sum, p) => sum + p.value, 0)
                )}
              </div>
              <div className="text-right font-mono">
                {safeFormatCurrency(
                  sortedProjects.reduce((sum, p) => sum + p.paid, 0)
                )}
              </div>
              <div className="text-right font-mono">
                {safeFormatCurrency(
                  sortedProjects.reduce((sum, p) => sum + p.costs, 0)
                )}
              </div>
              <div
                className={`text-right font-mono ${
                  sortedProjects.reduce((sum, p) => sum + p.profit, 0) >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {safeFormatCurrency(
                  sortedProjects.reduce((sum, p) => sum + p.profit, 0)
                )}
              </div>
              <div></div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
