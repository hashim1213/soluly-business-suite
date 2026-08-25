import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";

export function TeamUtilization() {
  const { organization } = useAuth();
  const { data: teamMembers } = useTeamMembers();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: timeEntries } = useQuery({
    queryKey: ["kpi_team_utilization", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from("time_entries")
        .select("team_member_id, hours, billable, date")
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const memberUtilization = useMemo(() => {
    const activeMembers = teamMembers?.filter(m => m.status === "active") || [];
    if (!activeMembers.length || !timeEntries) return [];

    return activeMembers.map(member => {
      const memberEntries = timeEntries.filter(e => e.team_member_id === member.id);
      const weekEntries = memberEntries.filter(e =>
        isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd })
      );

      const hoursThisWeek = weekEntries.reduce((sum, e) => sum + e.hours, 0);
      const billableThisWeek = weekEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);
      const totalHoursLogged = memberEntries.reduce((sum, e) => sum + e.hours, 0);
      const totalBillable = memberEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);

      const weeklyCapacity = 40;
      const utilizationPct = Math.min(Math.round((hoursThisWeek / weeklyCapacity) * 100), 100);
      const billableRatio = totalHoursLogged > 0
        ? Math.round((totalBillable / totalHoursLogged) * 100)
        : 0;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        hoursThisWeek,
        billableThisWeek,
        totalHoursLogged,
        utilizationPct,
        billableRatio,
        hourlyRate: member.hourly_rate,
      };
    }).sort((a, b) => b.utilizationPct - a.utilizationPct);
  }, [teamMembers, timeEntries, weekStart, weekEnd]);

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const getUtilColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-slate-400";
  };

  return (
    <Card className="border">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Team Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {memberUtilization.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No active team members</div>
        ) : (
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {memberUtilization.map(member => (
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
                      <span className="text-xs font-mono text-muted-foreground">
                        {member.hoursThisWeek.toFixed(1)}h / 40h
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={member.utilizationPct} className="h-1.5 flex-1" />
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                        <span>{member.utilizationPct}% util</span>
                        <span>{member.billableRatio}% bill</span>
                      </div>
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
