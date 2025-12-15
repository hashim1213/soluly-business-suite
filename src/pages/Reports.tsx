import { useState, useMemo } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Target,
  DollarSign,
  Activity,
  Download,
  Filter,
  FileText,
  Building2,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  FolderKanban,
  Ticket,
  ListChecks,
  Milestone,
  FileCheck,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";
import { useAllActivities } from "@/hooks/useContactActivities";
import { useCrmClients, useCrmLeads } from "@/hooks/useCRM";
import { useQuotes } from "@/hooks/useQuotes";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";

type ReportCategory = "projects" | "contacts" | "leads" | "clients" | "sales" | "activities" | "team";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon: React.ComponentType<{ className?: string }>;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const reportTemplates: ReportTemplate[] = [
  // Project Reports
  { id: "projects-all", name: "All Projects", description: "Complete list of all projects", category: "projects", icon: FolderKanban },
  { id: "projects-status", name: "Projects by Status", description: "Projects grouped by status", category: "projects", icon: Filter },
  { id: "projects-progress", name: "Project Progress", description: "Completion progress of projects", category: "projects", icon: TrendingUp },
  { id: "projects-timeline", name: "Project Timeline", description: "Projects with start and end dates", category: "projects", icon: Calendar },
  { id: "projects-budget", name: "Budget Overview", description: "Project budgets and spend", category: "projects", icon: DollarSign },
  { id: "project-detail", name: "Project Detail Report", description: "Comprehensive report for a single project", category: "projects", icon: FileCheck },

  // Contact Reports
  { id: "contacts-all", name: "All Contacts", description: "Complete list of all contacts", category: "contacts", icon: Users },
  { id: "contacts-by-tag", name: "Contacts by Tag", description: "Contacts grouped by tags", category: "contacts", icon: Filter },
  { id: "contacts-by-company", name: "Contacts by Company", description: "Contacts organized by company", category: "contacts", icon: Building2 },
  { id: "contacts-recent", name: "Recent Contacts", description: "Contacts added in the date range", category: "contacts", icon: Clock },
  { id: "contacts-growth", name: "Contact Growth", description: "Contact growth over time", category: "contacts", icon: TrendingUp },

  // Lead Reports
  { id: "leads-pipeline", name: "Lead Pipeline", description: "Overview of leads by status", category: "leads", icon: Target },
  { id: "leads-by-status", name: "Leads by Status", description: "Lead breakdown by status", category: "leads", icon: Filter },
  { id: "leads-source", name: "Leads by Source", description: "Where your leads come from", category: "leads", icon: BarChart3 },
  { id: "leads-recent", name: "Recent Leads", description: "Leads added in the date range", category: "leads", icon: Clock },

  // Client Reports
  { id: "clients-all", name: "All Clients", description: "Complete client list", category: "clients", icon: Building2 },
  { id: "clients-by-industry", name: "Clients by Industry", description: "Client breakdown by industry", category: "clients", icon: Filter },
  { id: "clients-by-status", name: "Clients by Status", description: "Active vs inactive clients", category: "clients", icon: CheckCircle },
  { id: "clients-revenue", name: "Client Revenue", description: "Revenue by client", category: "clients", icon: DollarSign },

  // Sales Reports
  { id: "sales-pipeline", name: "Sales Pipeline", description: "Total pipeline value by stage", category: "sales", icon: Target },
  { id: "sales-won-lost", name: "Won/Lost Analysis", description: "Win rate and deal analysis", category: "sales", icon: TrendingUp },
  { id: "sales-quotes", name: "Quote Analysis", description: "Quote conversion and value", category: "sales", icon: FileText },

  // Activity Reports
  { id: "activities-summary", name: "Activity Summary", description: "Overview of all activities", category: "activities", icon: Activity },
  { id: "activities-calls", name: "Call Report", description: "Call activities and outcomes", category: "activities", icon: Phone },
  { id: "activities-emails", name: "Email Report", description: "Email activity tracking", category: "activities", icon: Mail },
  { id: "activities-tasks", name: "Task Report", description: "Task completion and status", category: "activities", icon: CheckCircle },

  // Team Reports
  { id: "team-overview", name: "Team Overview", description: "Team member summary", category: "team", icon: Users },
  { id: "team-by-department", name: "Team by Department", description: "Members grouped by department", category: "team", icon: Filter },
  { id: "team-by-role", name: "Team by Role", description: "Members grouped by role", category: "team", icon: UserCheck },
];

