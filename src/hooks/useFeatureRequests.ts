import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type FeatureRequest = Tables<"feature_requests">;
export type FeatureRequestInsert = TablesInsert<"feature_requests">;
export type FeatureRequestUpdate = TablesUpdate<"feature_requests">;

// Feature request with project associations
export type FeatureRequestWithProjects = FeatureRequest & {
  projects: Array<{
    project_id: string;
    project: { id: string; name: string; display_id: string } | null;
  }>;
};

// Fetch all feature requests
export function useFeatureRequests() {
  return useQuery({
    queryKey: ["feature_requests"],
    queryFn: async () => {
      const { data: features, error: featuresError } = await supabase
        .from("feature_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (featuresError) throw featuresError;

      const { data: featureProjects, error: projectsError } = await supabase
        .from("feature_request_projects")
        .select(`
          feature_request_id,
          project_id,
          project:projects(id, name, display_id)
        `);

      if (projectsError) throw projectsError;

      // Group projects by feature request
      const projectsByFeature = new Map<string, typeof featureProjects>();
      featureProjects?.forEach((fp) => {
        const existing = projectsByFeature.get(fp.feature_request_id) || [];
        existing.push(fp);
        projectsByFeature.set(fp.feature_request_id, existing);
      });

      return (features || []).map((feature) => ({
        ...feature,
        projects: projectsByFeature.get(feature.id) || [],
      })) as FeatureRequestWithProjects[];
    },
  });
}

// Fetch single feature request
export function useFeatureRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["feature_requests", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: feature, error: featureError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (featureError) throw featureError;

      const { data: featureProjects, error: projectsError } = await supabase
        .from("feature_request_projects")
        .select(`
          project_id,
          project:projects(id, name, display_id)
        `)
        .eq("feature_request_id", id);

      if (projectsError) throw projectsError;

      return {
        ...feature,
        projects: featureProjects || [],
      } as FeatureRequestWithProjects;
    },
    enabled: !!id,
  });
}

// Fetch by display_id
export function useFeatureRequestByDisplayId(displayId: string | undefined) {
  return useQuery({
    queryKey: ["feature_requests", "display", displayId],
    queryFn: async () => {
      if (!displayId) return null;

      const { data: feature, error: featureError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("display_id", displayId)
        .single();

      if (featureError) throw featureError;

      const { data: featureProjects } = await supabase
        .from("feature_request_projects")
        .select(`
          project_id,
          project:projects(id, name, display_id)
        `)
        .eq("feature_request_id", feature.id);

      return {
        ...feature,
        projects: featureProjects || [],
      } as FeatureRequestWithProjects;
    },
    enabled: !!displayId,
  });
}

// Create feature request
export function useCreateFeatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectIds,
      ...feature
    }: Omit<FeatureRequestInsert, "display_id"> & {
      display_id?: string;
      projectIds: string[];
    }) => {
      if (!feature.display_id) {
        const { count } = await supabase
          .from("feature_requests")
          .select("*", { count: "exact", head: true });
        feature.display_id = `FTR-${String((count || 0) + 1).padStart(3, "0")}`;
      }

      const { data: newFeature, error: featureError } = await supabase
        .from("feature_requests")
        .insert(feature as FeatureRequestInsert)
        .select()
        .single();

      if (featureError) throw featureError;

      // Add project associations
      if (projectIds.length > 0) {
        const { error: projectsError } = await supabase
          .from("feature_request_projects")
          .insert(
            projectIds.map((projectId) => ({
              feature_request_id: newFeature.id,
              project_id: projectId,
            }))
          );

        if (projectsError) throw projectsError;
      }

      return newFeature as FeatureRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      toast.success("Feature request created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create feature request: " + error.message);
    },
  });
}

// Update feature request
export function useUpdateFeatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectIds,
      ...updates
    }: FeatureRequestUpdate & { id: string; projectIds?: string[] }) => {
      const { data, error } = await supabase
        .from("feature_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update project associations if provided
      if (projectIds !== undefined) {
        // Remove existing associations
        await supabase
          .from("feature_request_projects")
          .delete()
          .eq("feature_request_id", id);

        // Add new associations
        if (projectIds.length > 0) {
          await supabase.from("feature_request_projects").insert(
            projectIds.map((projectId) => ({
              feature_request_id: id,
              project_id: projectId,
            }))
          );
        }
      }

      return data as FeatureRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature_requests", data.id] });
      toast.success("Feature request updated");
    },
    onError: (error) => {
      toast.error("Failed to update feature request: " + error.message);
    },
  });
}

// Delete feature request
export function useDeleteFeatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      toast.success("Feature request deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete feature request: " + error.message);
    },
  });
}
