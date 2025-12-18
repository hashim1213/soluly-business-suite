import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QuarterlyGoal {
  id: string;
  organization_id: string;
  year: number;
  quarter: number;
  revenue_target: number;
  projects_target: number;
  new_clients_target: number;
  profit_margin_target: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectionScenario {
  targetRevenue: number;
  avgProjectValue: number;
  profitMargin: number;
  projectsNeeded: number;
  grossProfit: number;
  monthlyRevenue: number;
  monthlyProjects: number;
}

export interface MaintenanceProjection {
  projectId: string;
  projectName: string;
  monthlyAmount: number;
  yearlyAmount: number;
  startDate: string | null;
}

export function useQuarterlyGoals(year?: number) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["quarterly-goals", organization?.id, year],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("quarterly_goals")
        .select("*")
        .eq("organization_id", organization.id)
        .order("year", { ascending: false })
        .order("quarter", { ascending: true });

      if (year) {
        query = query.eq("year", year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QuarterlyGoal[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateQuarterlyGoal() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (goal: Omit<QuarterlyGoal, "id" | "organization_id" | "created_at" | "updated_at">) => {
      if (!organization?.id) throw new Error("No organization found");

      console.log("Creating quarterly goal:", { ...goal, organization_id: organization.id });

      const { data, error } = await supabase
        .from("quarterly_goals")
        .insert({
          organization_id: organization.id,
          year: goal.year,
          quarter: goal.quarter,
          revenue_target: goal.revenue_target,
          projects_target: goal.projects_target,
          new_clients_target: goal.new_clients_target,
          profit_margin_target: goal.profit_margin_target,
          notes: goal.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating quarterly goal:", error);
        throw error;
      }
      console.log("Created quarterly goal:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-goals"] });
      toast.success("Quarterly goal created");
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast.error(error.message || "Failed to create quarterly goal");
    },
  });
}

export function useUpdateQuarterlyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<QuarterlyGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("quarterly_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-goals"] });
      toast.success("Quarterly goal updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update quarterly goal");
    },
  });
}

export function useDeleteQuarterlyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quarterly_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-goals"] });
      toast.success("Quarterly goal deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete quarterly goal");
    },
  });
}

// Utility functions for projections
export function calculateProjectionScenario(
  targetRevenue: number,
  avgProjectValue: number,
  profitMarginPercent: number
): ProjectionScenario {
  const projectsNeeded = avgProjectValue > 0 ? Math.ceil(targetRevenue / avgProjectValue) : 0;
  const grossProfit = targetRevenue * (profitMarginPercent / 100);
  const monthlyRevenue = targetRevenue / 12;
  const monthlyProjects = projectsNeeded / 12;

  return {
    targetRevenue,
    avgProjectValue,
    profitMargin: profitMarginPercent,
    projectsNeeded,
    grossProfit,
    monthlyRevenue,
    monthlyProjects,
  };
}

export function calculateBreakeven(
  fixedCosts: number,
  avgProjectValue: number,
  variableCostPercent: number
): { breakevenProjects: number; breakevenRevenue: number } {
  const contributionMargin = avgProjectValue * (1 - variableCostPercent / 100);
  const breakevenProjects = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
  const breakevenRevenue = breakevenProjects * avgProjectValue;

  return { breakevenProjects, breakevenRevenue };
}

export function calculateMaintenanceRevenue(
  maintenanceProjects: MaintenanceProjection[]
): { monthlyTotal: number; yearlyTotal: number } {
  const monthlyTotal = maintenanceProjects.reduce((sum, p) => sum + p.monthlyAmount, 0);
  const yearlyTotal = maintenanceProjects.reduce((sum, p) => sum + p.yearlyAmount, 0);

  return { monthlyTotal, yearlyTotal };
}

export function calculateQuarterlyProgress(
  goal: QuarterlyGoal,
  actualRevenue: number,
  actualProjects: number,
  actualNewClients: number,
  actualProfitMargin: number
) {
  return {
    revenue: {
      target: goal.revenue_target,
      actual: actualRevenue,
      percentage: goal.revenue_target > 0 ? (actualRevenue / goal.revenue_target) * 100 : 0,
    },
    projects: {
      target: goal.projects_target,
      actual: actualProjects,
      percentage: goal.projects_target > 0 ? (actualProjects / goal.projects_target) * 100 : 0,
    },
    newClients: {
      target: goal.new_clients_target,
      actual: actualNewClients,
      percentage: goal.new_clients_target > 0 ? (actualNewClients / goal.new_clients_target) * 100 : 0,
    },
    profitMargin: {
      target: goal.profit_margin_target,
      actual: actualProfitMargin,
      percentage: goal.profit_margin_target > 0 ? (actualProfitMargin / goal.profit_margin_target) * 100 : 0,
    },
  };
}

