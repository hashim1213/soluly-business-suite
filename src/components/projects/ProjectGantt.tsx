import { useMemo } from "react";
import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from "date-fns";
import { Printer, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { ProjectMilestone, useUpdateProjectMilestone } from "@/hooks/useProjectMilestones";
import { ProjectTask, useUpdateProjectTask } from "@/hooks/useProjectTasks";

interface ProjectGanttProps {
  project: Project;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
}

const DAY = "yyyy-MM-dd";

function safeParse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isNaN(d.getTime()) ? null : startOfDay(d);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function ProjectGantt({ project, milestones, tasks }: ProjectGanttProps) {
  const updateTask = useUpdateProjectTask();
  const updateMilestone = useUpdateProjectMilestone();

  const range = useMemo(() => {
    const dates: Date[] = [];
    const push = (v: string | null | undefined) => {
      const d = safeParse(v);
      if (d) dates.push(d);
    };
    push(project.start_date);
    push(project.end_date);
    milestones.forEach((m) => push(m.due_date));
    tasks.forEach((t) => {
      push(t.start_date);
      push(t.due_date);
    });
    if (dates.length === 0) dates.push(startOfDay(new Date()));
    let start = minDate(dates);
    let end = maxDate(dates);
    // Guarantee a sensible minimum span, then pad for breathing room
    if (differenceInCalendarDays(end, start) < 14) end = addDays(start, 14);
    start = addDays(start, -7);
    end = addDays(end, 7);
    return { start, end, totalDays: differenceInCalendarDays(end, start) + 1 };
  }, [project, milestones, tasks]);

  const pos = (d: Date) =>
    Math.min(100, Math.max(0, (differenceInCalendarDays(d, range.start) / range.totalDays) * 100));

  const ticks = useMemo(() => {
    const interval = { start: range.start, end: range.end };
    const useWeeks = range.totalDays <= 120;
    const points = useWeeks
      ? eachWeekOfInterval(interval, { weekStartsOn: 1 })
      : eachMonthOfInterval(interval);
    return points
      .filter((d) => d >= range.start && d <= range.end)
      .map((d) => ({
        left: pos(d),
        label: useWeeks ? format(d, "MMM d") : format(d, "MMM yyyy"),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const today = startOfDay(new Date());
  const todayLeft = today >= range.start && today <= range.end ? pos(today) : null;

  const projectStart = safeParse(project.start_date);
  const projectEnd = safeParse(project.end_date);

  // A task without a start date renders as a short lead-in ending at its due date
  const taskBar = (t: ProjectTask) => {
    const due = safeParse(t.due_date);
    if (!due) return null;
    const start = safeParse(t.start_date) ?? addDays(due, -2);
    return { left: pos(start), width: Math.max(pos(due) - pos(start), 0.8) };
  };

  const shiftTask = (t: ProjectTask, days: number) => {
    const due = safeParse(t.due_date);
    const start = safeParse(t.start_date);
    updateTask.mutate({
      id: t.id,
      start_date: start ? format(addDays(start, days), DAY) : undefined,
      due_date: due ? format(addDays(due, days), DAY) : undefined,
    });
  };

  const shiftMilestone = (m: ProjectMilestone, days: number) => {
    const due = safeParse(m.due_date);
    if (!due) return;
    updateMilestone.mutate({ id: m.id, due_date: format(addDays(due, days), DAY) });
  };

  const gridLines = (
    <>
      {ticks.map((t, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: `${t.left}%` }} />
      ))}
      {todayLeft !== null && (
        <div className="absolute top-0 bottom-0 w-px bg-destructive" style={{ left: `${todayLeft}%` }} />
      )}
    </>
  );

  const shiftControls = (onShift: (days: number) => void) => (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onShift(-7)} title="Back one week">
        <ChevronsLeft className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onShift(-1)} title="Back one day">
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="text-xs text-muted-foreground px-1">shift</span>
      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onShift(1)} title="Forward one day">
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onShift(7)} title="Forward one week">
        <ChevronsRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const handlePrint = () => {
    const rows: string[] = [];
    const bar = (leftPct: number, widthPct: number, color: string) =>
      `<div style="position:absolute;top:7px;height:14px;border-radius:3px;background:${color};left:${leftPct}%;width:${widthPct}%"></div>`;
    const marker = (leftPct: number, color: string) =>
      `<div style="position:absolute;top:8px;width:12px;height:12px;background:${color};transform:translateX(-6px) rotate(45deg)"></div>`;
    const lines = ticks
      .map((t) => `<div style="position:absolute;top:0;bottom:0;width:1px;background:#e5e5e5;left:${t.left}%"></div>`)
      .join("");
    const row = (label: string, inner: string) =>
      `<div style="display:flex;border-bottom:1px solid #eee">
         <div style="width:200px;flex-shrink:0;padding:6px 8px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</div>
         <div style="flex:1;position:relative;height:28px">${lines}${inner}</div>
       </div>`;

    if (projectStart && projectEnd) {
      rows.push(row(`<b>${esc(project.name)}</b>`, bar(pos(projectStart), Math.max(pos(projectEnd) - pos(projectStart), 1), "#0F6CBD")));
    }
    tasks.forEach((t) => {
      const b = taskBar(t);
      if (b) rows.push(row(esc(t.title), bar(b.left, b.width, t.completed ? "#107C10" : "#479EF5")));
    });
    milestones.forEach((m) => {
      const due = safeParse(m.due_date);
      if (due) rows.push(row(`◆ ${esc(m.title)}`, marker(pos(due), m.completed ? "#107C10" : "#EAA300")));
    });

    const axis = ticks
      .map(
        (t) =>
          `<div style="position:absolute;left:${t.left}%;font-size:10px;color:#616161;transform:translateX(2px)">${t.label}</div>`
      )
      .join("");

    const listRow = (name: string, startLbl: string, dueLbl: string, status: string) =>
      `<tr><td>${name}</td><td>${startLbl}</td><td>${dueLbl}</td><td>${status}</td></tr>`;
    const tableRows = [
      ...tasks.map((t) =>
        listRow(
          esc(t.title),
          t.start_date ? format(safeParse(t.start_date)!, "MMM d, yyyy") : "—",
          t.due_date ? format(safeParse(t.due_date)!, "MMM d, yyyy") : "—",
          t.completed ? "Completed" : "In progress"
        )
      ),
      ...milestones.map((m) =>
        listRow(
          `◆ ${esc(m.title)}`,
          "—",
          format(safeParse(m.due_date)!, "MMM d, yyyy"),
          m.completed ? "Completed" : "Upcoming"
        )
      ),
    ].join("");

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(project.name)} — Timeline</title>
<style>
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #242424; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #616161; font-size: 12px; margin-bottom: 24px; }
  .chart { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
  th { font-weight: 600; color: #616161; }
  .legend { display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: #616161; align-items: center; }
  .chip { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <h1>${esc(project.name)} — Project Timeline</h1>
  <div class="meta">
    Prepared for ${esc(project.client_name)} · ${format(range.start, "MMM d, yyyy")} – ${format(range.end, "MMM d, yyyy")} · Generated ${format(new Date(), "MMM d, yyyy")}
  </div>
  <div class="chart">
    <div style="display:flex;border-bottom:1px solid #e0e0e0;background:#fafafa">
      <div style="width:200px;flex-shrink:0;padding:6px 8px;font-size:11px;color:#616161;font-weight:600">Item</div>
      <div style="flex:1;position:relative;height:24px">${axis}</div>
    </div>
    ${rows.join("")}
  </div>
  <div class="legend">
    <span><span class="chip" style="background:#0F6CBD"></span>Project</span>
    <span><span class="chip" style="background:#479EF5"></span>Task</span>
    <span><span class="chip" style="background:#107C10"></span>Completed</span>
    <span><span class="chip" style="background:#EAA300;transform:rotate(45deg)"></span>Milestone</span>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Start</th><th>Due</th><th>Status</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;

    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  const rowShell = (label: React.ReactNode, chart: React.ReactNode, key: string) => (
    <div key={key} className="flex border-b border-border/60 last:border-b-0">
      <div className="w-40 sm:w-52 shrink-0 px-3 py-1.5 text-sm truncate flex items-center">{label}</div>
      <div className="flex-1 relative h-9">
        {gridLines}
        {chart}
      </div>
    </div>
  );

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Gantt Timeline</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {format(range.start, "MMM d, yyyy")} – {format(range.end, "MMM d, yyyy")} · click a bar to adjust dates
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / PDF for client
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Axis */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-40 sm:w-52 shrink-0 px-3 py-1.5 text-xs font-semibold text-muted-foreground">Item</div>
            <div className="flex-1 relative h-7">
              {ticks.map((t, i) => (
                <span
                  key={i}
                  className="absolute top-1.5 text-[10px] text-muted-foreground whitespace-nowrap pl-0.5"
                  style={{ left: `${t.left}%` }}
                >
                  {t.label}
                </span>
              ))}
              {todayLeft !== null && (
                <span
                  className="absolute top-1.5 text-[10px] font-semibold text-destructive -translate-x-1/2"
                  style={{ left: `${todayLeft}%` }}
                >
                  Today
                </span>
              )}
            </div>
          </div>

          {/* Project row */}
          {projectStart &&
            projectEnd &&
            rowShell(
              <span className="font-semibold truncate">{project.name}</span>,
              <div
                className="absolute top-2 h-5 rounded-sm bg-primary"
                style={{
                  left: `${pos(projectStart)}%`,
                  width: `${Math.max(pos(projectEnd) - pos(projectStart), 1)}%`,
                }}
              />,
              "project-row"
            )}

          {/* Task rows */}
          {tasks.map((t) => {
            const b = taskBar(t);
            return rowShell(
              <span className={cn("truncate", t.completed && "line-through text-muted-foreground")}>{t.title}</span>,
              b ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "absolute top-2 h-5 rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        t.completed ? "bg-chart-3" : "bg-primary/70",
                        !t.start_date && "opacity-60"
                      )}
                      style={{ left: `${b.left}%`, width: `${b.width}%` }}
                      title={t.title}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-72 border" align="start">
                    <div className="space-y-3">
                      <p className="font-medium text-sm">{t.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={t.start_date || ""}
                            onChange={(e) =>
                              updateTask.mutate({ id: t.id, start_date: e.target.value || null })
                            }
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Due</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={t.due_date || ""}
                            onChange={(e) =>
                              updateTask.mutate({ id: t.id, due_date: e.target.value || null })
                            }
                          />
                        </div>
                      </div>
                      {shiftControls((days) => shiftTask(t, days))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="absolute top-2 text-xs text-muted-foreground">No due date</span>
              ),
              t.id
            );
          })}

          {/* Milestone rows */}
          {milestones.map((m) => {
            const due = safeParse(m.due_date);
            return rowShell(
              <span className="truncate flex items-center gap-1.5">
                <Diamond className={cn("h-3 w-3 shrink-0", m.completed ? "text-chart-3" : "text-chart-4")} />
                {m.title}
              </span>,
              due ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "absolute top-2.5 h-3.5 w-3.5 -translate-x-1/2 rotate-45 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        m.completed ? "bg-chart-3" : "bg-chart-4"
                      )}
                      style={{ left: `${pos(due)}%` }}
                      title={m.title}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-72 border" align="start">
                    <div className="space-y-3">
                      <p className="font-medium text-sm">{m.title}</p>
                      <div className="grid gap-1">
                        <Label className="text-xs">Due date</Label>
                        <Input
                          type="date"
                          className="h-8"
                          value={m.due_date}
                          onChange={(e) => {
                            if (e.target.value) updateMilestone.mutate({ id: m.id, due_date: e.target.value });
                          }}
                        />
                      </div>
                      {shiftControls((days) => shiftMilestone(m, days))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null,
              m.id
            );
          })}

          {tasks.length === 0 && milestones.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Add tasks and milestones to build the timeline.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
