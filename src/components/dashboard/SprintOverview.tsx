import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useActiveSprint } from "@/hooks/useSprints";
import { useTickets } from "@/hooks/useTickets";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

export function SprintOverview() {
  const { navigateOrg } = useOrgNavigation();
  const { data: sprint, isLoading: sprintLoading } = useActiveSprint();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

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
    ? differenceInCalendarDays(parseISO(sprint.end_date), new Date())
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
      </CardContent>
    </Card>
  );
}
