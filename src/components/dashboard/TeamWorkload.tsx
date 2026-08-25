import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTickets } from "@/hooks/useTickets";

export function TeamWorkload() {
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const isLoading = membersLoading || ticketsLoading;

  const workload = teamMembers
    ?.filter((m) => m.status === "active")
    .map((member) => {
      const openTickets = tickets?.filter(
        (t) => t.assignee_id === member.id && t.status !== "closed"
      ) || [];

      const totalPoints = openTickets.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const totalEstHours = openTickets.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const inProgress = openTickets.filter(t => t.status === "in-progress").length;
      const percentage = Math.min((openTickets.length / 8) * 100, 100);

      return {
        ...member,
        openCount: openTickets.length,
        inProgress,
        totalPoints,
        totalEstHours,
        percentage,
      };
    })
    .sort((a, b) => b.percentage - a.percentage) || [];

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const getCapacityLabel = (pct: number) => {
    if (pct >= 90) return { text: "Over", color: "bg-red-500/10 text-red-600" };
    if (pct >= 70) return { text: "High", color: "bg-amber-500/10 text-amber-600" };
    if (pct >= 40) return { text: "Normal", color: "bg-emerald-500/10 text-emerald-600" };
    return { text: "Low", color: "bg-slate-500/10 text-slate-600" };
  };

  return (
    <Card className="border">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
        ) : workload.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No active team members</div>
        ) : (
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {workload.map((member) => {
              const cap = getCapacityLabel(member.percentage);
              return (
                <div key={member.id} className="px-3 py-2.5 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{member.name}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${cap.color}`}>
                          {cap.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{member.openCount} open</span>
                        <span>{member.inProgress} active</span>
                        {member.totalPoints > 0 && <span>{member.totalPoints} pts</span>}
                        {member.totalEstHours > 0 && <span>{member.totalEstHours}h est</span>}
                      </div>
                    </div>
                    {/* Capacity bar */}
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full transition-all ${
                          member.percentage >= 90 ? "bg-red-500" :
                          member.percentage >= 70 ? "bg-amber-500" :
                          member.percentage >= 40 ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                        style={{ width: `${member.percentage}%` }}
                      />
                    </div>
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