// Hook to get projects with maintenance
export function useMaintenanceProjects() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["maintenance-projects", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, has_maintenance, maintenance_amount, maintenance_frequency, maintenance_start_date, maintenance_notes, status")
        .eq("has_maintenance", true)
        .order("maintenance_amount", { ascending: false });

      if (error) throw error;

      return data.map((p) => ({
        projectId: p.id,
        projectName: p.name,
        monthlyAmount: p.maintenance_frequency === "monthly"
          ? p.maintenance_amount
          : p.maintenance_frequency === "quarterly"
            ? p.maintenance_amount / 3
            : p.maintenance_amount / 12,
        yearlyAmount: p.maintenance_frequency === "monthly"
          ? p.maintenance_amount * 12
          : p.maintenance_frequency === "quarterly"
            ? p.maintenance_amount * 4
            : p.maintenance_amount,
        startDate: p.maintenance_start_date,
        status: p.status,
      }));
    },
    enabled: !!organization?.id,
  });
}

// Hook to update project maintenance
export function useUpdateProjectMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      has_maintenance,
      maintenance_amount,
      maintenance_frequency,
      maintenance_start_date,
      maintenance_notes,
    }: {
      projectId: string;
      has_maintenance: boolean;
      maintenance_amount?: number;
      maintenance_frequency?: string;
      maintenance_start_date?: string | null;
      maintenance_notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({
          has_maintenance,
          maintenance_amount: maintenance_amount || 0,
          maintenance_frequency: maintenance_frequency || "monthly",
          maintenance_start_date,
          maintenance_notes,
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-projects"] });
      toast.success("Maintenance settings updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update maintenance settings");
    },
  });
}

// Hook to get financial summary for projections
export function useFinancialSummary() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["financial-summary", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Get all projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, value, budget, status, start_date, has_maintenance, maintenance_amount, maintenance_frequency");

      if (projectsError) throw projectsError;

      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from("crm_clients")
        .select("id, created_at");

      if (clientsError) throw clientsError;

      const completedProjects = projects?.filter((p) => p.status === "completed") || [];
      const activeProjects = projects?.filter((p) => p.status === "active") || [];
      const totalRevenue = completedProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const totalBudget = completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const avgProjectValue = completedProjects.length > 0
        ? totalRevenue / completedProjects.length
        : 0;
      const avgProfitMargin = totalRevenue > 0
        ? ((totalRevenue - totalBudget) / totalRevenue) * 100
        : 0;

      // Calculate maintenance revenue
      const maintenanceProjects = (projects || []).filter((p) => p.has_maintenance);
      const monthlyMaintenance = maintenanceProjects.reduce((sum, p) => {
        const amount = p.maintenance_amount || 0;
        if (p.maintenance_frequency === "monthly") return sum + amount;
        if (p.maintenance_frequency === "quarterly") return sum + amount / 3;
        return sum + amount / 12;
      }, 0);

      return {
        totalProjects: projects?.length || 0,
        completedProjects: completedProjects.length,
        activeProjects: activeProjects.length,
        totalRevenue,
        totalBudget,
        avgProjectValue,
        avgProfitMargin,
        totalClients: clients?.length || 0,
        monthlyMaintenanceRevenue: monthlyMaintenance,
        yearlyMaintenanceRevenue: monthlyMaintenance * 12,
        pipelineValue: activeProjects.reduce((sum, p) => sum + (p.value || 0), 0),
      };
    },
    enabled: !!organization?.id,
  });
}

// Comprehensive KPIs interface for services businesses
export interface ServiceBusinessKPIs {
  // Revenue & Profitability
  totalRevenue: number; // Total invoiced amount
  paidRevenue: number; // Paid invoices
  outstandingRevenue: number; // Sent + overdue invoices
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  avgProjectValue: number;
  revenuePerEmployee: number;

  // Customer Metrics
  totalClients: number;
  newClientsThisPeriod: number;
  repeatClientRate: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  ltvCacRatio: number;
  clientConcentration: number; // Top client % of revenue

  // Project Metrics
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  avgProjectDuration: number; // days
  projectSuccessRate: number;
  onTimeDeliveryRate: number;

