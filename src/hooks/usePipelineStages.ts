import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type PipelineStageRow = Tables<"crm_pipeline_stages">;
export type StageCategory = "open" | "won" | "lost";

export interface PipelineStage {
  key: string;
  name: string;
  color: string;
  stageCategory: StageCategory;
  winProgress: number;
  position: number;
  id?: string;
}

// Built-in stages, used until an organization customizes its pipeline.
// Keys match the original quote_status values so existing quotes slot in.
export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { key: "draft", name: "Lead", color: "#E2E8F0", stageCategory: "open", winProgress: 10, position: 0 },
  { key: "sent", name: "Proposal", color: "#3B82F6", stageCategory: "open", winProgress: 50, position: 1 },
  { key: "negotiating", name: "Negotiation", color: "#A855F7", stageCategory: "open", winProgress: 75, position: 2 },
  { key: "accepted", name: "Won", color: "#22C55E", stageCategory: "won", winProgress: 100, position: 3 },
  { key: "rejected", name: "Lost", color: "#EF4444", stageCategory: "lost", winProgress: 0, position: 4 },
];

function rowToStage(row: PipelineStageRow): PipelineStage {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    color: row.color,
    stageCategory: row.stage_category as StageCategory,
    winProgress: row.win_progress,
    position: row.position,
  };
}

// Fetch the organization's pipeline stages, falling back to the defaults
// when the org has not customized them.
export function usePipelineStages() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["pipeline-stages", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return DEFAULT_PIPELINE_STAGES;

      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("organization_id", organization.id)
        .order("position");

      if (error) throw error;
      if (!data || data.length === 0) return DEFAULT_PIPELINE_STAGES;
      return data.map(rowToStage);
    },
    enabled: !!organization?.id,
    placeholderData: DEFAULT_PIPELINE_STAGES,
  });
}

// Helpers for pages that classify quotes by stage outcome rather than by
// hardcoded status keys.
export function stageFor(stages: PipelineStage[] | undefined, key: string): PipelineStage | undefined {
  return (stages || DEFAULT_PIPELINE_STAGES).find((s) => s.key === key);
}

export function isWonStatus(stages: PipelineStage[] | undefined, key: string): boolean {
  return stageFor(stages, key)?.stageCategory === "won";
}

export function isLostStatus(stages: PipelineStage[] | undefined, key: string): boolean {
  return stageFor(stages, key)?.stageCategory === "lost";
}

export function isOpenStatus(stages: PipelineStage[] | undefined, key: string): boolean {
  const stage = stageFor(stages, key);
  return !stage || stage.stageCategory === "open";
}

// Readable text color for a stage's background chip
export function stageTextColor(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#000000";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#000000" : "#FFFFFF";
}

// Copies the defaults into the org's own rows so they can be edited.
export function useInitializePipelineStages() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .insert(
          DEFAULT_PIPELINE_STAGES.map((s) => ({
            organization_id: organization.id,
            key: s.key,
            name: s.name,
            color: s.color,
            stage_category: s.stageCategory,
            win_progress: s.winProgress,
            position: s.position,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
    },
    onError: (error) => {
      toast.error("Failed to enable custom stages: " + error.message);
    },
  });
}

export function useCreatePipelineStage() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: { name: string; color: string; stageCategory: StageCategory; winProgress: number; position: number }) => {
      if (!organization?.id) throw new Error("No organization found");

      const key = input.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (!key) throw new Error("Stage name is required");

      const { data, error } = await supabase
        .from("crm_pipeline_stages")
        .insert({
          organization_id: organization.id,
          key,
          name: input.name,
          color: input.color,
          stage_category: input.stageCategory,
          win_progress: input.winProgress,
          position: input.position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success("Stage added");
    },
    onError: (error) => {
      toast.error("Failed to add stage: " + error.message);
    },
  });
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; stage_category?: StageCategory; win_progress?: number; position?: number }) => {
      const { error } = await supabase
        .from("crm_pipeline_stages")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
    },
    onError: (error) => {
      toast.error("Failed to update stage: " + error.message);
    },
  });
}

// Deleting a stage moves its quotes to a fallback stage first so no deal
// disappears from the board.
export function useDeletePipelineStage() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, key, fallbackKey }: { id: string; key: string; fallbackKey: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error: moveError } = await supabase
        .from("quotes")
        .update({ status: fallbackKey })
        .eq("organization_id", organization.id)
        .eq("status", key);
      if (moveError) throw moveError;

      const { error } = await supabase.from("crm_pipeline_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Stage removed");
    },
    onError: (error) => {
      toast.error("Failed to remove stage: " + error.message);
    },
  });
}

export function useReorderPipelineStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stages: { id: string; position: number }[]) => {
      const updates = stages.map((s) =>
        supabase.from("crm_pipeline_stages").update({ position: s.position }).eq("id", s.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
    },
    onError: (error) => {
      toast.error("Failed to reorder stages: " + error.message);
    },
  });
}
