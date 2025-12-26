import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTickets } from "@/hooks/useTickets";

export function TeamWorkload() {
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const isLoading = membersLoading || ticketsLoading;

  // Calculate workload for each team member
  const workload = teamMembers
    ?.filter((m) => m.status === "active")
    .map((member) => {
      const assignedTickets = tickets?.filter(
        (t) => t.assignee_id === member.id && t.status !== "closed"
      ).length || 0;

      // Assume 10 tickets is "full" workload for visualization
      const percentage = Math.min((assignedTickets / 10) * 100, 100);

      return {
        ...member,
        assignedTickets,
        percentage,
      };
    })
    .sort((a, b) => b.assignedTickets - a.assignedTickets)
    .slice(0, 5) || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : workload.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No team members</div>
        ) : (
          <div className="divide-y">
            {workload.map((member) => (
              <div key={member.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2">
                    <AvatarFallback className="bg-secondary text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.assignedTickets} tickets
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getProgressColor(member.percentage)}`}
                        style={{ width: `${member.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
