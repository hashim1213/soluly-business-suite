import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Zap, BookOpen, CircleDot, Bug, Layers } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useActiveSprint, useSprints } from "@/hooks/useSprints";
import { useTickets } from "@/hooks/useTickets";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

const typeIcons = {
  epic: Zap,
  story: BookOpen,
  task: CircleDot,
  subtask: Layers,
  bug: Bug,
} as const;

const typeColors = {
  epic: "text-violet-600",
  story: "text-emerald-600",
  task: "text-blue-600",
  subtask: "text-sky-500",
  bug: "text-red-500",
} as const;

export function SprintOverview() {
  const { navigateOrg } = useOrgNavigation();
  const { data: sprint, isLoading: sprintLoading } = useActiveSprint();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: allSprints } = useSprints();

  const isLoading = sprintLoading || ticketsLoading;

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold uppercase tracking-wider">Active Sprint</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sprint) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-semibold uppercase tracking-wider">Active Sprint</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No active sprint</p>
          <Button variant="outline" onClick={() => navigateOrg("/tickets")}>
            Go to Tickets
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sprintTickets = tickets?.filter((t) => t.sprint_id === sprint.id) || [];
  const doneTickets = sprintTickets.filter((t) => t.status === "closed");
  const totalCount = sprintTickets.length;
  const doneCount = doneTickets.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const hasStoryPoints = sprintTickets.some((t) => t.story_points != null);
  const totalPoints = sprintTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const donePoints = doneTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);

  const daysRemaining = sprint.end_date
    ? differenceInCalendarDays(parseISO(sprint.end_date + "T00:00:00"), new Date())
    : null;

  const daysLabel =
    daysRemaining === null
      ? "No end date"
      : daysRemaining < 0
        ? "Sprint ended"
        : daysRemaining === 0
          ? "Ends today"
          : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold uppercase tracking-wider">Active Sprint</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div
          className="cursor-pointer hover:bg-accent/50 transition-colors -m-2 p-2"
          onClick={() => navigateOrg("/tickets")}
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">{sprint.name}</h4>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {daysLabel}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-sm text-muted-foreground">{sprint.goal}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {doneCount} of {totalCount} done
            </span>
            <span className="text-sm font-mono font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {hasStoryPoints && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Story points</span>
            <span className="font-mono font-medium">
              {donePoints} / {totalPoints}
            </span>
          </div>
        )}

        {/* Breakdown by type */}
        {sprintTickets.length > 0 && (
          <div className="pt-2 border-t border-border space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["epic", "story", "task", "bug"] as const)
                .map((type) => {
                  const count = sprintTickets.filter(t => (t.ticket_type || "task") === type).length;
                  if (count === 0) return null;
                  const Icon = typeIcons[type];
                  return (
                    <div key={type} className="flex items-center gap-1.5 text-xs">
                      <Icon className={`h-3.5 w-3.5 ${typeColors[type]}`} />
                      <span className="capitalize">{type}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0 h-4">{count}</Badge>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        )}

        {/* Velocity (from completed sprints) */}
        {(() => {
          const completedSprints = allSprints?.filter(s => s.status === "completed") || [];
          if (completedSprints.length === 0) return null;
          const recentVelocities = completedSprints.slice(0, 3).map(s => {
            const sprintTix = tickets?.filter(t => t.sprint_id === s.id && t.status === "closed") || [];
            return sprintTix.reduce((sum, t) => sum + (t.story_points || 0), 0);
          });
          const avgVelocity = recentVelocities.length > 0
            ? Math.round(recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length)
            : 0;

          if (avgVelocity === 0) return null;

          return (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg. Velocity</span>
                <span className="font-mono font-medium">{avgVelocity} pts/sprint</span>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
