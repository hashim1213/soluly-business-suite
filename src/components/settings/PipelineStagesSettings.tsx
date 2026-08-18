import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PipelineStage,
  StageCategory,
  usePipelineStages,
  useInitializePipelineStages,
  useCreatePipelineStage,
  useUpdatePipelineStage,
  useDeletePipelineStage,
  useReorderPipelineStages,
  stageTextColor,
} from "@/hooks/usePipelineStages";

const SWATCHES = ["#E2E8F0", "#3B82F6", "#A855F7", "#22C55E", "#EF4444", "#F59E0B", "#0D9488", "#DB2777"];

const CATEGORY_LABELS: Record<StageCategory, string> = {
  open: "Open (in pipeline)",
  won: "Won (counts as revenue)",
  lost: "Lost (closed out)",
};

function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          className="h-5 w-5 rounded-sm border border-border"
          style={{ backgroundColor: c, outline: value === c ? "2px solid hsl(var(--primary))" : undefined, outlineOffset: 1 }}
          onClick={() => onChange(c)}
          aria-label={c}
        />
      ))}
    </div>
  );
}

export function PipelineStagesSettings() {
  const { data: stages } = usePipelineStages();
  const initialize = useInitializePipelineStages();
  const createStage = useCreatePipelineStage();
  const updateStage = useUpdatePipelineStage();
  const deleteStage = useDeletePipelineStage();
  const reorderStages = useReorderPipelineStages();

  const [isAdding, setIsAdding] = useState(false);
  const [newStage, setNewStage] = useState({ name: "", color: SWATCHES[1], category: "open" as StageCategory, winProgress: 50 });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", color: "", category: "open" as StageCategory, winProgress: 50 });
  const [deleteTarget, setDeleteTarget] = useState<PipelineStage | null>(null);

  // Stages without ids are the built-in defaults
  const isCustomized = !!stages?.[0]?.id;
  const isPending =
    initialize.isPending || createStage.isPending || updateStage.isPending || deleteStage.isPending || reorderStages.isPending;

  // Copies defaults into org rows and returns the fresh, editable list
  const ensureCustomized = async (): Promise<PipelineStage[]> => {
    if (isCustomized) return stages || [];
    const rows = await initialize.mutateAsync();
    return (rows || [])
      .map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        color: r.color,
        stageCategory: r.stage_category as StageCategory,
        winProgress: r.win_progress,
        position: r.position,
      }))
      .sort((a, b) => a.position - b.position);
  };

  const handleAdd = async () => {
    if (!newStage.name.trim()) return;
    const list = await ensureCustomized();
    await createStage.mutateAsync({
      name: newStage.name.trim(),
      color: newStage.color,
      stageCategory: newStage.category,
      winProgress: newStage.category === "won" ? 100 : newStage.category === "lost" ? 0 : newStage.winProgress,
      position: list.length,
    });
    setNewStage({ name: "", color: SWATCHES[1], category: "open", winProgress: 50 });
    setIsAdding(false);
  };

  const startEdit = (stage: PipelineStage) => {
    setEditingKey(stage.key);
    setEditDraft({ name: stage.name, color: stage.color, category: stage.stageCategory, winProgress: stage.winProgress });
  };

  const handleSaveEdit = async (stage: PipelineStage) => {
    if (!editDraft.name.trim()) return;
    const list = await ensureCustomized();
    const row = list.find((s) => s.key === stage.key);
    if (!row?.id) return;
    await updateStage.mutateAsync({
      id: row.id,
      name: editDraft.name.trim(),
      color: editDraft.color,
      stage_category: editDraft.category,
      win_progress: editDraft.winProgress,
    });
    setEditingKey(null);
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const list = await ensureCustomized();
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderStages.mutateAsync(
      reordered.map((s, i) => ({ id: s.id!, position: i }))
    );
  };

  const handleDelete = async (stage: PipelineStage) => {
    const list = await ensureCustomized();
    const row = list.find((s) => s.key === stage.key);
    const fallback = list.find((s) => s.key !== stage.key);
    if (!row?.id || !fallback) return;
    await deleteStage.mutateAsync({ id: row.id, key: row.key, fallbackKey: fallback.key });
    setDeleteTarget(null);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sales Pipeline Stages</CardTitle>
        <CardDescription>
          Customize the columns of your CRM deal board. Deals in a deleted stage move to the first remaining stage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages?.map((stage, index) => (
          <div key={stage.key} className="flex items-center gap-2 border border-border rounded-sm px-2 py-1.5">
            {editingKey === stage.key ? (
              <>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex gap-2">
                    <Input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className="h-7 border"
                      autoFocus
                    />
                    <Select
                      value={editDraft.category}
                      onValueChange={(v: StageCategory) => setEditDraft({ ...editDraft, category: v })}
                    >
                      <SelectTrigger className="h-7 w-[190px] border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border">
                        {(Object.keys(CATEGORY_LABELS) as StageCategory[]).map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ColorSwatchPicker value={editDraft.color} onChange={(c) => setEditDraft({ ...editDraft, color: c })} />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(stage)} disabled={isPending}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingKey(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Badge
                  className="shrink-0"
                  style={{ backgroundColor: stage.color, color: stageTextColor(stage.color) }}
                >
                  {stage.name}
                </Badge>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {CATEGORY_LABELS[stage.stageCategory]}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, -1)} disabled={index === 0 || isPending}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 1)} disabled={index === (stages?.length || 0) - 1 || isPending}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(stage)} disabled={isPending}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteTarget(stage)}
                  disabled={isPending || (stages?.length || 0) <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="border border-border rounded-sm p-3 space-y-3">
            <div className="grid gap-2">
              <Label>Stage Name</Label>
              <Input
                placeholder="e.g., Demo Scheduled"
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                className="h-8 border"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Outcome</Label>
              <Select
                value={newStage.category}
                onValueChange={(v: StageCategory) => setNewStage({ ...newStage, category: v })}
              >
                <SelectTrigger className="h-8 border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border">
                  {(Object.keys(CATEGORY_LABELS) as StageCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorSwatchPicker value={newStage.color} onChange={(c) => setNewStage({ ...newStage, color: c })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="border" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" className="border" onClick={handleAdd} disabled={!newStage.name.trim() || isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Add Stage
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="border w-full" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Stage
          </Button>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete stage "{deleteTarget?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Deals currently in this stage will be moved to the first remaining stage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
              >
                Delete Stage
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
