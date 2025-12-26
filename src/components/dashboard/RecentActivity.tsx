import { Activity, Ticket, FolderKanban, MessageSquare, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "ticket" | "project" | "comment" | "quote" | "contact";
  title: string;
  description: string;
  timestamp: string;
}

export function RecentActivity() {
  const { organization } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent_activity", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch recent items from different tables
      const [ticketsRes, projectsRes, quotesRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, display_id, title, created_at, updated_at")
          .eq("organization_id", organization.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("projects")
          .select("id, display_id, name, created_at, updated_at")
          .eq("organization_id", organization.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("quotes")
          .select("id, display_id, title, created_at, updated_at")
          .eq("organization_id", organization.id)
          .order("updated_at", { ascending: false })
          .limit(2),
      ]);

      const items: ActivityItem[] = [];

      ticketsRes.data?.forEach((t) => {
        items.push({
          id: `ticket-${t.id}`,
          type: "ticket",
          title: t.display_id,
          description: t.title,
          timestamp: t.updated_at,
        });
      });

      projectsRes.data?.forEach((p) => {
        items.push({
          id: `project-${p.id}`,
          type: "project",
          title: p.display_id,
          description: p.name,
          timestamp: p.updated_at,
        });
      });

      quotesRes.data?.forEach((q) => {
        items.push({
          id: `quote-${q.id}`,
          type: "quote",
          title: q.display_id,
          description: q.title,
          timestamp: q.updated_at,
        });
      });

      // Sort by timestamp and take top 5
      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    enabled: !!organization?.id,
  });

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "ticket":
        return <Ticket className="h-4 w-4 text-red-500" />;
      case "project":
        return <FolderKanban className="h-4 w-4 text-blue-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "quote":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "contact":
        return <Users className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : !activities || activities.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No recent activity</div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <div key={activity.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(activity.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {activity.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm truncate mt-0.5">{activity.description}</p>
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
