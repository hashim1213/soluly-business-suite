import { useState } from "react";
import { ArrowRight, Building, Check, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ticketPriorityStyles } from "@/lib/styles";
import { TicketWithProject } from "@/hooks/useTickets";
import { Sprint } from "@/hooks/useSprints";
import { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const boardColumns: { status: TicketStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in-progress", label: "In Progress" },
  { status: "pending", label: "Pending" },
  { status: "closed", label: "Closed" },
];

interface TicketsBoardProps {
  tickets: TicketWithProject[];
  sprints: Sprint[];
  onTicketClick: (ticket: TicketWithProject) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  onMoveToSprint: (ticketId: string, sprintId: string | null) => void;
  onEdit: (ticket: TicketWithProject, e: React.MouseEvent) => void;
  onDelete: (ticketId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TicketsBoard({
  tickets,
  sprints,
  onTicketClick,
  onStatusChange,
  onMoveToSprint,
  onEdit,
  onDelete,
}: TicketsBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-3 sm:p-4">
      {boardColumns.map((column) => {
        const columnTickets = tickets.filter((t) => t.status === column.status);
        const totalPoints = columnTickets.reduce((sum, t) => sum + (t.story_points ?? 0), 0);
        const isDragOver = dragOverColumn === column.status;
        return (
          <div
            key={column.status}
            className={`flex flex-col rounded-sm border border-border bg-muted/30 min-h-[240px] transition-shadow ${
              isDragOver ? "ring-2 ring-primary/40" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverColumn !== column.status) setDragOverColumn(column.status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const ticketId = e.dataTransfer.getData("text/plain");
              if (!ticketId) return;
              const ticket = tickets.find((t) => t.id === ticketId);
              if (!ticket || ticket.status === column.status) return;
              onStatusChange(ticketId, column.status);
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {column.label}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {columnTickets.length}
                </Badge>
              </div>
              <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                {totalPoints} pts
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-2">
              {columnTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", ticket.id)}
                  onClick={() => onTicketClick(ticket)}
                  className="cursor-pointer rounded-sm border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium line-clamp-2">{ticket.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6 shrink-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onTicketClick(ticket);
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => onEdit(ticket, e)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Ticket
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Move to Sprint
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="border">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveToSprint(ticket.id, null);
                                }}
                              >
                                Backlog
                                {!ticket.sprint_id && <Check className="h-3.5 w-3.5 ml-auto" />}
                              </DropdownMenuItem>
                              {sprints.map((sprint) => (
                                <DropdownMenuItem
                                  key={sprint.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveToSprint(ticket.id, sprint.id);
                                  }}
                                >
                                  {sprint.name}
                                  {sprint.status === "active" ? " · Active" : ""}
                                  {ticket.sprint_id === sprint.id && (
                                    <Check className="h-3.5 w-3.5 ml-auto" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ticket.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {ticket.display_id}
                  </div>
                  {ticket.project?.name && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="h-3 w-3 shrink-0" />
                      <span className="truncate">{ticket.project.name}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${ticketPriorityStyles[ticket.priority]} text-xs`}>
                        {ticket.priority}
                      </Badge>
                      {ticket.story_points != null && (
                        <span className="rounded-full bg-muted px-2 text-xs">
                          {ticket.story_points}
                        </span>
                      )}
                    </div>
                    {ticket.assignee?.name && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(ticket.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              {columnTickets.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
