import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
  DealGroup,
  useDealGroups,
  useCreateDealGroup,
  useUpdateDealGroup,
  useDeleteDealGroup,
} from "@/hooks/useDealGroups";

const SWATCHES = ["#3B82F6", "#22C55E", "#A855F7", "#EF4444", "#F59E0B", "#0D9488", "#DB2777", "#6B7280"];

export function DealGroupsSettings() {
  const { data: groups } = useDealGroups();
  const createGroup = useCreateDealGroup();
  const updateGroup = useUpdateDealGroup();
  const deleteGroup = useDeleteDealGroup();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DealGroup | null>(null);

  const isPending = createGroup.isPending || updateGroup.isPending || deleteGroup.isPending;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createGroup.mutateAsync({ name: newName.trim() });
    setNewName("");
  };

  const handleSaveEdit = async (group: DealGroup) => {
    if (!editName.trim()) return;
    await updateGroup.mutateAsync({ id: group.id, name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Deal Groups</CardTitle>
        <CardDescription>
          Named deals that group many customers, e.g. "First Farms" or "University". Deleting a group keeps its deals but ungroups them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {groups?.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No deal groups yet. Add one below or create one from the New Deal dialog in the CRM.</p>
        )}
        {groups?.map((group) => (
          <div key={group.id} className="flex items-center gap-2 border border-border rounded-sm px-2 py-1.5">
            {editingId === group.id ? (
              <>
                <div className="flex-1 space-y-2 min-w-0">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 border"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="h-5 w-5 rounded-sm border border-border"
                        style={{ backgroundColor: c, outline: editColor === c ? "2px solid hsl(var(--primary))" : undefined, outlineOffset: 1 }}
                        onClick={() => setEditColor(c)}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(group)} disabled={isPending}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Badge variant="outline" className="shrink-0 border" style={{ borderColor: group.color, color: group.color }}>
                  {group.name}
                </Badge>
                <span className="text-xs text-muted-foreground truncate flex-1">{group.description || ""}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingId(group.id);
                    setEditName(group.name);
                    setEditColor(group.color);
                  }}
                  disabled={isPending}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteTarget(group)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="New deal group…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-8 border"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || isPending} className="border shrink-0">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span className="ml-1">Add</span>
          </Button>
        </div>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete deal group "{deleteTarget?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Deals in this group are kept but will no longer be grouped.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTarget) {
                    deleteGroup.mutate(deleteTarget.id);
                    setDeleteTarget(null);
                  }
                }}
              >
                Delete Group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
