import { CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

export function TasksList() {
  const { organization, member } = useAuth();
  const { navigateOrg } = useOrgNavigation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my_tasks", organization?.id, member?.id],
    queryFn: async () => {
      if (!organization?.id || !member?.id) return [];

      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          project:projects(id, name, display_id)
        `)
        .eq("organization_id", organization.id)
        .eq("assignee_id", member.id)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && !!member?.id,
  });

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="h-4 w-4" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No pending tasks</div>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigateOrg(`/projects/${task.project?.display_id}`)}
              >
                <div className="flex items-start gap-2">
                  <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate">
                        {task.project?.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityColors[task.priority] || ""}`}
                      >
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                        </span>
                      )}
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