  // Sales Metrics
  winRate: number;
  avgDealSize: number;
  salesCycleLength: number; // days
  pipelineValue: number;
  pipelineVelocity: number;
  quoteConversionRate: number;

  // Team & Utilization
  totalEmployees: number;
  billableUtilization: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  avgHourlyRate: number;
  costPerEmployee: number;

  // Financial Health
  overheadRatio: number;
  burnRate: number; // Monthly net burn (expenses - revenue)
  grossBurnRate: number; // Monthly total expenses
  netBurnRate: number; // Monthly net cash outflow
  runwayMonths: number; // Months of runway at current burn
  monthlyPayroll: number;
  monthlyOverhead: number;
  monthlyOperatingExpenses: number;
  cashReserves: number; // from maintenance/recurring
  recurringRevenue: number;
  recurringRevenueRatio: number;

  // Backlog & Capacity
  backlogValue: number; // signed but not started
  backlogMonths: number; // months of work in backlog
  capacityUtilization: number;
}

// Hook to get comprehensive KPIs for services businesses
export function useServicesKPIs(periodMonths: number = 12) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["services-kpis", organization?.id, periodMonths],
    queryFn: async () => {
      if (!organization?.id) return null;

      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - periodMonths);
      const periodStartStr = periodStart.toISOString();

      // Fetch all required data in parallel
      const [
        projectsResult,
        clientsResult,
        quotesResult,
        teamMembersResult,
        timeEntriesResult,
        businessCostsResult,
        invoicesResult,
      ] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("crm_clients").select("id, name, total_revenue, created_at"),
        supabase.from("quotes").select("id, value, status, created_at, stage"),
        supabase.from("team_members").select("id, name, hourly_rate, salary, status, contract_type"),
        supabase.from("time_entries").select("id, hours, billable, date, team_member_id"),
        supabase.from("business_costs").select("id, amount, category, date, recurring"),
        supabase.from("project_invoices").select("id, amount, status, created_at, project_id"),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (quotesResult.error) throw quotesResult.error;
      if (teamMembersResult.error) throw teamMembersResult.error;
      if (timeEntriesResult.error) throw timeEntriesResult.error;
      if (businessCostsResult.error) throw businessCostsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const projects = projectsResult.data || [];
      const clients = clientsResult.data || [];
      const quotes = quotesResult.data || [];
      const teamMembers = teamMembersResult.data || [];
      const timeEntries = timeEntriesResult.data || [];
      const businessCosts = businessCostsResult.data || [];
      const invoices = invoicesResult.data || [];

      // Filter by period
      const periodProjects = projects.filter(p => new Date(p.created_at) >= periodStart);
      const periodQuotes = quotes.filter(q => new Date(q.created_at) >= periodStart);
      const periodClients = clients.filter(c => new Date(c.created_at) >= periodStart);
      const periodTimeEntries = timeEntries.filter(t => new Date(t.date) >= periodStart);
      const periodCosts = businessCosts.filter(c => new Date(c.date) >= periodStart);
      const periodInvoices = invoices.filter(i => new Date(i.created_at) >= periodStart);

      // Revenue & Profitability - Use INVOICED amounts (sent, paid, overdue - not drafts)
      const invoicedStatuses = ["sent", "paid", "overdue"];
      const totalInvoiced = periodInvoices
        .filter(i => invoicedStatuses.includes(i.status))
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      const paidInvoices = periodInvoices
        .filter(i => i.status === "paid")
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      const outstandingInvoices = periodInvoices
        .filter(i => ["sent", "overdue"].includes(i.status))
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      // Fallback to project values if no invoices exist
      const completedProjects = projects.filter(p => p.status === "completed");
      const periodCompletedProjects = completedProjects.filter(p => new Date(p.created_at) >= periodStart);
      const projectBasedRevenue = periodCompletedProjects.reduce((sum, p) => sum + (p.value || 0), 0);

      // Use invoiced amount if available, otherwise fall back to project values
      const totalRevenue = totalInvoiced > 0 ? totalInvoiced : projectBasedRevenue;
      const totalCosts = periodCompletedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const grossProfit = totalRevenue - totalCosts;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Operating costs from business_costs
      const operatingCosts = periodCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
      const netProfit = grossProfit - operatingCosts;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Team Metrics
      const activeTeamMembers = teamMembers.filter(t => t.status === "active");
      const totalEmployees = activeTeamMembers.length;
      const revenuePerEmployee = totalEmployees > 0 ? totalRevenue / totalEmployees : 0;

      // Time & Utilization
      const billableHours = periodTimeEntries.filter(t => t.billable).reduce((sum, t) => sum + (t.hours || 0), 0);
      const nonBillableHours = periodTimeEntries.filter(t => !t.billable).reduce((sum, t) => sum + (t.hours || 0), 0);
      const totalHours = billableHours + nonBillableHours;
      const availableHours = totalEmployees * 40 * 4 * periodMonths; // 40 hrs/week, 4 weeks/month
      const billableUtilization = availableHours > 0 ? (billableHours / availableHours) * 100 : 0;
      const avgHourlyRate = billableHours > 0 ? totalRevenue / billableHours : 0;

      // Customer Metrics
      const avgProjectValue = periodCompletedProjects.length > 0
        ? totalRevenue / periodCompletedProjects.length
        : 0;

      // Client concentration - top client % of revenue
      const clientRevenues = clients.map(c => c.total_revenue || 0).sort((a, b) => b - a);
      const topClientRevenue = clientRevenues[0] || 0;
      const totalClientRevenue = clientRevenues.reduce((sum, r) => sum + r, 0);
      const clientConcentration = totalClientRevenue > 0 ? (topClientRevenue / totalClientRevenue) * 100 : 0;

      // Repeat clients (simplified - clients with revenue > avg project value, indicating multiple projects)
      const avgRevPerProject = avgProjectValue || 50000;
      const repeatClients = clients.filter(c => (c.total_revenue || 0) > avgRevPerProject * 1.5).length;
      const repeatClientRate = clients.length > 0 ? (repeatClients / clients.length) * 100 : 0;

      // Customer Lifetime Value (average revenue per client)
      const customerLifetimeValue = clients.length > 0
        ? totalClientRevenue / clients.length
        : avgProjectValue;

      // Customer Acquisition Cost (marketing/sales costs / new clients)
      const salesMarketingCosts = periodCosts
        .filter(c => ["marketing", "sales", "advertising"].includes(c.category?.toLowerCase() || ""))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const newClientsCount = periodClients.length || 1;
      const customerAcquisitionCost = salesMarketingCosts / newClientsCount;
      const ltvCacRatio = customerAcquisitionCost > 0 ? customerLifetimeValue / customerAcquisitionCost : 0;

      // Sales Metrics
      const wonQuotes = periodQuotes.filter(q => q.status === "accepted");
      const lostQuotes = periodQuotes.filter(q => q.status === "rejected");
      const decidedQuotes = wonQuotes.length + lostQuotes.length;
      const winRate = decidedQuotes > 0 ? (wonQuotes.length / decidedQuotes) * 100 : 0;
      const avgDealSize = wonQuotes.length > 0
        ? wonQuotes.reduce((sum, q) => sum + (q.value || 0), 0) / wonQuotes.length
        : avgProjectValue;

      // Quote conversion rate (quotes that turned into projects)
      const quoteConversionRate = periodQuotes.length > 0
        ? (wonQuotes.length / periodQuotes.length) * 100
        : 0;

      // Pipeline value (active quotes)
      const activeQuotes = quotes.filter(q => !["accepted", "rejected"].includes(q.status));
      const pipelineValue = activeQuotes.reduce((sum, q) => sum + (q.value || 0), 0);

      // Backlog (active projects not started yet - simplified as pending projects)
      const pendingProjects = projects.filter(p => p.status === "pending");
      const activeProjects = projects.filter(p => p.status === "active");
      const backlogValue = pendingProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      const monthlyCapacity = avgProjectValue > 0 && periodCompletedProjects.length > 0
        ? periodCompletedProjects.length / periodMonths
        : 1;
      const backlogMonths = monthlyCapacity > 0 ? pendingProjects.length / monthlyCapacity : 0;

      // Project duration (simplified - using start_date to completion)
      const projectsWithDates = completedProjects.filter(p => p.start_date && p.end_date);
      const avgProjectDuration = projectsWithDates.length > 0
        ? projectsWithDates.reduce((sum, p) => {
            const start = new Date(p.start_date);
            const end = new Date(p.end_date || p.updated_at);
            return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / projectsWithDates.length
        : 60; // default 60 days

      // On-time delivery (simplified - projects with progress 100% before end_date)
      const projectsWithEndDate = completedProjects.filter(p => p.end_date);
      const onTimeProjects = projectsWithEndDate.filter(p => {
        const endDate = new Date(p.end_date);
        const completedDate = new Date(p.updated_at);
        return completedDate <= endDate;
      });
      const onTimeDeliveryRate = projectsWithEndDate.length > 0
        ? (onTimeProjects.length / projectsWithEndDate.length) * 100
        : 100;

      // Overhead ratio
      const overheadCosts = periodCosts
        .filter(c => ["overhead", "rent", "utilities", "software", "insurance", "admin"].includes(c.category?.toLowerCase() || ""))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const overheadRatio = totalRevenue > 0 ? (overheadCosts / totalRevenue) * 100 : 0;

      // Employee costs (payroll)
      const employeeCosts = activeTeamMembers.reduce((sum, t) => sum + (t.salary || 0), 0);
      const monthlyPayroll = employeeCosts / 12; // Annual salary to monthly
      const costPerEmployee = totalEmployees > 0 ? employeeCosts / totalEmployees : 0;

      // Monthly overhead (rent, utilities, software, etc.)
      const monthlyOverhead = overheadCosts / periodMonths;

      // Monthly operating expenses (all costs)
      const monthlyOperatingExpenses = operatingCosts / periodMonths;

      // Burn rate calculations
      const grossBurnRate = monthlyPayroll + monthlyOperatingExpenses; // Total monthly cash outflow
      const monthlyRevenue = totalRevenue / periodMonths;
      const netBurnRate = grossBurnRate - monthlyRevenue; // Net cash outflow (negative means profitable)
      const burnRate = netBurnRate; // Alias for backwards compatibility

      // Recurring revenue from maintenance
      const maintenanceProjects = projects.filter(p => p.has_maintenance);
      const monthlyRecurring = maintenanceProjects.reduce((sum, p) => {
        const amount = p.maintenance_amount || 0;
        if (p.maintenance_frequency === "monthly") return sum + amount;
        if (p.maintenance_frequency === "quarterly") return sum + amount / 3;
        return sum + amount / 12;
      }, 0);
      const recurringRevenue = monthlyRecurring * 12;
      const recurringRevenueRatio = totalRevenue > 0 ? (recurringRevenue / (totalRevenue + recurringRevenue)) * 100 : 0;

      // Cash reserves (6 months of recurring as estimate)
      const cashReserves = monthlyRecurring * 6;

      // Runway calculation (how many months can sustain at current burn)
      // Using available cash (pipeline value + recurring reserves) / net burn rate
      const availableCash = cashReserves + (paidInvoices * 0.3); // 30% of paid as cash buffer
      const runwayMonths = netBurnRate > 0 ? availableCash / netBurnRate : 999; // 999 = profitable/infinite

      // Capacity utilization
      const capacityUtilization = totalHours > 0 ? (totalHours / availableHours) * 100 : 0;

      return {
        // Revenue & Profitability
        totalRevenue,
        paidRevenue: paidInvoices,
        outstandingRevenue: outstandingInvoices,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
        avgProjectValue,
        revenuePerEmployee,

        // Customer Metrics
        totalClients: clients.length,
        newClientsThisPeriod: periodClients.length,
        repeatClientRate,
        customerLifetimeValue,
        customerAcquisitionCost,
        ltvCacRatio,
        clientConcentration,

        // Project Metrics
        totalProjects: projects.length,
        completedProjects: completedProjects.length,
        activeProjects: activeProjects.length,
        avgProjectDuration,
        projectSuccessRate: 100, // placeholder - need completion criteria
        onTimeDeliveryRate,

        // Sales Metrics
        winRate,
        avgDealSize,
        salesCycleLength: 30, // placeholder - need quote to project tracking
        pipelineValue,
        pipelineVelocity: pipelineValue / periodMonths,
        quoteConversionRate,

        // Team & Utilization
        totalEmployees,
        billableUtilization,
        totalBillableHours: billableHours,
        totalNonBillableHours: nonBillableHours,
        avgHourlyRate,
        costPerEmployee,

        // Financial Health
        overheadRatio,
        burnRate,
        grossBurnRate,
        netBurnRate,
        runwayMonths,
        monthlyPayroll,
        monthlyOverhead,
        monthlyOperatingExpenses,
        cashReserves,
        recurringRevenue,
        recurringRevenueRatio,

        // Backlog & Capacity
        backlogValue,
        backlogMonths,
        capacityUtilization,
      } as ServiceBusinessKPIs;
    },
    enabled: !!organization?.id,
  });
}
