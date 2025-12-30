import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Square, Clock, Pause, RotateCcw, Loader2 } from "lucide-react";
import { useCreateTimeEntry } from "@/hooks/useTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface SessionState {
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  projectId: string;
  description: string;
}

const STORAGE_KEY = "soluly_session_tracker";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function msToHours(ms: number): number {
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

export function SessionTracker() {
  const { member } = useAuth();
  const { data: projects } = useProjects();
  const createTimeEntry = useCreateTimeEntry();

  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { isRunning: false, startTime: null, pausedTime: 0, projectId: "", description: "" };
      }
    }
    return { isRunning: false, startTime: null, pausedTime: 0, projectId: "", description: "" };
  });

  const [elapsed, setElapsed] = useState(0);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveForm, setSaveForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    billable: true,
  });

  // Save session to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  // Update elapsed time every second when running
  useEffect(() => {
    if (!session.isRunning || !session.startTime) {
      setElapsed(session.pausedTime);
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(session.pausedTime + (now - session.startTime!));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session.isRunning, session.startTime, session.pausedTime]);

  const handleStart = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
  }, []);

  const handlePause = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isRunning: false,
      pausedTime: prev.pausedTime + (Date.now() - (prev.startTime || Date.now())),
      startTime: null,
    }));
  }, []);

  const handleStop = useCallback(() => {
    // Calculate final elapsed time
    const finalElapsed = session.isRunning && session.startTime
      ? session.pausedTime + (Date.now() - session.startTime)
      : session.pausedTime;

    if (finalElapsed > 0) {
      setElapsed(finalElapsed);
      setIsSaveDialogOpen(true);
    }
  }, [session]);

  const handleReset = useCallback(() => {
    setSession({
      isRunning: false,
      startTime: null,
      pausedTime: 0,
      projectId: "",
      description: "",
    });
    setElapsed(0);
  }, []);

  const handleSave = async () => {
    if (!member?.id) return;

    const hours = msToHours(elapsed);
    if (hours < 0.01) return;

    await createTimeEntry.mutateAsync({
      team_member_id: member.id,
      date: saveForm.date,
      hours,
      project_id: session.projectId || null,
      description: session.description || null,
      billable: saveForm.billable,
    });

    handleReset();
    setIsSaveDialogOpen(false);
  };

  const handleDiscard = () => {
    handleReset();
    setIsSaveDialogOpen(false);
  };

  const hours = msToHours(elapsed);

  return (
    <>
      <Card className="border-2 border-border bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Timer Display */}
            <div className="flex items-center gap-4 flex-1">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                session.isRunning
                  ? "bg-green-500/20 text-green-500 animate-pulse"
                  : elapsed > 0
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-muted text-muted-foreground"
              }`}>
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-bold tracking-tight">
                    {formatDuration(elapsed)}
                  </span>
                  {session.isRunning && (
                    <Badge variant="default" className="bg-green-500 animate-pulse">
                      Recording
                    </Badge>
                  )}
                  {!session.isRunning && elapsed > 0 && (
                    <Badge variant="secondary">
                      Paused
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hours > 0 ? `${hours} hours logged` : "Start tracking your session"}
                </p>
              </div>
            </div>

            {/* Project & Description */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Select
                value={session.projectId || "none"}
                onValueChange={(value) => setSession((prev) => ({ ...prev, projectId: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="border-2 w-full sm:w-[180px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="What are you working on?"
                value={session.description}
                onChange={(e) => setSession((prev) => ({ ...prev, description: e.target.value }))}
                className="border-2 flex-1"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!session.isRunning && elapsed === 0 && (
                <Button onClick={handleStart} className="border-2 bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              {session.isRunning && (
                <>
                  <Button onClick={handlePause} variant="outline" className="border-2">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={handleStop} variant="destructive" className="border-2">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
              {!session.isRunning && elapsed > 0 && (
                <>
                  <Button onClick={handleStart} className="border-2 bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={handleStop} variant="default" className="border-2">
                    <Square className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[425px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Save Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-3xl font-mono font-bold">{formatDuration(elapsed)}</p>
              <p className="text-sm text-muted-foreground mt-1">{hours} hours</p>
            </div>

            {session.projectId && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {projects?.find((p) => p.id === session.projectId)?.name || "Project"}
                </Badge>
              </div>
            )}

            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}

            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={saveForm.date}
                onChange={(e) => setSaveForm({ ...saveForm, date: e.target.value })}
                className="border-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Billable</Label>
                <p className="text-xs text-muted-foreground">Mark as billable hours</p>
              </div>
              <Switch
                checked={saveForm.billable}
                onCheckedChange={(checked) => setSaveForm({ ...saveForm, billable: checked })}
              />
            </div>
          </div>
          <div className="flex justify-between gap-3 border-t-2 border-border pt-4">
            <Button variant="ghost" onClick={handleDiscard} className="text-destructive hover:text-destructive">
              Discard
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} className="border-2">
                Continue Timer
              </Button>
              <Button
                onClick={handleSave}
                disabled={createTimeEntry.isPending || hours < 0.01}
                className="border-2"
              >
                {createTimeEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
