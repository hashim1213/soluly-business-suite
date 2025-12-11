import { FolderKanban, Ticket, Lightbulb, DollarSign, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { useProjects } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { useFeatureRequests } from "@/hooks/useFeatureRequests";
import { useQuotes } from "@/hooks/useQuotes";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: features, isLoading: featuresLoading } = useFeatureRequests();
  const { data: quotes, isLoading: quotesLoading } = useQuotes();

  const isLoading = projectsLoading || ticketsLoading || featuresLoading || quotesLoading;

  // Calculate stats from DB data
  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const newProjectsThisMonth = projects?.filter(p => {
    const createdDate = new Date(p.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() &&
           createdDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const openTickets = tickets?.filter(t => t.status !== "closed").length || 0;
  const highPriorityTickets = tickets?.filter(t => t.priority === "high" && t.status !== "closed").length || 0;

  const totalFeatures = features?.length || 0;
  const inProgressFeatures = features?.filter(f => f.status === "in_progress").length || 0;

  const pipelineValue = quotes
    ?.filter(q => q.status !== "rejected" && q.status !== "accepted")
    .reduce((sum, q) => sum + (q.value || 0), 0) || 0;

  const formatPipelineValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your consulting business</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          description={`${newProjectsThisMonth} starting this month`}
          icon={FolderKanban}
          href="/projects"
        />
        <StatsCard
          title="Open Tickets"
          value={openTickets}
          description={`${highPriorityTickets} high priority`}
          icon={Ticket}
          href="/tickets"
        />
        <StatsCard
          title="Feature Requests"
          value={totalFeatures}
          description={`${inProgressFeatures} in progress`}
          icon={Lightbulb}
          href="/tickets/features"
        />
        <StatsCard
          title="Pipeline Value"
          value={formatPipelineValue(pipelineValue)}
          description="From active quotes"
          icon={DollarSign}
          href="/tickets/quotes"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTickets />
        <ProjectsOverview />
      </div>
    </div>
  );
}
