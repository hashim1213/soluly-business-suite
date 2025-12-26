import { FolderKanban, Ticket, Lightbulb, DollarSign, Loader2, Users, CheckSquare, Mail, Calendar, MessageSquare, UserPlus, FileText } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { RecentEmails } from "@/components/dashboard/RecentEmails";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TasksList } from "@/components/dashboard/TasksList";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { useProjects } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { useFeatureRequests } from "@/hooks/useFeatureRequests";
import { useQuotes } from "@/hooks/useQuotes";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useContacts } from "@/hooks/useContacts";
import { useEmails, useEmailStats } from "@/hooks/useEmails";
import { useAuth } from "@/contexts/AuthContext";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { useDashboardPreferences, StatCardType, WidgetType } from "@/hooks/useDashboardPreferences";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, addDays, isWithinInterval } from "date-fns";

export default function Dashboard() {
  const { hasPermission, member, organization } = useAuth();
  const canViewAmounts = useCanViewAmounts();
  const { layout, isLoading: prefsLoading } = useDashboardPreferences();

  // Data hooks
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: features, isLoading: featuresLoading } = useFeatureRequests();
  const { data: quotes, isLoading: quotesLoading } = useQuotes();
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: emailStats } = useEmailStats();

  // Tasks due today query
  const { data: tasksDueToday } = useQuery({
    queryKey: ["tasks_due_today", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("project_tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("due_date", today)
        .neq("status", "done");
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Upcoming deadlines (next 7 days)
  const { data: upcomingDeadlines } = useQuery({
    queryKey: ["upcoming_deadlines", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const today = new Date();
      const nextWeek = addDays(today, 7);
      const { count } = await supabase
        .from("project_milestones")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "pending")
        .gte("due_date", today.toISOString().split("T")[0])
        .lte("due_date", nextWeek.toISOString().split("T")[0]);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Permissions
  const canViewProjects = hasPermission("projects", "view");
  const canViewTickets = hasPermission("tickets", "view");
  const canViewFeatures = hasPermission("features", "view");
  const canViewQuotes = hasPermission("quotes", "view");
  const canViewCrm = hasPermission("crm", "view");
  const canViewTeam = hasPermission("team", "view");

  const isLoading = projectsLoading || ticketsLoading || featuresLoading || quotesLoading || prefsLoading;

  // Calculate stats
  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const newProjectsThisMonth = projects?.filter(p => {
    const createdDate = new Date(p.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const openTickets = tickets?.filter(t => t.status !== "closed").length || 0;
  const highPriorityTickets = tickets?.filter(t => t.priority === "high" && t.status !== "closed").length || 0;

  const totalFeatures = features?.length || 0;
  const inProgressFeatures = features?.filter(f => f.status === "in-progress").length || 0;

  const pipelineValue = quotes
    ?.filter(q => q.status !== "rejected" && q.status !== "accepted")
    .reduce((sum, q) => sum + (q.value || 0), 0) || 0;

  const activeTeamMembers = teamMembers?.filter(m => m.status === "active").length || 0;

  const contactsThisMonth = contacts?.filter(c => {
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const feedbackCount = tickets?.filter(t => t.category === "feedback").length || 0;

  const closedTicketsWeek = tickets?.filter(t => {
    if (t.status !== "closed") return false;
    const updatedDate = new Date(t.updated_at);
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    return isWithinInterval(updatedDate, { start: weekStart, end: weekEnd });
  }).length || 0;

  const activeQuotes = quotes?.filter(q => q.status !== "rejected" && q.status !== "accepted").length || 0;
  const totalClients = contacts?.filter(c => c.type === "client").length || 0;

  const formatPipelineValue = (value: number) => {
    if (!canViewAmounts) return "••••••";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Stat card configuration
  const statCardConfigs: Record<StatCardType, { title: string; value: number | string; description: string; icon: any; href: string; permission: boolean }> = {
    activeProjects: {
      title: "Active Projects",
      value: activeProjects,
      description: `${newProjectsThisMonth} starting this month`,
      icon: FolderKanban,
      href: "/projects",
      permission: canViewProjects,
    },
    openTickets: {
      title: "Open Tickets",
      value: openTickets,
      description: `${highPriorityTickets} high priority`,
      icon: Ticket,
      href: "/tickets",
      permission: canViewTickets,
    },
    featureRequests: {
      title: "Feature Requests",
      value: totalFeatures,
      description: `${inProgressFeatures} in progress`,
      icon: Lightbulb,
      href: "/feature-requests",
      permission: canViewFeatures,
    },
    pipelineValue: {
      title: "Pipeline Value",
      value: formatPipelineValue(pipelineValue),
      description: "From active quotes",
      icon: DollarSign,
      href: "/crm?tab=quotes",
      permission: canViewQuotes && canViewCrm,
    },
    teamMembers: {
      title: "Team Members",
      value: activeTeamMembers,
      description: "Active members",
      icon: Users,
      href: "/team",
      permission: canViewTeam,
    },
    tasksDueToday: {
      title: "Tasks Due Today",
      value: tasksDueToday || 0,
      description: "Pending tasks",
      icon: CheckSquare,
      href: "/projects",
      permission: canViewProjects,
    },
    emailsPending: {
      title: "Pending Emails",
      value: emailStats?.pending || 0,
      description: "Awaiting review",
      icon: Mail,
      href: "/emails",
      permission: true,
    },
    upcomingDeadlines: {
      title: "Upcoming Deadlines",
      value: upcomingDeadlines || 0,
      description: "Next 7 days",
      icon: Calendar,
      href: "/projects",
      permission: canViewProjects,
    },
    contactsThisMonth: {
      title: "New Contacts",
      value: contactsThisMonth,
      description: "Added this month",
      icon: UserPlus,
      href: "/crm?tab=contacts",
      permission: canViewCrm,
    },
    feedbackCount: {
      title: "Feedback Items",
      value: feedbackCount,
      description: "Total feedback",
      icon: MessageSquare,
      href: "/tickets?category=feedback",
      permission: canViewTickets,
    },
    closedTicketsWeek: {
      title: "Tickets Closed",
      value: closedTicketsWeek,
      description: "This week",
      icon: Ticket,
      href: "/tickets",
      permission: canViewTickets,
    },
    completedTasksWeek: {
      title: "Tasks Completed",
      value: 0,
      description: "This week",
      icon: CheckSquare,
      href: "/projects",
      permission: canViewProjects,
    },
    totalClients: {
      title: "Total Clients",
      value: totalClients,
      description: "In CRM",
      icon: Users,
      href: "/crm?tab=contacts",
      permission: canViewCrm,
    },
    activeQuotes: {
      title: "Active Quotes",
      value: activeQuotes,
      description: "In progress",
      icon: FileText,
      href: "/crm?tab=quotes",
      permission: canViewQuotes && canViewCrm,
    },
  };

  // Widget components
  const widgetComponents: Record<WidgetType, { component: React.FC; permission: boolean }> = {
    recentTickets: { component: RecentTickets, permission: canViewTickets },
    projectsOverview: { component: ProjectsOverview, permission: canViewProjects },
    recentEmails: { component: RecentEmails, permission: true },
    upcomingMilestones: { component: UpcomingMilestones, permission: canViewProjects },
    teamWorkload: { component: TeamWorkload, permission: canViewTeam },
    quickActions: { component: QuickActions, permission: true },
    recentActivity: { component: RecentActivity, permission: true },
    tasksList: { component: TasksList, permission: canViewProjects },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter stats cards based on permissions
  const visibleStatCards = layout.statsCards.filter(
    (cardId) => statCardConfigs[cardId]?.permission
  );

  // Filter widgets based on permissions
  const visibleWidgets = layout.widgets.filter(
    (widgetId) => widgetComponents[widgetId]?.permission
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {member?.name ? `Welcome, ${member.name}!` : "Overview of your consulting business"}
          </p>
        </div>
        <DashboardCustomizer />
      </div>

      {/* Stats Cards */}
      {visibleStatCards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleStatCards.map((cardId) => {
            const config = statCardConfigs[cardId];
            if (!config) return null;
            return (
              <StatsCard
                key={cardId}
                title={config.title}
                value={config.value}
                description={config.description}
                icon={config.icon}
                href={config.href}
              />
            );
          })}
        </div>
      )}

      {/* Widgets */}
      {visibleWidgets.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleWidgets.map((widgetId) => {
            const widgetConfig = widgetComponents[widgetId];
            if (!widgetConfig) return null;
            const WidgetComponent = widgetConfig.component;
            return <WidgetComponent key={widgetId} />;
          })}
        </div>
      )}

      {/* Empty state */}
      {visibleStatCards.length === 0 && visibleWidgets.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            Your dashboard is empty. Click Customize to add widgets.
          </p>
          <DashboardCustomizer />
        </div>
      )}
    </div>
  );
}
