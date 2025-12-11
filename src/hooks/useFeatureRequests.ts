import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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

// Fetch all feature requests for the current organization
export function useFeatureRequests() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["feature_requests", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: features, error: featuresError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("organization_id", organization.id)
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
    enabled: !!organization?.id,
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

// Fetch by display_id (filtered by organization)
export function useFeatureRequestByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["feature_requests", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;

      const { data: feature, error: featureError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
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
    enabled: !!displayId && !!organization?.id,
  });
}

// Helper to generate unique display_id for feature requests within organization
async function generateUniqueFeatureDisplayId(organizationId: string): Promise<string> {
  const { data } = await supabase
    .from("feature_requests")
    .select("display_id")
    .eq("organization_id", organizationId)
    .like("display_id", "FTR-%")
    .order("display_id", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const match = data[0].display_id.match(/FTR-(?:DEMO-)?(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `FTR-${String(nextNum).padStart(3, "0")}`;
}

// Create feature request
export function useCreateFeatureRequest() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectIds,
      ...feature
    }: Omit<FeatureRequestInsert, "display_id" | "organization_id"> & {
      display_id?: string;
      projectIds: string[];
    }) => {
      if (!organization?.id) throw new Error("No organization found");

      if (!feature.display_id) {
        feature.display_id = await generateUniqueFeatureDisplayId(organization.id);
      }

      const { data: newFeature, error: featureError } = await supabase
        .from("feature_requests")
        .insert({ ...feature, organization_id: organization.id } as FeatureRequestInsert)
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
        await supabase
          .from("feature_request_projects")
          .delete()
          .eq("feature_request_id", id);

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
