import { useMemo, useRef, useState } from "react";
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
import { Printer, Diamond, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Project, useUpdateProject } from "@/hooks/useProjects";
import {
  ProjectMilestone,
  useCreateProjectMilestone,
  useDeleteProjectMilestone,
  useUpdateProjectMilestone,
} from "@/hooks/useProjectMilestones";
import {
  ProjectTask,
  useCreateProjectTask,
  useDeleteProjectTask,
  useUpdateProjectTask,
} from "@/hooks/useProjectTasks";

interface ProjectGanttProps {
  project: Project;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
}

const DAY = "yyyy-MM-dd";

function safeParse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value + "T00:00:00";
  const d = parseISO(normalized);
  return isNaN(d.getTime()) ? null : startOfDay(d);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type DragState = {
  kind: "project" | "task" | "milestone";
  id: string;
  mode: "move" | "start" | "end";
  originX: number;
  pxPerDay: number;
  deltaDays: number;
  moved: boolean;
};

type EditState =
  | { kind: "project" }
  | { kind: "task"; item: ProjectTask }
  | { kind: "milestone"; item: ProjectMilestone }
  | { kind: "new-task" }
  | { kind: "new-milestone" }
  | null;

export function ProjectGantt({ project, milestones, tasks }: ProjectGanttProps) {
  const updateProject = useUpdateProject();
  const updateTask = useUpdateProjectTask();
  const deleteTask = useDeleteProjectTask();
  const createTask = useCreateProjectTask();
  const updateMilestone = useUpdateProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();
  const createMilestone = useCreateProjectMilestone();

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [edit, setEdit] = useState<EditState>(null);
  const [draft, setDraft] = useState({
    title: "",
    start: "",
    due: "",
    completed: false,
  });

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

  // ----- drag mechanics -------------------------------------------------

  const startDrag = (
    e: React.PointerEvent<HTMLElement>,
    kind: DragState["kind"],
    id: string,
    mode: DragState["mode"]
  ) => {
    const chartEl = (e.currentTarget as HTMLElement).closest("[data-gantt-row]");
    if (!chartEl) return;
    const width = chartEl.getBoundingClientRect().width;
    const state: DragState = {
      kind,
      id,
      mode,
      originX: e.clientX,
      pxPerDay: width / range.totalDays,
      deltaDays: 0,
      moved: false,
    };
    dragRef.current = state;
    setDrag(state);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = dragRef.current;
    if (!s) return;
    const dx = e.clientX - s.originX;
    const deltaDays = Math.round(dx / s.pxPerDay);
    const moved = s.moved || Math.abs(dx) > 4;
    if (deltaDays !== s.deltaDays || moved !== s.moved) {
      const next = { ...s, deltaDays, moved };
      dragRef.current = next;
      setDrag(next);
    }
  };

  const endDrag = () => {
    const s = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!s) return;

    if (!s.moved) {
      // Treated as a click: open the editor
      if (s.kind === "project") {
        openEditor({ kind: "project" });
      } else if (s.kind === "task") {
        const t = tasks.find((x) => x.id === s.id);
        if (t) openEditor({ kind: "task", item: t });
      } else {
        const m = milestones.find((x) => x.id === s.id);
        if (m) openEditor({ kind: "milestone", item: m });
      }
      return;
    }

    if (s.deltaDays === 0) return;
    const shift = (v: string | null | undefined) => {
      const d = safeParse(v);
      return d ? format(addDays(d, s.deltaDays), DAY) : undefined;
    };

    if (s.kind === "project") {
      if (s.mode === "move") {
        updateProject.mutate({
          id: project.id,
          start_date: shift(project.start_date),
          end_date: shift(project.end_date) ?? null,
        });
      } else if (s.mode === "start") {
        updateProject.mutate({ id: project.id, start_date: shift(project.start_date) });
      } else {
        updateProject.mutate({ id: project.id, end_date: shift(project.end_date) ?? null });
      }
    } else if (s.kind === "task") {
      const t = tasks.find((x) => x.id === s.id);
      if (!t) return;
      if (s.mode === "move") {
        updateTask.mutate({ id: t.id, start_date: shift(t.start_date) ?? null, due_date: shift(t.due_date) ?? null });
      } else if (s.mode === "start") {
        // Resizing the left edge sets/creates the start date
        const due = safeParse(t.due_date);
        const base = safeParse(t.start_date) ?? (due ? addDays(due, -2) : null);
        if (!base) return;
        let next = addDays(base, s.deltaDays);
        if (due && next > due) next = due;
        updateTask.mutate({ id: t.id, start_date: format(next, DAY) });
      } else {
        const start = safeParse(t.start_date);
        const due = safeParse(t.due_date);
        if (!due) return;
        let next = addDays(due, s.deltaDays);
        if (start && next < start) next = start;
        updateTask.mutate({ id: t.id, due_date: format(next, DAY) });
      }
    } else {
      const m = milestones.find((x) => x.id === s.id);
      if (!m) return;
      const next = shift(m.due_date);
      if (next) updateMilestone.mutate({ id: m.id, due_date: next });
    }
  };

  const dragDelta = (kind: DragState["kind"], id: string) =>
    drag && drag.kind === kind && drag.id === id ? drag.deltaDays : 0;

  // ----- editor dialog --------------------------------------------------

  const openEditor = (state: NonNullable<EditState>) => {
    if (state.kind === "project") {
      setDraft({
        title: project.name,
        start: project.start_date || "",
        due: project.end_date || "",
        completed: false,
      });
    } else if (state.kind === "task") {
      setDraft({
        title: state.item.title,
        start: state.item.start_date || "",
        due: state.item.due_date || "",
        completed: state.item.completed,
      });
    } else if (state.kind === "milestone") {
      setDraft({
        title: state.item.title,
        start: "",
        due: state.item.due_date,
        completed: state.item.completed,
      });
    } else {
      setDraft({ title: "", start: "", due: "", completed: false });
    }
    setEdit(state);
  };

  const saveEditor = async () => {
    if (!edit) return;
    try {
      if (edit.kind === "project") {
        await updateProject.mutateAsync({
          id: project.id,
          start_date: draft.start || undefined,
          end_date: draft.due || null,
        });
      } else if (edit.kind === "task") {
        await updateTask.mutateAsync({
          id: edit.item.id,
          title: draft.title || edit.item.title,
          start_date: draft.start || null,
          due_date: draft.due || null,
          completed: draft.completed,
        });
      } else if (edit.kind === "milestone") {
        await updateMilestone.mutateAsync({
          id: edit.item.id,
          title: draft.title || edit.item.title,
          due_date: draft.due || edit.item.due_date,
          completed: draft.completed,
        });
      } else if (edit.kind === "new-task") {
        if (!draft.title || !draft.due) return;
        await createTask.mutateAsync({
          project_id: project.id,
          title: draft.title,
          start_date: draft.start || undefined,
          due_date: draft.due,
        });
      } else if (edit.kind === "new-milestone") {
        if (!draft.title || !draft.due) return;
        await createMilestone.mutateAsync({
          project_id: project.id,
          title: draft.title,
          due_date: draft.due,
        });
      }
      setEdit(null);
    } catch {
      // Error toasts handled by hooks
    }
  };

  const deleteEditorItem = async () => {
    if (!edit) return;
    try {
      if (edit.kind === "task") await deleteTask.mutateAsync(edit.item.id);
      if (edit.kind === "milestone") await deleteMilestone.mutateAsync(edit.item.id);
      setEdit(null);
    } catch {
      // Error toasts handled by hooks
    }
  };

  // ----- print / export -------------------------------------------------

  const taskBar = (t: ProjectTask) => {
    const due = safeParse(t.due_date);
    if (!due) return null;
    const start = safeParse(t.start_date) ?? addDays(due, -2);
    return { left: pos(start), width: Math.max(pos(due) - pos(start), 0.8) };
  };

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

  // ----- render ---------------------------------------------------------

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

  const resizeHandle = (side: "start" | "end", onDown: (e: React.PointerEvent<HTMLElement>) => void) => (
    <span
      onPointerDown={onDown}
      onPointerMove={onDragMove}
      onPointerUp={endDrag}
      className={cn(
        "absolute top-0 h-full w-2 cursor-ew-resize touch-none",
        side === "start" ? "left-0" : "right-0"
      )}
    />
  );

  const rowShell = (label: React.ReactNode, chart: React.ReactNode, key: string) => (
    <div key={key} className="flex border-b border-border/60 last:border-b-0">
      <div className="w-40 sm:w-52 shrink-0 px-3 py-1.5 text-sm truncate flex items-center">{label}</div>
      <div className="flex-1 relative h-9" data-gantt-row>
        {gridLines}
        {chart}
      </div>
    </div>
  );

  const editTitle =
    edit?.kind === "project"
      ? "Adjust Project Dates"
      : edit?.kind === "task"
        ? "Edit Task"
        : edit?.kind === "milestone"
          ? "Edit Milestone"
          : edit?.kind === "new-task"
            ? "Add Task"
            : "Add Milestone";

  return (
    <Card className={cn("border border-border shadow-sm", drag && "select-none")}>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Gantt Timeline</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Drag bars to move, drag edges to resize, click to edit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditor({ kind: "new-task" })}>
              <Plus className="h-4 w-4 mr-1.5" />
              Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => openEditor({ kind: "new-milestone" })}>
              <Plus className="h-4 w-4 mr-1.5" />
              Milestone
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF for client
            </Button>
          </div>
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
            (() => {
              const d = dragDelta("project", project.id);
              const s = addDays(projectStart, drag?.kind === "project" && drag.mode !== "end" ? d : 0);
              const e2 = addDays(projectEnd, drag?.kind === "project" && drag.mode !== "start" ? d : 0);
              return rowShell(
                <span className="font-semibold truncate">{project.name}</span>,
                <div
                  onPointerDown={(e) => startDrag(e, "project", project.id, "move")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  className="absolute top-2 h-5 rounded-sm bg-primary cursor-grab active:cursor-grabbing touch-none"
                  style={{ left: `${pos(s)}%`, width: `${Math.max(pos(e2) - pos(s), 1)}%` }}
                  title="Drag to shift the whole project, click to edit dates"
                >
                  {resizeHandle("start", (e) => startDrag(e, "project", project.id, "start"))}
                  {resizeHandle("end", (e) => startDrag(e, "project", project.id, "end"))}
                </div>,
                "project-row"
              );
            })()}

          {/* Task rows */}
          {tasks.map((t) => {
            const due = safeParse(t.due_date);
            const start = due ? (safeParse(t.start_date) ?? addDays(due, -2)) : null;
            const d = dragDelta("task", t.id);
            const isDragging = drag?.kind === "task" && drag.id === t.id;
            const dispStart = start && isDragging && drag.mode !== "end" ? addDays(start, d) : start;
            const dispDue = due && isDragging && drag.mode !== "start" ? addDays(due, d) : due;
            return rowShell(
              <span className={cn("truncate", t.completed && "line-through text-muted-foreground")}>{t.title}</span>,
              dispStart && dispDue ? (
                <div
                  onPointerDown={(e) => startDrag(e, "task", t.id, "move")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  className={cn(
                    "absolute top-2 h-5 rounded-sm cursor-grab active:cursor-grabbing touch-none",
                    t.completed ? "bg-chart-3" : "bg-primary/70",
                    !t.start_date && "opacity-60"
                  )}
                  style={{
                    left: `${pos(dispStart)}%`,
                    width: `${Math.max(pos(dispDue) - pos(dispStart), 0.8)}%`,
                  }}
                  title={`${t.title} — drag to move, click to edit`}
                >
                  {resizeHandle("start", (e) => startDrag(e, "task", t.id, "start"))}
                  {resizeHandle("end", (e) => startDrag(e, "task", t.id, "end"))}
                </div>
              ) : (
                <button
                  className="absolute top-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => openEditor({ kind: "task", item: t })}
                >
                  Set dates
                </button>
              ),
              t.id
            );
          })}

          {/* Milestone rows */}
          {milestones.map((m) => {
            const due = safeParse(m.due_date);
            const d = dragDelta("milestone", m.id);
            const disp = due ? addDays(due, d) : null;
            return rowShell(
              <span className="truncate flex items-center gap-1.5">
                <Diamond className={cn("h-3 w-3 shrink-0", m.completed ? "text-chart-3" : "text-chart-4")} />
                {m.title}
              </span>,
              disp ? (
                <div
                  onPointerDown={(e) => startDrag(e, "milestone", m.id, "move")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  className={cn(
                    "absolute top-2.5 h-3.5 w-3.5 -translate-x-1/2 rotate-45 cursor-grab active:cursor-grabbing touch-none",
                    m.completed ? "bg-chart-3" : "bg-chart-4"
                  )}
                  style={{ left: `${pos(disp)}%` }}
                  title={`${m.title} — drag to move, click to edit`}
                />
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

      {/* Editor dialog */}
      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent className="border sm:max-w-[420px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>{editTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {edit?.kind !== "project" && (
              <div className="grid gap-2">
                <Label htmlFor="gantt-title">Title *</Label>
                <Input
                  id="gantt-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder={edit?.kind === "new-milestone" ? "Milestone title" : "Task title"}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {edit?.kind !== "milestone" && edit?.kind !== "new-milestone" && (
                <div className="grid gap-2">
                  <Label htmlFor="gantt-start">Start date</Label>
                  <Input
                    id="gantt-start"
                    type="date"
                    value={draft.start}
                    onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="gantt-due">
                  {edit?.kind === "project" ? "End date" : "Due date *"}
                </Label>
                <Input
                  id="gantt-due"
                  type="date"
                  value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                />
              </div>
            </div>
            {(edit?.kind === "task" || edit?.kind === "milestone") && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.completed}
                  onCheckedChange={(v) => setDraft({ ...draft, completed: v === true })}
                />
                Completed
              </label>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              {(edit?.kind === "task" || edit?.kind === "milestone") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={deleteEditorItem}
                  disabled={deleteTask.isPending || deleteMilestone.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={saveEditor}
                disabled={
                  updateTask.isPending ||
                  updateMilestone.isPending ||
                  updateProject.isPending ||
                  createTask.isPending ||
                  createMilestone.isPending ||
                  ((edit?.kind === "new-task" || edit?.kind === "new-milestone") &&
                    (!draft.title || !draft.due))
                }
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
