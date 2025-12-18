import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Target,
  TrendingUp,
  DollarSign,
  BarChart3,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  Users,
  Clock,
  Trophy,
  PieChart,
  Activity,
  Briefcase,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Timer,
  Flame,
} from "lucide-react";
import {
  useQuarterlyGoals,
  useCreateQuarterlyGoal,
  useUpdateQuarterlyGoal,
  useDeleteQuarterlyGoal,
  useFinancialSummary,
  useMaintenanceProjects,
  useServicesKPIs,
  calculateProjectionScenario,
  calculateBreakeven,
  QuarterlyGoal,
} from "@/hooks/useProjections";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

export default function Projections() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<QuarterlyGoal | null>(null);
  const [kpiPeriod, setKpiPeriod] = useState(12); // months

  // Projection calculator state
  const [targetRevenue, setTargetRevenue] = useState("1000000");
  const [avgProjectValue, setAvgProjectValue] = useState("");
  const [profitMargin, setProfitMargin] = useState("30");

  // Breakeven calculator state
  const [fixedCosts, setFixedCosts] = useState("50000");
  const [variableCostPercent, setVariableCostPercent] = useState("40");

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    quarter: "1",
    revenue_target: "",
    projects_target: "",
    new_clients_target: "",
    profit_margin_target: "",
    notes: "",
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuarterlyGoals(selectedYear);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: maintenanceProjects = [] } = useMaintenanceProjects();
  const { data: kpis, isLoading: kpisLoading } = useServicesKPIs(kpiPeriod);
  const createGoal = useCreateQuarterlyGoal();
  const updateGoal = useUpdateQuarterlyGoal();
  const deleteGoal = useDeleteQuarterlyGoal();

  // Use actual average if available
  const effectiveAvgValue = avgProjectValue
    ? parseFloat(avgProjectValue.replace(/[$,]/g, ""))
    : summary?.avgProjectValue || 50000;

  const projectionResult = useMemo(() => {
    return calculateProjectionScenario(
      parseFloat(targetRevenue.replace(/[$,]/g, "")) || 0,
      effectiveAvgValue,
      parseFloat(profitMargin) || 0
    );
  }, [targetRevenue, effectiveAvgValue, profitMargin]);

  const breakevenResult = useMemo(() => {
    return calculateBreakeven(
      parseFloat(fixedCosts.replace(/[$,]/g, "")) || 0,
      effectiveAvgValue,
      parseFloat(variableCostPercent) || 0
    );
  }, [fixedCosts, effectiveAvgValue, variableCostPercent]);

  const maintenanceTotal = useMemo(() => {
    return maintenanceProjects.reduce(
      (acc, p) => ({
        monthly: acc.monthly + p.monthlyAmount,
        yearly: acc.yearly + p.yearlyAmount,
      }),
      { monthly: 0, yearly: 0 }
    );
  }, [maintenanceProjects]);

  const handleCreateGoal = () => {
    createGoal.mutate(
      {
        year: selectedYear,
        quarter: parseInt(goalForm.quarter),
        revenue_target: parseFloat(goalForm.revenue_target.replace(/[$,]/g, "")) || 0,
        projects_target: parseInt(goalForm.projects_target) || 0,
        new_clients_target: parseInt(goalForm.new_clients_target) || 0,
        profit_margin_target: parseFloat(goalForm.profit_margin_target) || 0,
        notes: goalForm.notes || null,
      },
      {
        onSuccess: () => {
          setIsGoalSheetOpen(false);
          resetGoalForm();
        },
      }
    );
  };

  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    updateGoal.mutate(
      {
        id: editingGoal.id,
        revenue_target: parseFloat(goalForm.revenue_target.replace(/[$,]/g, "")) || 0,
        projects_target: parseInt(goalForm.projects_target) || 0,
        new_clients_target: parseInt(goalForm.new_clients_target) || 0,
        profit_margin_target: parseFloat(goalForm.profit_margin_target) || 0,
        notes: goalForm.notes || null,
      },
      {
        onSuccess: () => {
          setIsGoalSheetOpen(false);
          setEditingGoal(null);
          resetGoalForm();
        },
      }
    );
  };

  const resetGoalForm = () => {
    setGoalForm({
      quarter: "1",
      revenue_target: "",
      projects_target: "",
      new_clients_target: "",
      profit_margin_target: "",
      notes: "",
    });
  };

  const openEditGoal = (goal: QuarterlyGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      quarter: goal.quarter.toString(),
      revenue_target: goal.revenue_target.toString(),
      projects_target: goal.projects_target.toString(),
      new_clients_target: goal.new_clients_target.toString(),
      profit_margin_target: goal.profit_margin_target.toString(),
      notes: goal.notes || "",
    });
    setIsGoalSheetOpen(true);
  };

  const quarterNames = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projections & Goals</h1>
          <p className="text-muted-foreground">
            Financial projections, what-if scenarios, and quarterly goals
          </p>
        </div>
      </div>

      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="kpis" className="gap-2">
            <Activity className="h-4 w-4 hidden sm:inline" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4 hidden sm:inline" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4 hidden sm:inline" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4 hidden sm:inline" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="h-4 w-4 hidden sm:inline" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center gap-4">
            <Label>Period:</Label>
            <Select
              value={kpiPeriod.toString()}
              onValueChange={(v) => setKpiPeriod(parseInt(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kpisLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : kpis ? (
            <>
              {/* Revenue & Profitability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Revenue & Profitability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-sm text-muted-foreground">Total Invoiced</div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">Last {kpiPeriod} months</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Paid</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.paidRevenue)}</div>
                      <p className="text-xs text-muted-foreground">Collected</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Outstanding</div>
                      <div className={`text-2xl font-bold ${kpis.outstandingRevenue > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {formatCurrency(kpis.outstandingRevenue)}
                      </div>
                      <p className="text-xs text-muted-foreground">Sent + Overdue</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Revenue per Employee</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.revenuePerEmployee)}</div>
                      <p className="text-xs text-muted-foreground">Per team member</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Gross Profit</div>
                      <div className={`text-2xl font-bold ${kpis.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(kpis.grossProfit)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.grossMargin.toFixed(1)}% margin
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Net Profit</div>
                      <div className={`text-2xl font-bold ${kpis.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(kpis.netProfit)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.netMargin.toFixed(1)}% margin
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Avg Project Value</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.avgProjectValue)}</div>
                      <p className="text-xs text-muted-foreground">Per completed project</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Collection Rate</div>
                      <div className={`text-2xl font-bold ${kpis.totalRevenue > 0 && (kpis.paidRevenue / kpis.totalRevenue) >= 0.8 ? "text-green-600" : "text-yellow-600"}`}>
                        {kpis.totalRevenue > 0 ? ((kpis.paidRevenue / kpis.totalRevenue) * 100).toFixed(0) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Paid / Total Invoiced</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Customer Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <div className="text-sm text-muted-foreground">Customer Lifetime Value</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.customerLifetimeValue)}</div>
                      <p className="text-xs text-muted-foreground">Avg revenue per client</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <div className="text-sm text-muted-foreground">Customer Acquisition Cost</div>
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(kpis.customerAcquisitionCost)}</div>
                      <p className="text-xs text-muted-foreground">Marketing/sales cost per client</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-sm text-muted-foreground">LTV:CAC Ratio</div>
                      <div className={`text-2xl font-bold ${kpis.ltvCacRatio >= 3 ? "text-green-600" : kpis.ltvCacRatio >= 1 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.ltvCacRatio.toFixed(1)}x
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.ltvCacRatio >= 3 ? "Healthy" : kpis.ltvCacRatio >= 1 ? "Needs improvement" : "Warning"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Client Concentration</div>
                      <div className={`text-2xl font-bold ${kpis.clientConcentration <= 20 ? "text-green-600" : kpis.clientConcentration <= 40 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.clientConcentration.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Top client % of revenue</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3 mt-4">
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">Total Clients</span>
                      <span className="font-bold">{kpis.totalClients}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">New Clients ({kpiPeriod}mo)</span>
                      <span className="font-bold">{kpis.newClientsThisPeriod}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">Repeat Client Rate</span>
                      <span className="font-bold">{kpis.repeatClientRate.toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Sales Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                      <div className={`text-2xl font-bold ${kpis.winRate >= 30 ? "text-green-600" : "text-yellow-600"}`}>
                        {kpis.winRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Quotes won / decided</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Average Deal Size</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.avgDealSize)}</div>
                      <p className="text-xs text-muted-foreground">Per won quote</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Pipeline Value</div>
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(kpis.pipelineValue)}</div>
                      <p className="text-xs text-muted-foreground">Active quotes</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Quote Conversion</div>
                      <div className="text-2xl font-bold">{kpis.quoteConversionRate.toFixed(0)}%</div>
                      <p className="text-xs text-muted-foreground">Quotes → Projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team & Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Team & Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Billable Utilization</div>
                      <div className={`text-2xl font-bold ${kpis.billableUtilization >= 70 ? "text-green-600" : kpis.billableUtilization >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.billableUtilization.toFixed(0)}%
                      </div>
                      <Progress value={kpis.billableUtilization} className="h-2 mt-2" />
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Avg Hourly Rate</div>
                      <div className="text-2xl font-bold">${kpis.avgHourlyRate.toFixed(0)}/hr</div>
                      <p className="text-xs text-muted-foreground">Revenue / billable hours</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Team Size</div>
                      <div className="text-2xl font-bold">{kpis.totalEmployees}</div>
                      <p className="text-xs text-muted-foreground">Active members</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Cost per Employee</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.costPerEmployee)}</div>
                      <p className="text-xs text-muted-foreground">Avg salary</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Billable Hours</span>
                        <span className="font-bold">{kpis.totalBillableHours.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={(kpis.totalBillableHours / (kpis.totalBillableHours + kpis.totalNonBillableHours || 1)) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Non-Billable Hours</span>
                        <span className="font-bold">{kpis.totalNonBillableHours.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={(kpis.totalNonBillableHours / (kpis.totalBillableHours + kpis.totalNonBillableHours || 1)) * 100}
                        className="h-2 bg-orange-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" />
                    Project Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Avg Project Duration</div>
                      <div className="text-2xl font-bold">{kpis.avgProjectDuration.toFixed(0)} days</div>
                      <p className="text-xs text-muted-foreground">Start to completion</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                      <div className={`text-2xl font-bold ${kpis.onTimeDeliveryRate >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                        {kpis.onTimeDeliveryRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Delivered by deadline</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Backlog</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.backlogValue)}</div>
                      <p className="text-xs text-muted-foreground">~{kpis.backlogMonths.toFixed(1)} months of work</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Capacity Utilization</div>
                      <div className={`text-2xl font-bold ${kpis.capacityUtilization >= 80 ? "text-green-600" : kpis.capacityUtilization >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.capacityUtilization.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Total hours tracked</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3 mt-4">
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">Total Projects</span>
                      <span className="font-bold">{kpis.totalProjects}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">Active</span>
                      <span className="font-bold text-blue-600">{kpis.activeProjects}</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="font-bold text-green-600">{kpis.completedProjects}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Burn Rate & Cash Flow */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Burn Rate & Cash Flow
                  </CardTitle>
                  <CardDescription>
                    Monthly cash outflow and runway analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Gross Burn Rate</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.grossBurnRate)}</div>
                      <p className="text-xs text-muted-foreground">Total monthly expenses</p>
                    </div>
                    <div className={`p-4 border rounded-lg ${kpis.netBurnRate <= 0 ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                      <div className="text-sm text-muted-foreground">Net Burn Rate</div>
                      <div className={`text-2xl font-bold ${kpis.netBurnRate <= 0 ? "text-green-600" : "text-red-600"}`}>
                        {kpis.netBurnRate <= 0 ? "+" : ""}{formatCurrency(Math.abs(kpis.netBurnRate))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.netBurnRate <= 0 ? "Net positive (profitable)" : "Net cash outflow"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue / 12)}</div>
                      <p className="text-xs text-muted-foreground">Avg over period</p>
                    </div>
                    <div className={`p-4 border rounded-lg ${kpis.runwayMonths >= 12 ? "bg-green-50 dark:bg-green-950/30" : kpis.runwayMonths >= 6 ? "bg-yellow-50 dark:bg-yellow-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                      <div className="text-sm text-muted-foreground">Runway</div>
                      <div className={`text-2xl font-bold ${kpis.runwayMonths >= 12 ? "text-green-600" : kpis.runwayMonths >= 6 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.runwayMonths >= 999 ? "∞" : `${kpis.runwayMonths.toFixed(1)} mo`}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.runwayMonths >= 999 ? "Profitable - unlimited" : "At current burn rate"}
                      </p>
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Monthly Expense Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-500" />
                          <span className="text-sm">Payroll</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min((kpis.monthlyPayroll / (kpis.grossBurnRate || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-24 text-right">{formatCurrency(kpis.monthlyPayroll)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-500" />
                          <span className="text-sm">Overhead</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min((kpis.monthlyOverhead / (kpis.grossBurnRate || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-24 text-right">{formatCurrency(kpis.monthlyOverhead)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-orange-500" />
                          <span className="text-sm">Operating</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${Math.min((kpis.monthlyOperatingExpenses / (kpis.grossBurnRate || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-24 text-right">{formatCurrency(kpis.monthlyOperatingExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-teal-500" />
                    Financial Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Overhead Ratio</div>
                      <div className={`text-2xl font-bold ${kpis.overheadRatio <= 20 ? "text-green-600" : kpis.overheadRatio <= 35 ? "text-yellow-600" : "text-red-600"}`}>
                        {kpis.overheadRatio.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Of revenue (target: &lt;20%)</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Recurring Revenue
                      </div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.recurringRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {kpis.recurringRevenueRatio.toFixed(0)}% of total
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Cash Reserves</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.cashReserves)}</div>
                      <p className="text-xs text-muted-foreground">From recurring revenue</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Monthly Recurring</div>
                      <div className="text-2xl font-bold">{formatCurrency(kpis.recurringRevenue / 12)}</div>
                      <p className="text-xs text-muted-foreground">Predictable income</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Benchmarks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    KPI Benchmarks (Services Industry)
                  </CardTitle>
                  <CardDescription>
                    How your metrics compare to industry standards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Gross Margin", value: kpis.grossMargin, benchmark: 50, unit: "%" },
                      { name: "Net Margin", value: kpis.netMargin, benchmark: 15, unit: "%" },
                      { name: "Billable Utilization", value: kpis.billableUtilization, benchmark: 70, unit: "%" },
                      { name: "LTV:CAC Ratio", value: kpis.ltvCacRatio, benchmark: 3, unit: "x" },
                      { name: "Win Rate", value: kpis.winRate, benchmark: 30, unit: "%" },
                      { name: "On-Time Delivery", value: kpis.onTimeDeliveryRate, benchmark: 85, unit: "%" },
                    ].map((metric) => {
                      const performance = (metric.value / metric.benchmark) * 100;
                      const isGood = performance >= 100;
                      const isWarning = performance >= 70 && performance < 100;
                      return (
                        <div key={metric.name} className="flex items-center gap-4">
                          <div className="w-40 text-sm">{metric.name}</div>
                          <div className="flex-1">
                            <Progress
                              value={Math.min(performance, 150)}
                              className="h-3"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <span className={`font-semibold ${isGood ? "text-green-600" : isWarning ? "text-yellow-600" : "text-red-600"}`}>
                              {metric.value.toFixed(1)}{metric.unit}
                            </span>
                          </div>
                          <div className="w-20 text-right text-sm text-muted-foreground">
                            Target: {metric.benchmark}{metric.unit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
              <p className="text-sm mt-1">Add projects, clients, and track time to see KPIs</p>
            </div>
          )}
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Projections Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Revenue Projections
                </CardTitle>
                <CardDescription>
                  Calculate how many projects you need to hit your revenue goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="targetRevenue">Target Revenue ($)</Label>
                    <Input
                      id="targetRevenue"
                      placeholder="1,000,000"
                      value={targetRevenue}
                      onChange={(e) => setTargetRevenue(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avgProjectValue">
                      Avg Project Value ($)
                      {summary?.avgProjectValue && !avgProjectValue && (
                        <span className="text-muted-foreground ml-2">
                          (Using actual: {formatCurrency(summary.avgProjectValue)})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="avgProjectValue"
                      placeholder={summary?.avgProjectValue ? formatCurrency(summary.avgProjectValue) : "50,000"}
                      value={avgProjectValue}
                      onChange={(e) => setAvgProjectValue(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                    <Input
                      id="profitMargin"
                      placeholder="30"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(e.target.value)}
                      className="border-2"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Results</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Projects Needed:</span>
                      <span className="font-bold text-lg">
                        {projectionResult.projectsNeeded.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Monthly Revenue:</span>
                      <span className="font-semibold">
                        {formatCurrency(projectionResult.monthlyRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Projects per Month:</span>
                      <span className="font-semibold">
                        {projectionResult.monthlyProjects.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <span>Gross Profit:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(projectionResult.grossProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breakeven Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Breakeven Analysis
                </CardTitle>
                <CardDescription>
                  Calculate how many projects to cover your costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="fixedCosts">Monthly Fixed Costs ($)</Label>
                    <Input
                      id="fixedCosts"
                      placeholder="50,000"
                      value={fixedCosts}
                      onChange={(e) => setFixedCosts(e.target.value)}
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Salaries, rent, software, etc.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="variableCostPercent">Variable Cost per Project (%)</Label>
                    <Input
                      id="variableCostPercent"
                      placeholder="40"
                      value={variableCostPercent}
                      onChange={(e) => setVariableCostPercent(e.target.value)}
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      % of project value spent on delivery
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Breakeven Point</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <span>Projects to Breakeven:</span>
                      <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                        {breakevenResult.breakevenProjects.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Revenue to Breakeven:</span>
                      <span className="font-semibold">
                        {formatCurrency(breakevenResult.breakevenRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Contribution Margin:</span>
                      <span className="font-semibold">
                        {formatCurrency(effectiveAvgValue * (1 - (parseFloat(variableCostPercent) || 0) / 100))}
                        <span className="text-muted-foreground"> per project</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Quick Scenarios
              </CardTitle>
              <CardDescription>
                Common revenue milestones and what it takes to get there
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { target: 100000, label: "$100K" },
                  { target: 250000, label: "$250K" },
                  { target: 500000, label: "$500K" },
                  { target: 1000000, label: "$1M" },
                ].map((scenario) => {
                  const result = calculateProjectionScenario(
                    scenario.target,
                    effectiveAvgValue,
                    parseFloat(profitMargin) || 30
                  );
                  return (
                    <div
                      key={scenario.target}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setTargetRevenue(scenario.target.toString())}
                    >
                      <div className="text-2xl font-bold">{scenario.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.projectsNeeded} projects
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.monthlyProjects.toFixed(1)}/month
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Profit: {formatCurrency(result.grossProfit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Sheet
              open={isGoalSheetOpen}
              onOpenChange={(open) => {
                setIsGoalSheetOpen(open);
                if (!open) {
                  setEditingGoal(null);
                  resetGoalForm();
                }
              }}
            >
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{editingGoal ? "Edit" : "Add"} Quarterly Goal</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  {!editingGoal && (
                    <div className="grid gap-2">
                      <Label>Quarter</Label>
                      <Select
                        value={goalForm.quarter}
                        onValueChange={(v) => setGoalForm({ ...goalForm, quarter: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((q) => (
                            <SelectItem
                              key={q}
                              value={q.toString()}
                              disabled={goals.some((g) => g.quarter === q)}
                            >
                              {quarterNames[q - 1]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Revenue Target ($)</Label>
                    <Input
                      placeholder="250,000"
                      value={goalForm.revenue_target}
                      onChange={(e) => setGoalForm({ ...goalForm, revenue_target: e.target.value })}
                      className="border-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Projects Target</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={goalForm.projects_target}
                      onChange={(e) => setGoalForm({ ...goalForm, projects_target: e.target.value })}
                      className="border-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>New Clients Target</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={goalForm.new_clients_target}
                      onChange={(e) => setGoalForm({ ...goalForm, new_clients_target: e.target.value })}
                      className="border-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Profit Margin Target (%)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={goalForm.profit_margin_target}
                      onChange={(e) => setGoalForm({ ...goalForm, profit_margin_target: e.target.value })}
                      className="border-2"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Key initiatives, focus areas..."
                      value={goalForm.notes}
                      onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                      className="border-2"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                    disabled={createGoal.isPending || updateGoal.isPending}
                  >
                    {(createGoal.isPending || updateGoal.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingGoal ? "Update Goal" : "Create Goal"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {goalsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((quarter) => {
                const goal = goals.find((g) => g.quarter === quarter);
                const isCurrentQuarter = selectedYear === currentYear && quarter === currentQuarter;

                return (
                  <Card
                    key={quarter}
                    className={isCurrentQuarter ? "border-primary border-2" : ""}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Q{quarter}
                          {isCurrentQuarter && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </CardTitle>
                        {goal && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditGoal(goal)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Delete this goal?")) {
                                  deleteGoal.mutate(goal.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardDescription>
                        {quarterNames[quarter - 1].split(" ")[1]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {goal ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Revenue</span>
                              <span className="font-medium">
                                {formatCurrency(goal.revenue_target)}
                              </span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-muted rounded">
                              <div className="text-muted-foreground">Projects</div>
                              <div className="font-semibold">{goal.projects_target}</div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                              <div className="text-muted-foreground">New Clients</div>
                              <div className="font-semibold">{goal.new_clients_target}</div>
                            </div>
                          </div>
                          <div className="p-2 bg-muted rounded text-sm">
                            <div className="text-muted-foreground">Profit Margin</div>
                            <div className="font-semibold">{goal.profit_margin_target}%</div>
                          </div>
                          {goal.notes && (
                            <p className="text-xs text-muted-foreground">{goal.notes}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No goal set</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setGoalForm({ ...goalForm, quarter: quarter.toString() });
                              setIsGoalSheetOpen(true);
                            }}
                          >
                            Set Goal
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Yearly Summary */}
          {goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedYear} Annual Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Revenue Target</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(goals.reduce((sum, g) => sum + g.revenue_target, 0))}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Projects Target</div>
                    <div className="text-2xl font-bold">
                      {goals.reduce((sum, g) => sum + g.projects_target, 0)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total New Clients Target</div>
                    <div className="text-2xl font-bold">
                      {goals.reduce((sum, g) => sum + g.new_clients_target, 0)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Avg Profit Margin Target</div>
                    <div className="text-2xl font-bold">
                      {(
                        goals.reduce((sum, g) => sum + g.profit_margin_target, 0) / goals.length
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Maintenance Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(maintenanceTotal.monthly)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recurring from {maintenanceProjects.length} projects
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Annual Maintenance Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(maintenanceTotal.yearly)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Projected yearly total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projects with Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maintenanceProjects.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active maintenance contracts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Contracts</CardTitle>
              <CardDescription>
                Projects with recurring maintenance payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No maintenance contracts yet</p>
                  <p className="text-sm mt-1">
                    Add maintenance to completed projects from the Projects page
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceProjects.map((project) => (
                    <div
                      key={project.projectId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-muted-foreground">
                          Started: {project.startDate || "Not set"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(project.monthlyAmount)}/month
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(project.yearlyAmount)}/year
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {summaryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {summary.completedProjects} completed projects
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Avg Project Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summary.avgProjectValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on completed projects
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Avg Profit Margin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${summary.avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {summary.avgProfitMargin.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Revenue minus budget
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Pipeline Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(summary.pipelineValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.activeProjects} active projects
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Total Projects</span>
                      <span className="font-bold">{summary.totalProjects}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Active Projects</span>
                      <span className="font-bold">{summary.activeProjects}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Completed Projects</span>
                      <span className="font-bold">{summary.completedProjects}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Total Clients</span>
                      <span className="font-bold">{summary.totalClients}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <span>Monthly Maintenance</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(summary.monthlyMaintenanceRevenue)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Project Revenue</span>
                        <span>{formatCurrency(summary.totalRevenue)}</span>
                      </div>
                      <Progress
                        value={
                          summary.totalRevenue + summary.yearlyMaintenanceRevenue > 0
                            ? (summary.totalRevenue / (summary.totalRevenue + summary.yearlyMaintenanceRevenue)) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Maintenance Revenue (Yearly)</span>
                        <span>{formatCurrency(summary.yearlyMaintenanceRevenue)}</span>
                      </div>
                      <Progress
                        value={
                          summary.totalRevenue + summary.yearlyMaintenanceRevenue > 0
                            ? (summary.yearlyMaintenanceRevenue / (summary.totalRevenue + summary.yearlyMaintenanceRevenue)) * 100
                            : 0
                        }
                        className="h-2 bg-green-200"
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total (incl. Maintenance)</span>
                      <span>{formatCurrency(summary.totalRevenue + summary.yearlyMaintenanceRevenue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
