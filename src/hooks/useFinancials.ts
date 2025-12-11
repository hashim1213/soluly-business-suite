import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectFinancials {
  id: string;
  display_id: string;
  name: string;
  client_name: string;
  status: string;
  value: number;
  invoiced: number;
  paid: number;
  costs: number;
  laborCosts: number;
  nonLaborCosts: number;
  profit: number;
  margin: number;
}

export interface FinancialsOverview {
  totalProjectValue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalCosts: number;
  totalLaborCosts: number;
  totalNonLaborCosts: number;
  totalProfit: number;
  averageMargin: number;
  projects: ProjectFinancials[];
}

/**
 * Hook to fetch comprehensive financial data across all projects
 */
export function useFinancialsOverview() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["financials", organization?.id],
    queryFn: async (): Promise<FinancialsOverview> => {
      if (!organization?.id) {
        return {
          totalProjectValue: 0,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalCosts: 0,
          totalLaborCosts: 0,
          totalNonLaborCosts: 0,
          totalProfit: 0,
          averageMargin: 0,
          projects: [],
        };
      }

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, display_id, name, client_name, status, value")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) {
        return {
          totalProjectValue: 0,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalCosts: 0,
          totalLaborCosts: 0,
          totalNonLaborCosts: 0,
          totalProfit: 0,
          averageMargin: 0,
          projects: [],
        };
      }

      // Fetch invoices for all projects
      const { data: invoices, error: invoicesError } = await supabase
        .from("project_invoices")
        .select("project_id, amount, status")
        .eq("organization_id", organization.id);

      if (invoicesError) throw invoicesError;

      // Fetch costs for all projects
      const { data: costs, error: costsError } = await supabase
        .from("project_costs")
        .select("project_id, amount")
        .eq("organization_id", organization.id);

      if (costsError) throw costsError;

      // Fetch time entries with hourly rates for labor cost calculation
      // time_entries doesn't have organization_id, so filter by project_id
      const projectIds = projects.map(p => p.id);
      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select(`
          project_id,
          hours,
          team_member:team_members!team_member_id(hourly_rate)
        `)
        .in("project_id", projectIds);

      if (timeError) throw timeError;

      // Calculate financials for each project
      const projectFinancials: ProjectFinancials[] = projects.map(project => {
        // Calculate invoiced and paid amounts
        const projectInvoices = invoices?.filter(inv => inv.project_id === project.id) || [];
        const invoiced = projectInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paid = projectInvoices
          .filter(inv => inv.status === "paid")
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        // Calculate non-labor costs
        const projectCosts = costs?.filter(c => c.project_id === project.id) || [];
        const nonLaborCosts = projectCosts.reduce((sum, c) => sum + Number(c.amount), 0);

        // Calculate labor costs from time entries
        const projectTimeEntries = timeEntries?.filter(te => te.project_id === project.id) || [];
        const laborCosts = projectTimeEntries.reduce((sum, te) => {
          const hourlyRate = (te.team_member as { hourly_rate: number } | null)?.hourly_rate || 0;
          return sum + (te.hours * hourlyRate);
        }, 0);

        const totalCosts = laborCosts + nonLaborCosts;
        const profit = paid - totalCosts;
        const margin = paid > 0 ? (profit / paid) * 100 : 0;

        return {
          id: project.id,
          display_id: project.display_id,
          name: project.name,
          client_name: project.client_name,
          status: project.status,
          value: Number(project.value),
          invoiced,
          paid,
          costs: totalCosts,
          laborCosts,
          nonLaborCosts,
          profit,
          margin,
        };
      });

      // Calculate totals
      const totalProjectValue = projectFinancials.reduce((sum, p) => sum + p.value, 0);
      const totalInvoiced = projectFinancials.reduce((sum, p) => sum + p.invoiced, 0);
      const totalPaid = projectFinancials.reduce((sum, p) => sum + p.paid, 0);
      const totalOutstanding = totalInvoiced - totalPaid;
      const totalLaborCosts = projectFinancials.reduce((sum, p) => sum + p.laborCosts, 0);
      const totalNonLaborCosts = projectFinancials.reduce((sum, p) => sum + p.nonLaborCosts, 0);
      const totalCosts = totalLaborCosts + totalNonLaborCosts;
      const totalProfit = totalPaid - totalCosts;
      const averageMargin = totalPaid > 0 ? (totalProfit / totalPaid) * 100 : 0;

      return {
        totalProjectValue,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        totalCosts,
        totalLaborCosts,
        totalNonLaborCosts,
        totalProfit,
        averageMargin,
        projects: projectFinancials,
      };
    },
    enabled: !!organization?.id,
  });
}