const categoryLabels: Record<ReportCategory, string> = {
  projects: "Project Reports",
  contacts: "Contact Reports",
  leads: "Lead Reports",
  clients: "Client Reports",
  sales: "Sales Reports",
  activities: "Activity Reports",
  team: "Team Reports",
};

const categoryIcons: Record<ReportCategory, React.ComponentType<{ className?: string }>> = {
  projects: FolderKanban,
  contacts: Users,
  leads: Target,
  clients: Building2,
  sales: DollarSign,
  activities: Activity,
  team: Users,
};

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2px solid #e5e7eb",
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  headerText: {
    textAlign: "right",
  },
  orgName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 5,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    border: "1px solid #e5e7eb",
  },
  statLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
  },
  chartPlaceholder: {
    padding: 20,
    backgroundColor: "#f9fafb",
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
});

// Project Report Options Interface
interface ProjectReportOptions {
  includeOverview: boolean;
  includeTasks: boolean;
  includeMilestones: boolean;
  includeTeam: boolean;
  includeTimeline: boolean;
  includeBudget: boolean;
  includeTickets: boolean;
}

const defaultProjectOptions: ProjectReportOptions = {
  includeOverview: true,
  includeTasks: true,
  includeMilestones: true,
  includeTeam: true,
  includeTimeline: true,
  includeBudget: true,
  includeTickets: true,
};

// PDF Document Component
interface ReportPDFProps {
  title: string;
  data: any;
  organization: { name: string; logo_url?: string | null } | null;
  dateRange: { from: string; to: string };
  reportType: string;
}

