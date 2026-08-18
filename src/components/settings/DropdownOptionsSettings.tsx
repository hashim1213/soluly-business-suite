import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DROPDOWN_REGISTRY,
  DropdownType,
  DropdownOption,
  useDropdownOptions,
  useInitializeDropdownOptions,
  useCreateDropdownOption,
  useUpdateDropdownOption,
  useDeleteDropdownOption,
} from "@/hooks/useDropdownOptions";
import { stageTextColor } from "@/hooks/usePipelineStages";

const SWATCHES = ["#6B7280", "#DC2626", "#F59E0B", "#059669", "#2563EB", "#9333EA", "#DB2777", "#0D9488"];

function ColorSwatchPicker({ value, onChange }: { value: string | null; onChange: (color: string) => void }) {
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

function OptionsEditor({ type }: { type: DropdownType }) {
  const registry = DROPDOWN_REGISTRY[type];
  const { data: options } = useDropdownOptions(type);
  const initialize = useInitializeDropdownOptions();
  const createOption = useCreateDropdownOption();
  const updateOption = useUpdateDropdownOption();
  const deleteOption = useDeleteDropdownOption();

  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DropdownOption | null>(null);

  // Options without ids are the built-in defaults; the org hasn't
  // customized this list yet.
  const isCustomized = !!options?.[0]?.id;
  const isPending = initialize.isPending || createOption.isPending || updateOption.isPending || deleteOption.isPending;

  const ensureCustomized = async () => {
    if (!isCustomized) {
      await initialize.mutateAsync(type);
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await ensureCustomized();
    await createOption.mutateAsync({
      type,
      label: newLabel.trim(),
      position: options?.length || 0,
    });
    setNewLabel("");
  };

  const startEdit = (opt: DropdownOption) => {
    setEditingId(opt.id || opt.value);
    setEditLabel(opt.label);
    setEditColor(opt.color);
  };

  const handleSaveEdit = async (opt: DropdownOption) => {
    if (!editLabel.trim()) return;
    if (!isCustomized) {
      const rows = await initialize.mutateAsync(type);
      const row = rows?.find((r) => r.value === opt.value);
      if (!row) return;
      await updateOption.mutateAsync({ id: row.id, type, label: editLabel.trim(), color: editColor });
    } else if (opt.id) {
      await updateOption.mutateAsync({ id: opt.id, type, label: editLabel.trim(), color: editColor });
    }
    setEditingId(null);
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    if (!options) return;
    const target = index + dir;
    if (target < 0 || target >= options.length) return;
    let list = options;
    if (!isCustomized) {
      const rows = await initialize.mutateAsync(type);
      list = (rows || [])
        .map((r) => ({ id: r.id, value: r.value, label: r.label, color: r.color, position: r.position }))
        .sort((a, b) => a.position - b.position);
    }
    const a = list[index];
    const b = list[target];
    if (!a?.id || !b?.id) return;
    await Promise.all([
      updateOption.mutateAsync({ id: a.id, type, position: b.position }),
      updateOption.mutateAsync({ id: b.id, type, position: a.position }),
    ]);
  };

  const handleDelete = async (opt: DropdownOption) => {
    if (!isCustomized) {
      const rows = await initialize.mutateAsync(type);
      const row = rows?.find((r) => r.value === opt.value);
      if (row) await deleteOption.mutateAsync({ id: row.id, type });
    } else if (opt.id) {
      await deleteOption.mutateAsync({ id: opt.id, type });
    }
    setDeleteTarget(null);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">{registry.title}</CardTitle>
            <CardDescription>{registry.description}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">{registry.module}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {options?.map((opt, index) => (
          <div key={opt.id || opt.value} className="flex items-center gap-2 border border-border rounded-sm px-2 py-1.5">
            {editingId === (opt.id || opt.value) ? (
              <>
                <div className="flex-1 space-y-2 min-w-0">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="h-7 border"
                    autoFocus
                  />
                  <ColorSwatchPicker value={editColor} onChange={setEditColor} />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(opt)} disabled={isPending}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Badge
                  className="shrink-0"
                  style={{
                    backgroundColor: opt.color || "#6B7280",
                    color: stageTextColor(opt.color || "#6B7280"),
                  }}
                >
                  {opt.label}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground truncate flex-1">{opt.value}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, -1)} disabled={index === 0 || isPending}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 1)} disabled={index === (options?.length || 0) - 1 || isPending}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(opt)} disabled={isPending}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteTarget(opt)}
                  disabled={isPending || (options?.length || 0) <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="New option…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-8 border"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim() || isPending} className="border shrink-0">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span className="ml-1">Add</span>
          </Button>
        </div>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="border">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove "{deleteTarget?.label}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Existing records keeping this value will still show it, but it will no longer be offered in dropdowns.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export function DropdownOptionsSettings() {
  const types = Object.keys(DROPDOWN_REGISTRY) as DropdownType[];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {types.map((type) => (
        <OptionsEditor key={type} type={type} />
      ))}
    </div>
  );
}
