import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Clock, Target, DollarSign, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, isAfter, isBefore } from "date-fns";

interface ProjectHealth {
  id: string;
  name: string;
  displayId: string;
  budgetUsedPct: number;
  timelineAdherencePct: number;
  taskCompletionPct: number;
  milestoneCompletionPct: number;
  healthScore: number;
  status: string;
  budget: number;
  totalCosts: number;
  totalInvoiced: number;
  hoursLogged: number;
  billableHours: number;
}

export function ProjectKPIs() {
  const { organization } = useAuth();
  const canViewAmounts = useCanViewAmounts();
  const { getOrgPath } = useOrgNavigation();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();

  const { data: allTasks } = useQuery({
    queryKey: ["kpi_tasks", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("project_tasks")
        .select("id, project_id, completed, due_date, assignee_id")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: allMilestones } = useQuery({
    queryKey: ["kpi_milestones", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("project_milestones")
        .select("id, project_id, completed, due_date, completed_at")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: allCosts } = useQuery({
    queryKey: ["kpi_costs", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("project_costs")
        .select("id, project_id, amount")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: allInvoices } = useQuery({
    queryKey: ["kpi_invoices", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("project_invoices")
        .select("id, project_id, amount, status")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: allTimeEntries } = useQuery({
    queryKey: ["kpi_time_entries", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("time_entries")
        .select("id, project_id, team_member_id, hours, billable")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const activeProjects = useMemo(
    () => projects?.filter(p => p.status === "active" || p.status === "pending" || p.status === "in_progress") || [],
    [projects]
  );

  const projectHealthData: ProjectHealth[] = useMemo(() => {
    if (!activeProjects.length) return [];

    return activeProjects.map(project => {
      const projectTasks = allTasks?.filter(t => t.project_id === project.id) || [];
      const completedTasks = projectTasks.filter(t => t.completed);
      const taskCompletionPct = projectTasks.length > 0
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;

      const projectMilestones = allMilestones?.filter(m => m.project_id === project.id) || [];
      const completedMilestones = projectMilestones.filter(m => m.completed);
      const milestoneCompletionPct = projectMilestones.length > 0
        ? Math.round((completedMilestones.length / projectMilestones.length) * 100)
        : 0;

      const projectCosts = allCosts?.filter(c => c.project_id === project.id) || [];
      const totalCosts = projectCosts.reduce((sum, c) => sum + c.amount, 0);

      const projectInvoices = allInvoices?.filter(i => i.project_id === project.id) || [];
      const totalInvoiced = projectInvoices.reduce((sum, i) => sum + i.amount, 0);

      const projectTimeEntries = allTimeEntries?.filter(t => t.project_id === project.id) || [];
      const hoursLogged = projectTimeEntries.reduce((sum, t) => sum + t.hours, 0);
      const billableHours = projectTimeEntries.filter(t => t.billable).reduce((sum, t) => sum + t.hours, 0);

      const budgetUsedPct = project.budget > 0
        ? Math.round((totalCosts / project.budget) * 100)
        : 0;

      let timelineAdherencePct = 100;
      if (project.start_date && project.end_date) {
        const totalDays = differenceInDays(parseISO(project.end_date), parseISO(project.start_date));
        const daysElapsed = differenceInDays(new Date(), parseISO(project.start_date));
        const expectedProgress = totalDays > 0 ? Math.min((daysElapsed / totalDays) * 100, 100) : 0;
        const actualProgress = project.progress || 0;
        if (expectedProgress > 0) {
          timelineAdherencePct = Math.min(Math.round((actualProgress / expectedProgress) * 100), 100);
        }
      }

      const healthScore = Math.round(
        (timelineAdherencePct * 0.3) +
        (taskCompletionPct * 0.25) +
        (milestoneCompletionPct * 0.25) +
        (Math.max(0, 100 - Math.max(0, budgetUsedPct - 100)) * 0.2)
      );

      return {
        id: project.id,
        name: project.name,
        displayId: project.display_id,
        budgetUsedPct,
        timelineAdherencePct,
        taskCompletionPct,
        milestoneCompletionPct,
        healthScore,
        status: project.status,
        budget: project.budget,
        totalCosts,
        totalInvoiced,
        hoursLogged,
        billableHours,
      };
    }).sort((a, b) => a.healthScore - b.healthScore);
  }, [activeProjects, allTasks, allMilestones, allCosts, allInvoices, allTimeEntries]);

  const aggregateKPIs = useMemo(() => {
    if (!projectHealthData.length) return null;

    const totalBudget = projectHealthData.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projectHealthData.reduce((sum, p) => sum + p.totalCosts, 0);
    const totalInvoiced = projectHealthData.reduce((sum, p) => sum + p.totalInvoiced, 0);
    const totalHours = projectHealthData.reduce((sum, p) => sum + p.hoursLogged, 0);
    const totalBillable = projectHealthData.reduce((sum, p) => sum + p.billableHours, 0);
    const avgHealth = Math.round(projectHealthData.reduce((sum, p) => sum + p.healthScore, 0) / projectHealthData.length);
    const avgTimeline = Math.round(projectHealthData.reduce((sum, p) => sum + p.timelineAdherencePct, 0) / projectHealthData.length);

    const allTasksFlat = allTasks || [];
    const totalTasks = allTasksFlat.length;
    const completedTotal = allTasksFlat.filter(t => t.completed).length;
    const overdueTasks = allTasksFlat.filter(t => !t.completed && t.due_date && isBefore(parseISO(t.due_date), new Date())).length;

    const activeMembers = teamMembers?.filter(m => m.status === "active") || [];
    const totalCapacityHours = activeMembers.length * 40;
    const utilizationPct = totalCapacityHours > 0
      ? Math.round((totalHours / totalCapacityHours) * 100)
      : 0;
    const billableRatio = totalHours > 0
      ? Math.round((totalBillable / totalHours) * 100)
      : 0;

    return {
      totalBudget,
      totalSpent,
      totalInvoiced,
      totalHours,
      totalBillable,
      avgHealth,
      avgTimeline,
      totalTasks,
      completedTotal,
      overdueTasks,
      utilizationPct,
      billableRatio,
      projectCount: projectHealthData.length,
      atRiskCount: projectHealthData.filter(p => p.healthScore < 50).length,
    };
  }, [projectHealthData, allTasks, teamMembers]);

  const getHealthColor = (score: number) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getHealthBg = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 75) return "Healthy";
    if (score >= 50) return "At Risk";
    return "Critical";
  };

  const formatCurrency = (value: number) => {
    if (!canViewAmounts) return "••••••";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (!aggregateKPIs) {
    return (
      <Card className="border">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Project KPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          No active projects
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Project KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        {/* Aggregate Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className={`text-xl font-bold ${getHealthColor(aggregateKPIs.avgHealth)}`}>
              {aggregateKPIs.avgHealth}%
            </div>
            <div className="text-[11px] text-muted-foreground">Avg Health</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{aggregateKPIs.avgTimeline}%</div>
            <div className="text-[11px] text-muted-foreground">On Schedule</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{aggregateKPIs.utilizationPct}%</div>
            <div className="text-[11px] text-muted-foreground">Utilization</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{aggregateKPIs.billableRatio}%</div>
            <div className="text-[11px] text-muted-foreground">Billable Rate</div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold font-mono">{formatCurrency(aggregateKPIs.totalBudget)}</div>
            <div className="text-[10px] text-muted-foreground">Total Budget</div>
          </div>
          <div>
            <div className="text-sm font-semibold font-mono">{formatCurrency(aggregateKPIs.totalSpent)}</div>
            <div className="text-[10px] text-muted-foreground">Spent</div>
          </div>
          <div>
            <div className="text-sm font-semibold font-mono">{formatCurrency(aggregateKPIs.totalInvoiced)}</div>
            <div className="text-[10px] text-muted-foreground">Invoiced</div>
          </div>
        </div>

        {/* Task Velocity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{aggregateKPIs.completedTotal}/{aggregateKPIs.totalTasks} tasks done</span>
          </div>
          {aggregateKPIs.overdueTasks > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs">{aggregateKPIs.overdueTasks} overdue</span>
            </div>
          )}
        </div>

        {/* Per-Project Health */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Project Health ({aggregateKPIs.atRiskCount > 0 ? `${aggregateKPIs.atRiskCount} at risk` : "all healthy"})
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {projectHealthData.slice(0, 6).map(project => (
              <div key={project.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link to={getOrgPath(`/projects/${project.displayId}`)} className="text-sm font-medium truncate hover:underline">{project.name}</Link>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        project.healthScore >= 75 ? "bg-emerald-500/10 text-emerald-600" :
                        project.healthScore >= 50 ? "bg-amber-500/10 text-amber-600" :
                        "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {getHealthLabel(project.healthScore)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={project.healthScore}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      {project.healthScore}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{aggregateKPIs.totalHours.toFixed(0)}h logged</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{aggregateKPIs.totalBillable.toFixed(0)}h billable</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{aggregateKPIs.projectCount} projects</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
