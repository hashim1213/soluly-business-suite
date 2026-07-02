import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Diamond, CheckSquare, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { ProjectMilestone } from "@/hooks/useProjectMilestones";
import { ProjectTask } from "@/hooks/useProjectTasks";

interface ProjectCalendarProps {
  project: Project;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
}

type DayEvent =
  | { kind: "milestone"; milestone: ProjectMilestone }
  | { kind: "task"; task: ProjectTask };

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isNaN(d.getTime()) ? null : startOfDay(d);
}

const MAX_CHIPS = 3;

export function ProjectCalendar({ project, milestones, tasks }: ProjectCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const projectStart = parse(project.start_date);
  const projectEnd = parse(project.end_date);

  // All days shown on the grid: full weeks covering the month (Sun–Sat)
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(month)),
      end: endOfWeek(endOfMonth(month)),
    });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const eventsForDay = (day: Date): DayEvent[] => {
    const items: DayEvent[] = [];
    milestones.forEach((m) => {
      const due = parse(m.due_date);
      if (due && isSameDay(due, day)) items.push({ kind: "milestone", milestone: m });
    });
    tasks.forEach((t) => {
      const due = parse(t.due_date);
      if (due && isSameDay(due, day)) items.push({ kind: "task", task: t });
    });
    return items;
  };

  const inProjectRange = (day: Date) =>
    !!projectStart &&
    (projectEnd
      ? isWithinInterval(day, { start: projectStart, end: projectEnd })
      : day >= projectStart);

  const milestoneChipClass = (m: ProjectMilestone) => {
    const due = parse(m.due_date);
    const missed = !m.completed && due !== null && due < startOfDay(new Date());
    if (m.completed) return "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400";
    if (missed) return "bg-destructive/15 text-destructive";
    return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
  };

  const chip = (event: DayEvent, i: number) => {
    if (event.kind === "milestone") {
      const m = event.milestone;
      return (
        <div
          key={`m-${m.id}-${i}`}
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-tight truncate",
            milestoneChipClass(m)
          )}
          title={m.title}
        >
          <Diamond className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{m.title}</span>
        </div>
      );
    }
    const t = event.task;
    return (
      <div
        key={`t-${t.id}-${i}`}
        className={cn(
          "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-tight truncate",
          t.completed
            ? "bg-muted text-muted-foreground line-through"
            : "bg-primary/15 text-primary"
        )}
        title={t.title}
      >
        <CheckSquare className="h-2.5 w-2.5 shrink-0" />
        <span className="truncate">{t.title}</span>
      </div>
    );
  };

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle>{format(month, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-1.5 text-xs font-semibold text-muted-foreground text-left border-r border-border/60 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Month grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day) => {
              const events = eventsForDay(day);
              const outside = !isSameMonth(day, month);
              const today = isToday(day);
              const overflow = events.length - MAX_CHIPS;
              const isStart = projectStart && isSameDay(day, projectStart);
              const isEnd = projectEnd && isSameDay(day, projectEnd);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[104px] sm:min-h-[116px] border-r border-border/60 last:border-r-0 p-1 sm:p-1.5 text-left align-top flex flex-col gap-0.5 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
                    outside && "bg-muted/30",
                    !outside && isWeekend(day) && "bg-muted/15",
                    !outside && inProjectRange(day) && "bg-primary/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        today
                          ? "bg-primary text-primary-foreground font-semibold"
                          : outside
                            ? "text-muted-foreground/60"
                            : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {(isStart || isEnd) && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary truncate">
                        <Flag className="h-2.5 w-2.5 shrink-0" />
                        <span className="hidden sm:inline">{isStart ? "Start" : "End"}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {events.slice(0, MAX_CHIPS).map((ev, i) => chip(ev, i))}
                    {overflow > 0 && (
                      <span className="text-[11px] text-muted-foreground font-medium px-1.5">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/60" /> Milestone
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600/60" /> Completed milestone
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-destructive/60" /> Missed deadline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" /> Task due
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/10 border border-primary/30" /> Project duration
          </span>
        </div>
      </CardContent>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="border sm:max-w-[440px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>
              {selectedDay &&
                format(selectedDay, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3 max-h-[50vh] overflow-y-auto">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {selectedDay && inProjectRange(selectedDay)
                  ? "Nothing scheduled — this day is within the project duration."
                  : "Nothing scheduled on this date."}
              </p>
            ) : (
              selectedEvents.map((ev, i) =>
                ev.kind === "milestone" ? (
                  <div key={`dm-${i}`} className="p-3 border border-border rounded-sm">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Diamond className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-semibold text-sm">{ev.milestone.title}</span>
                      {ev.milestone.completed ? (
                        <Badge className="bg-emerald-600 text-white text-xs">Completed</Badge>
                      ) : parse(ev.milestone.due_date)! < startOfDay(new Date()) ? (
                        <Badge className="bg-red-600 text-white text-xs">Missed</Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-black text-xs">Upcoming</Badge>
                      )}
                    </div>
                    {ev.milestone.description && (
                      <p className="text-sm text-muted-foreground">{ev.milestone.description}</p>
                    )}
                  </div>
                ) : (
                  <div key={`dt-${i}`} className="p-3 border border-border rounded-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      <span className={cn("font-semibold text-sm", ev.task.completed && "line-through text-muted-foreground")}>
                        {ev.task.title}
                      </span>
                      {ev.task.completed ? (
                        <Badge className="bg-emerald-600 text-white text-xs">Done</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs capitalize">{ev.task.priority}</Badge>
                      )}
                      {ev.task.assignee?.name && (
                        <span className="text-xs text-muted-foreground">· {ev.task.assignee.name}</span>
                      )}
                    </div>
                  </div>
                )
              )
            )}
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