const ReportPDF = ({ title, data, organization, dateRange, reportType }: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <View>
          {organization?.logo_url ? (
            <Image src={organization.logo_url} style={pdfStyles.logo} />
          ) : (
            <Text style={pdfStyles.orgName}>{organization?.name || "Organization"}</Text>
          )}
        </View>
        <View style={pdfStyles.headerText}>
          <Text style={pdfStyles.reportTitle}>{title}</Text>
          <Text style={pdfStyles.reportDate}>
            Generated: {format(new Date(), "MMMM d, yyyy")}
          </Text>
          <Text style={pdfStyles.reportDate}>
            Date Range: {dateRange.from} to {dateRange.to}
          </Text>
        </View>
      </View>

      {/* Stats Summary */}
      {data?.stats && (
        <View style={pdfStyles.statsRow}>
          {data.stats.map((stat: any, idx: number) => (
            <View key={idx} style={pdfStyles.statBox}>
              <Text style={pdfStyles.statLabel}>{stat.label}</Text>
              <Text style={pdfStyles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Table Data */}
      {data?.tableData && data.tableData.length > 0 && (
        <View style={pdfStyles.section}>
          {data.sectionTitle && (
            <Text style={pdfStyles.sectionTitle}>{data.sectionTitle}</Text>
          )}
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              {data.columns.map((col: string, idx: number) => (
                <Text key={idx} style={pdfStyles.tableCell}>
                  {col.replace(/_/g, " ").toUpperCase()}
                </Text>
              ))}
            </View>
            {data.tableData.slice(0, 50).map((row: any, rowIdx: number) => (
              <View key={rowIdx} style={pdfStyles.tableRow}>
                {data.columns.map((col: string, colIdx: number) => (
                  <Text key={colIdx} style={pdfStyles.tableCell}>
                    {formatCellValue(row[col], col)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          {data.tableData.length > 50 && (
            <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 10 }}>
              Showing 50 of {data.tableData.length} records
            </Text>
          )}
        </View>
      )}

      {/* Chart Summary (text-based for PDF) */}
      {data?.chartData && data.chartData.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Summary</Text>
          {data.chartData.map((item: any, idx: number) => (
            <View key={idx} style={{ flexDirection: "row", marginBottom: 4 }}>
              <Text style={{ flex: 1 }}>{item.name}</Text>
              <Text style={{ fontWeight: "bold" }}>
                {typeof item.value === "number" && item.value >= 1000
                  ? `$${item.value.toLocaleString()}`
                  : item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <Text style={pdfStyles.footer}>
        {organization?.name} - Confidential Report - Page 1
      </Text>
    </Page>
  </Document>
);

// Helper to format cell values
function formatCellValue(value: any, column: string): string {
  if (value === null || value === undefined) return "-";
  if (column.includes("date") || column === "created_at" || column === "updated_at" || column === "start_date" || column === "end_date") {
    try {
      return format(new Date(value), "MMM d, yyyy");
    } catch {
      return value;
    }
  }
  if (column.includes("revenue") || column === "budget" || column === "value" || column === "amount") {
    return `$${Number(value).toLocaleString()}`;
  }
  if (typeof value === "object") {
    return value?.name || JSON.stringify(value);
  }
  return String(value);
}

export default function Reports() {
  const { organization } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("projects");
  const [selectedReport, setSelectedReport] = useState<string>("projects-all");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectOptions, setProjectOptions] = useState<ProjectReportOptions>(defaultProjectOptions);
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);

  // Data hooks
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: tags } = useTags();
  const { data: activities, isLoading: activitiesLoading } = useAllActivities({
    dateFrom,
    dateTo,
  });
  const { data: clients, isLoading: clientsLoading } = useCrmClients();
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: quotes, isLoading: quotesLoading } = useQuotes();
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const isLoading = contactsLoading || activitiesLoading || clientsLoading || leadsLoading || quotesLoading || teamLoading || projectsLoading || ticketsLoading;

  // Filter templates by category
  const categoryTemplates = reportTemplates.filter((t) => t.category === selectedCategory);

  // Get active report template
  const activeTemplate = reportTemplates.find((t) => t.id === selectedReport);

  // Generate report data based on selected report
  const reportData = useMemo(() => {
    if (!activeTemplate) return null;

    const dateRange = {
      start: new Date(dateFrom),
      end: new Date(dateTo),
    };

    const isInDateRange = (dateStr: string) => {
      try {
        const date = parseISO(dateStr);
        return isWithinInterval(date, dateRange);
      } catch {
        return false;
      }
    };

    switch (activeTemplate.id) {
      // ============ PROJECT REPORTS ============
      case "projects-all":
        return {
          type: "table",
          data: projects || [],
          columns: ["display_id", "name", "status", "priority", "start_date", "end_date"],
          stats: [
            { label: "Total Projects", value: projects?.length || 0 },
            { label: "Active", value: projects?.filter((p) => p.status === "active").length || 0 },
            { label: "Completed", value: projects?.filter((p) => p.status === "completed").length || 0 },
          ],
          pdfData: {
            stats: [
              { label: "Total Projects", value: projects?.length || 0 },
              { label: "Active", value: projects?.filter((p) => p.status === "active").length || 0 },
              { label: "Completed", value: projects?.filter((p) => p.status === "completed").length || 0 },
            ],
            tableData: projects || [],
            columns: ["display_id", "name", "status", "priority", "start_date", "end_date"],
            sectionTitle: "Projects List",
          },
        };

      case "projects-status":
        const projectsByStatus: Record<string, number> = {};
        projects?.forEach((project) => {
          const status = project.status || "unknown";
          projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(projectsByStatus).map(([name, value]) => ({ name, value })),
          stats: [
            { label: "Total Projects", value: projects?.length || 0 },
          ],
          pdfData: {
            stats: [{ label: "Total Projects", value: projects?.length || 0 }],
            chartData: Object.entries(projectsByStatus).map(([name, value]) => ({ name, value })),
          },
        };

      case "projects-progress":
        const projectProgress = projects?.map((p) => ({
          name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
          value: p.progress || 0,
        })).sort((a, b) => b.value - a.value).slice(0, 10) || [];
        return {
          type: "bar",
          data: projectProgress,
          stats: [
            { label: "Avg Progress", value: `${Math.round((projects?.reduce((sum, p) => sum + (p.progress || 0), 0) || 0) / (projects?.length || 1))}%` },
          ],
          pdfData: {
            stats: [{ label: "Average Progress", value: `${Math.round((projects?.reduce((sum, p) => sum + (p.progress || 0), 0) || 0) / (projects?.length || 1))}%` }],
            chartData: projectProgress,
          },
        };

      case "projects-timeline":
        const timelineProjects = projects?.filter((p) => p.start_date || p.end_date)
          .map((p) => ({
            display_id: p.display_id,
            name: p.name,
            status: p.status,
            start_date: p.start_date,
            end_date: p.end_date,
          })) || [];
        return {
          type: "table",
          data: timelineProjects,
          columns: ["display_id", "name", "status", "start_date", "end_date"],
          pdfData: {
            tableData: timelineProjects,
            columns: ["display_id", "name", "status", "start_date", "end_date"],
            sectionTitle: "Project Timeline",
          },
        };

      case "projects-budget":
        const budgetProjects = projects?.filter((p) => p.budget && p.budget > 0)
          .map((p) => ({
            name: p.name.length > 25 ? p.name.substring(0, 25) + "..." : p.name,
            value: p.budget || 0,
          })).sort((a, b) => b.value - a.value).slice(0, 10) || [];
        const totalBudget = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        return {
          type: "bar",
          data: budgetProjects,
          stats: [
            { label: "Total Budget", value: `$${totalBudget.toLocaleString()}` },
            { label: "Projects with Budget", value: budgetProjects.length },
          ],
          pdfData: {
            stats: [
              { label: "Total Budget", value: `$${totalBudget.toLocaleString()}` },
              { label: "Projects with Budget", value: budgetProjects.length },
            ],
            chartData: budgetProjects,
          },
        };

      case "project-detail":
        if (!selectedProjectId) {
          return {
            type: "select-project",
            data: null,
          };
        }
        const project = projects?.find((p) => p.id === selectedProjectId);
        const projectTickets = tickets?.filter((t) => t.project_id === selectedProjectId) || [];

        if (!project) return null;

        return {
          type: "project-detail",
          project,
          tickets: projectTickets,
          options: projectOptions,
          stats: [
            { label: "Status", value: project.status },
            { label: "Progress", value: `${project.progress || 0}%` },
            { label: "Priority", value: project.priority || "normal" },
            { label: "Tickets", value: projectTickets.length },
          ],
          pdfData: {
            stats: [
              { label: "Status", value: project.status },
              { label: "Progress", value: `${project.progress || 0}%` },
              { label: "Budget", value: project.budget ? `$${project.budget.toLocaleString()}` : "Not set" },
              { label: "Tickets", value: projectTickets.length },
            ],
            tableData: projectOptions.includeTickets ? projectTickets.map((t) => ({
              display_id: t.display_id,
              title: t.title,
              status: t.status,
              priority: t.priority,
            })) : [],
            columns: ["display_id", "title", "status", "priority"],
            sectionTitle: project.name,
          },
        };

      // ============ CONTACT REPORTS ============
      case "contacts-all":
        return {
          type: "table",
          data: contacts || [],
          columns: ["display_id", "name", "email", "phone", "job_title", "created_at"],
          stats: [
            { label: "Total Contacts", value: contacts?.length || 0 },
          ],
          pdfData: {
            stats: [{ label: "Total Contacts", value: contacts?.length || 0 }],
            tableData: (contacts || []).map((c) => ({
              display_id: c.display_id,
              name: c.name,
              email: c.email || "-",
              phone: c.phone || "-",
              job_title: c.job_title || "-",
              created_at: c.created_at,
            })),
            columns: ["display_id", "name", "email", "phone", "job_title", "created_at"],
            sectionTitle: "Contacts List",
          },
        };

      case "contacts-by-tag":
        const tagGroups: Record<string, number> = {};
        contacts?.forEach((contact) => {
          if (contact.tags && contact.tags.length > 0) {
            contact.tags.forEach((ct: any) => {
              const tagName = ct.tag?.name || "Unknown";
              tagGroups[tagName] = (tagGroups[tagName] || 0) + 1;
            });
          } else {
            tagGroups["No Tags"] = (tagGroups["No Tags"] || 0) + 1;
          }
        });
        return {
          type: "pie",
          data: Object.entries(tagGroups).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(tagGroups).map(([name, value]) => ({ name, value })),
          },
        };

      case "contacts-by-company":
        const companyGroups: Record<string, number> = {};
        contacts?.forEach((contact) => {
          const companyName = contact.company?.name || "No Company";
          companyGroups[companyName] = (companyGroups[companyName] || 0) + 1;
        });
        return {
          type: "bar",
          data: Object.entries(companyGroups)
            .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + "..." : name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10),
          pdfData: {
            chartData: Object.entries(companyGroups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
          },
        };

      case "contacts-recent":
        const recentContacts = contacts?.filter((c) => isInDateRange(c.created_at)) || [];
        return {
          type: "table",
          data: recentContacts,
          columns: ["display_id", "name", "email", "phone", "created_at"],
          stats: [
            { label: "New Contacts", value: recentContacts.length },
          ],
          pdfData: {
            stats: [{ label: "New Contacts in Period", value: recentContacts.length }],
            tableData: recentContacts.map((c) => ({
              display_id: c.display_id,
              name: c.name,
              email: c.email || "-",
              phone: c.phone || "-",
              created_at: c.created_at,
            })),
            columns: ["display_id", "name", "email", "phone", "created_at"],
            sectionTitle: "Recent Contacts",
          },
        };

      case "contacts-growth":
        const contactsByMonth: Record<string, number> = {};
        contacts?.forEach((contact) => {
          const month = format(new Date(contact.created_at), "MMM yyyy");
          contactsByMonth[month] = (contactsByMonth[month] || 0) + 1;
        });
        const sortedMonths = Object.entries(contactsByMonth)
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
        return {
          type: "line",
          data: sortedMonths.map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: sortedMonths.map(([name, value]) => ({ name, value })),
          },
        };

      // ============ LEAD REPORTS ============
      case "leads-pipeline":
      case "leads-by-status":
        const leadsByStatus: Record<string, number> = {};
        leads?.forEach((lead) => {
          leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
          stats: [
            { label: "Total Leads", value: leads?.length || 0 },
          ],
          pdfData: {
            stats: [{ label: "Total Leads", value: leads?.length || 0 }],
            chartData: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
          },
        };

      case "leads-source":
        const leadsBySource: Record<string, number> = {};
        leads?.forEach((lead) => {
          const source = lead.source || "Unknown";
          leadsBySource[source] = (leadsBySource[source] || 0) + 1;
        });
        return {
          type: "bar",
          data: Object.entries(leadsBySource).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(leadsBySource).map(([name, value]) => ({ name, value })),
          },
        };

      case "leads-recent":
        const recentLeads = leads?.filter((l) => isInDateRange(l.created_at)) || [];
        return {
          type: "table",
          data: recentLeads,
          columns: ["display_id", "name", "contact_name", "contact_email", "status", "source", "created_at"],
          stats: [
            { label: "New Leads", value: recentLeads.length },
          ],
          pdfData: {
            stats: [{ label: "New Leads in Period", value: recentLeads.length }],
            tableData: recentLeads.map((l) => ({
              display_id: l.display_id,
              name: l.name,
              contact_name: l.contact_name || "-",
              contact_email: l.contact_email || "-",
              status: l.status,
              source: l.source || "-",
              created_at: l.created_at,
            })),
            columns: ["display_id", "name", "contact_email", "status", "source", "created_at"],
            sectionTitle: "Recent Leads",
          },
        };

      // ============ CLIENT REPORTS ============
      case "clients-all":
        return {
          type: "table",
          data: clients || [],
          columns: ["display_id", "name", "contact_name", "industry", "status", "total_revenue"],
          stats: [
            { label: "Total Clients", value: clients?.length || 0 },
            { label: "Total Revenue", value: `$${(clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0).toLocaleString()}` },
          ],
          pdfData: {
            stats: [
              { label: "Total Clients", value: clients?.length || 0 },
              { label: "Total Revenue", value: `$${(clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0).toLocaleString()}` },
            ],
            tableData: (clients || []).map((c) => ({
              display_id: c.display_id,
              name: c.name,
              contact_name: c.contact_name || "-",
              industry: c.industry || "-",
              status: c.status,
              total_revenue: c.total_revenue || 0,
            })),
            columns: ["display_id", "name", "contact_name", "industry", "status", "total_revenue"],
            sectionTitle: "Clients List",
          },
        };

      case "clients-by-industry":
        const clientsByIndustry: Record<string, number> = {};
        clients?.forEach((client) => {
          const industry = client.industry || "Unknown";
          clientsByIndustry[industry] = (clientsByIndustry[industry] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(clientsByIndustry).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(clientsByIndustry).map(([name, value]) => ({ name, value })),
          },
        };

      case "clients-by-status":
        const clientsByStatusData: Record<string, number> = {};
        clients?.forEach((client) => {
          clientsByStatusData[client.status] = (clientsByStatusData[client.status] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(clientsByStatusData).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(clientsByStatusData).map(([name, value]) => ({ name, value })),
          },
        };

      case "clients-revenue":
        const clientRevenue = clients
          ?.filter((c) => c.total_revenue && c.total_revenue > 0)
          .map((c) => ({ name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name, value: c.total_revenue }))
          .sort((a, b) => (b.value || 0) - (a.value || 0))
          .slice(0, 10) || [];
        return {
          type: "bar",
          data: clientRevenue,
          stats: [
            { label: "Total Revenue", value: `$${(clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0).toLocaleString()}` },
          ],
          pdfData: {
            stats: [{ label: "Total Revenue", value: `$${(clients?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0).toLocaleString()}` }],
            chartData: clientRevenue,
          },
        };

      // ============ SALES REPORTS ============
      case "sales-pipeline":
        const pipelineByStage: Record<string, number> = {
          draft: 0,
          sent: 0,
          negotiating: 0,
          accepted: 0,
          rejected: 0,
        };
        quotes?.forEach((quote) => {
          pipelineByStage[quote.status] = (pipelineByStage[quote.status] || 0) + (quote.value || 0);
        });
        const totalPipeline = quotes?.reduce((sum, q) => sum + (q.value || 0), 0) || 0;
        return {
          type: "bar",
          data: Object.entries(pipelineByStage).map(([name, value]) => ({ name, value })),
          stats: [
            { label: "Total Pipeline", value: `$${totalPipeline.toLocaleString()}` },
            { label: "Total Quotes", value: quotes?.length || 0 },
          ],
          pdfData: {
            stats: [
              { label: "Total Pipeline Value", value: `$${totalPipeline.toLocaleString()}` },
              { label: "Total Quotes", value: quotes?.length || 0 },
            ],
            chartData: Object.entries(pipelineByStage).map(([name, value]) => ({ name, value })),
          },
        };

      case "sales-won-lost":
        const wonQuotes = quotes?.filter((q) => q.status === "accepted") || [];
        const lostQuotes = quotes?.filter((q) => q.status === "rejected") || [];
        const wonValue = wonQuotes.reduce((sum, q) => sum + (q.value || 0), 0);
        const lostValue = lostQuotes.reduce((sum, q) => sum + (q.value || 0), 0);
        return {
          type: "pie",
          data: [
            { name: "Won", value: wonQuotes.length },
            { name: "Lost", value: lostQuotes.length },
            { name: "Pending", value: (quotes?.length || 0) - wonQuotes.length - lostQuotes.length },
          ],
          stats: [
            { label: "Win Rate", value: `${quotes && quotes.length > 0 ? Math.round((wonQuotes.length / quotes.length) * 100) : 0}%` },
            { label: "Won Value", value: `$${wonValue.toLocaleString()}` },
            { label: "Lost Value", value: `$${lostValue.toLocaleString()}` },
          ],
          pdfData: {
            stats: [
              { label: "Win Rate", value: `${quotes && quotes.length > 0 ? Math.round((wonQuotes.length / quotes.length) * 100) : 0}%` },
              { label: "Won Value", value: `$${wonValue.toLocaleString()}` },
              { label: "Lost Value", value: `$${lostValue.toLocaleString()}` },
            ],
            chartData: [
              { name: "Won", value: wonQuotes.length },
              { name: "Lost", value: lostQuotes.length },
              { name: "Pending", value: (quotes?.length || 0) - wonQuotes.length - lostQuotes.length },
            ],
          },
        };

      case "sales-quotes":
        return {
          type: "table",
          data: quotes || [],
          columns: ["display_id", "title", "client_id", "status", "value", "created_at"],
          stats: [
            { label: "Total Quotes", value: quotes?.length || 0 },
            { label: "Total Value", value: `$${(quotes?.reduce((sum, q) => sum + (q.value || 0), 0) || 0).toLocaleString()}` },
          ],
          pdfData: {
            stats: [
              { label: "Total Quotes", value: quotes?.length || 0 },
              { label: "Total Value", value: `$${(quotes?.reduce((sum, q) => sum + (q.value || 0), 0) || 0).toLocaleString()}` },
            ],
            tableData: (quotes || []).map((q) => ({
              display_id: q.display_id,
              title: q.title,
              status: q.status,
              value: q.value || 0,
              created_at: q.created_at,
            })),
            columns: ["display_id", "title", "status", "value", "created_at"],
            sectionTitle: "Quotes List",
          },
        };

      // ============ ACTIVITY REPORTS ============
      case "activities-summary":
        const activityByType: Record<string, number> = {};
        activities?.forEach((activity) => {
          activityByType[activity.activity_type] = (activityByType[activity.activity_type] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(activityByType).map(([name, value]) => ({ name, value })),
          stats: [
            { label: "Total Activities", value: activities?.length || 0 },
          ],
          pdfData: {
            stats: [{ label: "Total Activities", value: activities?.length || 0 }],
            chartData: Object.entries(activityByType).map(([name, value]) => ({ name, value })),
          },
        };

      case "activities-calls":
        const callActivities = activities?.filter((a) => a.activity_type === "call") || [];
        const callOutcomes: Record<string, number> = {};
        callActivities.forEach((call) => {
          const outcome = call.call_outcome || "unknown";
          callOutcomes[outcome] = (callOutcomes[outcome] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(callOutcomes).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
          stats: [
            { label: "Total Calls", value: callActivities.length },
          ],
          pdfData: {
            stats: [{ label: "Total Calls", value: callActivities.length }],
            chartData: Object.entries(callOutcomes).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
          },
        };

      case "activities-emails":
        const emailActivities = activities?.filter((a) => a.activity_type === "email") || [];
        const emailDirections: Record<string, number> = { sent: 0, received: 0 };
        emailActivities.forEach((email) => {
          const direction = email.email_direction || "sent";
          emailDirections[direction] = (emailDirections[direction] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(emailDirections).map(([name, value]) => ({ name, value })),
          stats: [
            { label: "Total Emails", value: emailActivities.length },
          ],
          pdfData: {
            stats: [{ label: "Total Emails", value: emailActivities.length }],
            chartData: Object.entries(emailDirections).map(([name, value]) => ({ name, value })),
          },
        };

      case "activities-tasks":
        const taskActivities = activities?.filter((a) => a.activity_type === "task") || [];
        const taskStatuses: Record<string, number> = {};
        taskActivities.forEach((task) => {
          const status = task.task_status || "pending";
          taskStatuses[status] = (taskStatuses[status] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(taskStatuses).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
          stats: [
            { label: "Total Tasks", value: taskActivities.length },
            { label: "Completed", value: taskStatuses["completed"] || 0 },
          ],
          pdfData: {
            stats: [
              { label: "Total Tasks", value: taskActivities.length },
              { label: "Completed", value: taskStatuses["completed"] || 0 },
            ],
            chartData: Object.entries(taskStatuses).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
          },
        };

      // ============ TEAM REPORTS ============
      case "team-overview":
        return {
          type: "table",
          data: teamMembers || [],
          columns: ["name", "email", "department", "status"],
          stats: [
            { label: "Total Members", value: teamMembers?.length || 0 },
            { label: "Active", value: teamMembers?.filter((m) => m.status === "active").length || 0 },
          ],
          pdfData: {
            stats: [
              { label: "Total Members", value: teamMembers?.length || 0 },
              { label: "Active", value: teamMembers?.filter((m) => m.status === "active").length || 0 },
            ],
            tableData: (teamMembers || []).map((m) => ({
              name: m.name,
              email: m.email,
              department: m.department || "-",
              status: m.status,
            })),
            columns: ["name", "email", "department", "status"],
            sectionTitle: "Team Members",
          },
        };

      case "team-by-department":
        const membersByDept: Record<string, number> = {};
        teamMembers?.forEach((member) => {
          const dept = member.department || "Unassigned";
          membersByDept[dept] = (membersByDept[dept] || 0) + 1;
        });
        return {
          type: "pie",
          data: Object.entries(membersByDept).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(membersByDept).map(([name, value]) => ({ name, value })),
          },
        };

      case "team-by-role":
        const membersByRole: Record<string, number> = {};
        teamMembers?.forEach((member) => {
          const role = member.role_id || "Unassigned";
          membersByRole[role] = (membersByRole[role] || 0) + 1;
        });
        return {
          type: "bar",
          data: Object.entries(membersByRole).map(([name, value]) => ({ name, value })),
          pdfData: {
            chartData: Object.entries(membersByRole).map(([name, value]) => ({ name, value })),
          },
        };

      default:
        return null;
    }
  }, [activeTemplate, contacts, leads, clients, quotes, activities, teamMembers, projects, tickets, dateFrom, dateTo, selectedProjectId, projectOptions]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return;

    const headers = reportData.columns || Object.keys(reportData.data[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.data.map((row: any) =>
        headers.map((h: string) => {
          let value = row[h];
          if (typeof value === "object" && value !== null) value = value?.name || "";
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTemplate?.name || "report"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (!reportData) return null;

    // Handle project selection screen
    if (reportData.type === "select-project") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full border-2">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent className="border-2">
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.display_id} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProjectId && (
            <Button
              variant="outline"
              className="border-2"
              onClick={() => setIsOptionsDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Customize Report
            </Button>
          )}
        </div>
      );
    }

    // Handle project detail report
    if (reportData.type === "project-detail") {
      const { project, tickets: projTickets } = reportData;
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.display_id}</p>
            </div>
            <Button
              variant="outline"
              className="border-2"
              onClick={() => setIsOptionsDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{project.status}</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{project.progress || 0}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{project.budget ? `$${project.budget.toLocaleString()}` : "N/A"}</div>
                <div className="text-sm text-muted-foreground">Budget</div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{projTickets?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Tickets</div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          {projectOptions.includeTimeline && (project.start_date || project.end_date) && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Start: </span>
                    {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not set"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End: </span>
                    {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "Not set"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {projectOptions.includeOverview && project.description && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tickets */}
          {projectOptions.includeTickets && projTickets && projTickets.length > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tickets ({projTickets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projTickets.slice(0, 10).map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs">{ticket.display_id}</TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ticket.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.priority}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {projTickets.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 10 of {projTickets.length} tickets
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    switch (reportData.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number) => value >= 1000 ? `$${value.toLocaleString()}` : value} />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={reportData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "table":
        return (
          <div className="border-2 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {(reportData.columns || []).map((col: string) => (
                    <TableHead key={col} className="capitalize font-semibold">
                      {col.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.data.slice(0, 50).map((row: any, idx: number) => (
                  <TableRow key={row.id || idx}>
                    {(reportData.columns || []).map((col: string) => (
                      <TableCell key={col}>
                        {formatCellValue(col === "company" ? row.company : row[col], col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reportData.data.length > 50 && (
              <p className="text-sm text-muted-foreground p-4 text-center border-t">
                Showing 50 of {reportData.data.length} records
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export reports for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reportData?.type === "table" && (
            <Button onClick={handleExportCSV} variant="outline" className="border-2">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {reportData?.pdfData && (
            <PDFDownloadLink
              document={
                <ReportPDF
                  title={activeTemplate?.name || "Report"}
                  data={reportData.pdfData}
                  organization={organization}
                  dateRange={{ from: dateFrom, to: dateTo }}
                  reportType={selectedReport}
                />
              }
              fileName={`${activeTemplate?.name || "report"}-${format(new Date(), "yyyy-MM-dd")}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} className="border-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 border-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 border-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar - Report Categories & Templates */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {(Object.keys(categoryLabels) as ReportCategory[]).map((category) => {
                const Icon = categoryIcons[category];
                const count = reportTemplates.filter((t) => t.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      const firstTemplate = reportTemplates.find((t) => t.category === category);
                      setSelectedReport(firstTemplate?.id || "");
                      setSelectedProjectId("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-sm font-medium">{categoryLabels[category]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {categoryLabels[selectedCategory]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {categoryTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedReport(template.id);
                      if (template.id !== "project-detail") {
                        setSelectedProjectId("");
                      }
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedReport === template.id
                        ? "bg-muted border-2 border-border"
                        : "hover:bg-muted/50 border-2 border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Report Display */}
        <div className="lg:col-span-3">
          <Card className="border-2">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center gap-3">
                {activeTemplate && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <activeTemplate.icon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle>{activeTemplate?.name || "Select a Report"}</CardTitle>
                  <CardDescription>{activeTemplate?.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : reportData ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  {reportData.stats && reportData.stats.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {reportData.stats.map((stat: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/50 border-2 border-border">
                          <div className="text-sm text-muted-foreground">{stat.label}</div>
                          <div className="text-xl font-bold">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chart/Table */}
                  {renderChart()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a report from the sidebar to view data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Report Options Dialog */}
      <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle>Customize Project Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select which sections to include in the report:
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overview"
                  checked={projectOptions.includeOverview}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeOverview: checked as boolean })
                  }
                />
                <label htmlFor="overview" className="text-sm">Project Overview & Description</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeline"
                  checked={projectOptions.includeTimeline}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeTimeline: checked as boolean })
                  }
                />
                <label htmlFor="timeline" className="text-sm">Timeline (Start/End Dates)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="budget"
                  checked={projectOptions.includeBudget}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeBudget: checked as boolean })
                  }
                />
                <label htmlFor="budget" className="text-sm">Budget Information</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tickets"
                  checked={projectOptions.includeTickets}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeTickets: checked as boolean })
                  }
                />
                <label htmlFor="tickets" className="text-sm">Tickets List</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tasks"
                  checked={projectOptions.includeTasks}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeTasks: checked as boolean })
                  }
                />
                <label htmlFor="tasks" className="text-sm">Tasks</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="milestones"
                  checked={projectOptions.includeMilestones}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeMilestones: checked as boolean })
                  }
                />
                <label htmlFor="milestones" className="text-sm">Milestones</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team"
                  checked={projectOptions.includeTeam}
                  onCheckedChange={(checked) =>
                    setProjectOptions({ ...projectOptions, includeTeam: checked as boolean })
                  }
                />
                <label htmlFor="team" className="text-sm">Team Members</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionsDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={() => setIsOptionsDialogOpen(false)} className="border-2">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
