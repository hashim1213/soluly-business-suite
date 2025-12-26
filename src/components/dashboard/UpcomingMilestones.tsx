import { Flag, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, isPast } from "date-fns";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

export function UpcomingMilestones() {
  const { organization } = useAuth();
  const { navigateOrg } = useOrgNavigation();

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["upcoming_milestones", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("project_milestones")
        .select(`
          *,
          project:projects(id, name, display_id)
        `)
        .eq("organization_id", organization.id)
        .eq("status", "pending")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const getDaysLabel = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (isPast(new Date(dueDate))) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const getDaysBadgeClass = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (isPast(new Date(dueDate))) return "bg-red-100 text-red-800 border-red-200";
    if (days <= 3) return "bg-orange-100 text-orange-800 border-orange-200";
    if (days <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4" />
          Upcoming Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : !milestones || milestones.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No upcoming milestones</div>
        ) : (
          <div className="divide-y">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigateOrg(`/projects/${milestone.project?.display_id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{milestone.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {milestone.project?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className={getDaysBadgeClass(milestone.due_date!)}>
                    {getDaysLabel(milestone.due_date!)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
