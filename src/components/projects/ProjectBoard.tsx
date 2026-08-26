import { useState, useEffect } from "react";
import { useTicketsByProject, useUpdateTicket, TicketWithProject } from "@/hooks/useTickets";
import { useWorkflowStatuses, useInitializeWorkflow, WorkflowStatus } from "@/hooks/useWorkflowStatuses";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Zap, BookOpen, CircleDot, Layers, Bug, Clock, AlertTriangle } from "lucide-react";

type TicketType = "epic" | "story" | "task" | "subtask" | "bug";
const typeIcons: Record<TicketType, typeof Zap> = {
  epic: Zap,
  story: BookOpen,
  task: CircleDot,
  subtask: Layers,
  bug: Bug,
};
const typeColors: Record<TicketType, string> = {
  epic: "text-violet-600",
  story: "text-emerald-600",
  task: "text-blue-600",
  subtask: "text-sky-500",
  bug: "text-red-500",
};

const priorityDots: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

interface ProjectBoardProps {
  projectId: string;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const { navigateOrg } = useOrgNavigation();
  const { data: tickets, isLoading: ticketsLoading } = useTicketsByProject(projectId);
  const { data: statuses, isLoading: statusesLoading } = useWorkflowStatuses(projectId);
  const { data: teamMembers } = useTeamMembers();
  const initializeWorkflow = useInitializeWorkflow();
  const updateTicket = useUpdateTicket();
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);

  const isLoading = ticketsLoading || statusesLoading;

  // Auto-initialize workflow statuses if none exist
  useEffect(() => {
    if (!isLoading && (!statuses || statuses.length === 0) && !initializeWorkflow.isPending) {
      initializeWorkflow.mutate({ projectId });
    }
  }, [isLoading, statuses, projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Map tickets to columns based on workflow_status_id, falling back to status enum
  const getColumnTickets = (status: WorkflowStatus): TicketWithProject[] => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      if (t.workflow_status_id) return t.workflow_status_id === status.id;
      // Fallback: map legacy ticket_status to workflow category
      if (status.category === "todo") return t.status === "open";
      if (status.category === "in_progress") return t.status === "in-progress" || t.status === "pending";
      if (status.category === "done") return t.status === "closed";
      return false;
    });
  };

  const handleDragStart = (ticketId: string) => {
    setDraggedTicket(ticketId);
  };

  const handleDrop = (statusId: string, statusCategory: string) => {
    if (!draggedTicket) return;

    // Map workflow category back to ticket status enum
    const statusMap: Record<string, string> = {
      todo: "open",
      in_progress: "in-progress",
      done: "closed",
    };

    updateTicket.mutate({
      id: draggedTicket,
      workflow_status_id: statusId,
      status: statusMap[statusCategory] || "open",
    });

    setDraggedTicket(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag tickets between columns to update status. {statuses?.length || 0} workflow stages configured.
        </p>
        <Badge variant="outline" className="text-xs">
          Customizable Workflow
        </Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {statuses?.map((status) => {
        const columnTickets = getColumnTickets(status);
        return (
          <div
            key={status.id}
            className="flex-shrink-0 w-[280px] flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status.id, status.category)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: status.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {status.name}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/60 ml-auto">
                {columnTickets.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-1.5 min-h-[100px] bg-muted/30 rounded-[3px] p-1.5">
              {columnTickets.map((ticket) => {
                const TypeIcon = typeIcons[(ticket.ticket_type as TicketType) || "task"];
                const typeColor = typeColors[(ticket.ticket_type as TicketType) || "task"];
                const assignee = teamMembers?.find((m) => m.id === ticket.assignee_id);

                return (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={() => handleDragStart(ticket.id)}
                    onClick={() => navigateOrg(`/tickets/${ticket.display_id}`)}
                    className="bg-card border rounded-[3px] p-2.5 cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all select-none"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <TypeIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${typeColor}`} />
                      <span className="text-sm font-medium line-clamp-2 leading-tight">{ticket.title}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">{ticket.display_id}</span>
                        <div className={`w-2 h-2 rounded-full ${priorityDots[ticket.priority]}`} />
                        {ticket.story_points && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {ticket.story_points}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {ticket.due_date && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                          </div>
                        )}
                        {ticket.parent_ticket_id && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        {assignee && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-semibold">
                              {assignee.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>

                    {ticket.labels && ticket.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ticket.labels.slice(0, 3).map((label: string) => (
                          <span key={label} className="text-[9px] px-1 py-0 rounded-[2px] bg-muted text-muted-foreground">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
