import { FolderKanban, Ticket, Lightbulb, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your consulting business</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value={8}
          description="3 starting this month"
          icon={FolderKanban}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Open Tickets"
          value={24}
          description="6 high priority"
          icon={Ticket}
          trend={{ value: 8, isPositive: false }}
        />
        <StatsCard
          title="Feature Requests"
          value={15}
          description="4 in progress"
          icon={Lightbulb}
        />
        <StatsCard
          title="Pipeline Value"
          value="$170K"
          description="From active quotes"
          icon={DollarSign}
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTickets />
        <ProjectsOverview />
      </div>
    </div>
  );
}
