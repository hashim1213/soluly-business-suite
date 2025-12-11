import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useTickets } from "@/hooks/useTickets";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { projectStatusStyles } from "@/lib/styles";

export function ProjectsOverview() {
  const { navigateOrg } = useOrgNavigation();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const isLoading = projectsLoading || ticketsLoading;

  // Get active projects (limit to 5)
  const activeProjects = projects
    ?.filter(p => p.status === "active" || p.status === "pending")
    .slice(0, 5) || [];

  // Count open tickets per project
  const getTicketCount = (projectId: string) => {
    return tickets?.filter(t => t.project_id === projectId && t.status !== "closed").length || 0;
  };

  const formatValue = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg font-bold uppercase tracking-wider">Active Projects</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border shadow-sm">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg font-bold uppercase tracking-wider">Active Projects</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activeProjects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No active projects found
          </div>
        ) : (
          <div className="divide-y-2 divide-border">
            {activeProjects.map((project) => {
              const ticketCount = getTicketCount(project.id);
              return (
                <div
                  key={project.id}
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigateOrg(`/projects/${project.display_id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{project.name}</h4>
                      <span className="text-sm text-muted-foreground">{ticketCount} open tickets</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono">{formatValue(project.budget)}</div>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${
                          projectStatusStyles[project.status as keyof typeof projectStatusStyles] || "bg-slate-400 text-black"
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={project.progress || 0} className="h-2 flex-1" />
                    <span className="text-sm font-mono font-medium w-12 text-right">{project.progress || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
