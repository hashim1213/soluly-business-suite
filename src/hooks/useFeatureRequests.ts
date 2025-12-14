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

// Fetch all feature requests for the current organization (filtered by project access)
export function useFeatureRequests() {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feature_requests", organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: features, error: featuresError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (featuresError) throw featuresError;

      let featureProjectsQuery = supabase
        .from("feature_request_projects")
        .select(`
          feature_request_id,
          project_id,
          project:projects(id, name, display_id)
        `);

      // If user has project restrictions, filter by allowed projects
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        if (allowedProjectIds.length === 0) {
          return []; // No projects allowed = no feature requests
        }
        featureProjectsQuery = featureProjectsQuery.in("project_id", allowedProjectIds);
      }

      const { data: featureProjects, error: projectsError } = await featureProjectsQuery;

      if (projectsError) throw projectsError;

      // Group projects by feature request
      const projectsByFeature = new Map<string, typeof featureProjects>();
      featureProjects?.forEach((fp) => {
        const existing = projectsByFeature.get(fp.feature_request_id) || [];
        existing.push(fp);
        projectsByFeature.set(fp.feature_request_id, existing);
      });

      // Filter features - only include those that have at least one allowed project (if restricted)
      let filteredFeatures = features || [];
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        const featureIdsWithAllowedProjects = new Set(featureProjects?.map((fp) => fp.feature_request_id) || []);
        filteredFeatures = filteredFeatures.filter((f) => featureIdsWithAllowedProjects.has(f.id));
      }

      return filteredFeatures.map((feature) => ({
        ...feature,
        projects: projectsByFeature.get(feature.id) || [],
      })) as FeatureRequestWithProjects[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single feature request (filtered by organization and project access)
export function useFeatureRequest(id: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feature_requests", id, organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data: feature, error: featureError } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
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

      // Check project access - if user has restricted access, verify they can access at least one project
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        const featureProjectIds = featureProjects?.map(fp => fp.project_id) || [];
        const hasAccess = featureProjectIds.some(pid => allowedProjectIds.includes(pid));
        if (!hasAccess && featureProjectIds.length > 0) {
          // User doesn't have access to any of this feature's projects
          return null;
        }
      }

      return {
        ...feature,
        projects: featureProjects || [],
      } as FeatureRequestWithProjects;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch by display_id (filtered by organization and project access)
export function useFeatureRequestByDisplayId(displayId: string | undefined) {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["feature_requests", "display", displayId, organization?.id, allowedProjectIds],
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

      // Check project access - if user has restricted access, verify they can access at least one project
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        const featureProjectIds = featureProjects?.map(fp => fp.project_id) || [];
        const hasAccess = featureProjectIds.some(pid => allowedProjectIds.includes(pid));
        if (!hasAccess && featureProjectIds.length > 0) {
          // User doesn't have access to any of this feature's projects
          return null;
        }
      }

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
  const { organization, member } = useAuth();

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

      return {
        feature: newFeature as FeatureRequest,
        projectIds, // Pass the project IDs for notification filtering
      };
    },
    onSuccess: async ({ feature, projectIds }) => {
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      toast.success("Feature request created successfully");

      // Send notification for new feature request (filtered by project access)
      if (projectIds.length > 0) {
        try {
          await supabase.functions.invoke("create-notification", {
            body: {
              organizationId: feature.organization_id,
              projectIds, // Only notify users with access to these projects
              type: "feature_request",
              title: "New Feature Request",
              message: `${member?.name || "Someone"} created feature request ${feature.display_id}: "${feature.title}"`,
              entityType: "feature_request",
              entityId: feature.id,
              entityDisplayId: feature.display_id,
              actorId: member?.id,
              excludeActorFromNotification: true,
            },
          });
        } catch (error) {
          console.error("Failed to send feature request notification:", error);
        }
      }
    },
    onError: (error) => {
      toast.error("Failed to create feature request: " + error.message);
    },
  });
}

// Update feature request (filtered by organization)
export function useUpdateFeatureRequest() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      projectIds,
      ...updates
    }: FeatureRequestUpdate & { id: string; projectIds?: string[] }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("feature_requests")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
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

// Delete feature request (filtered by organization)
export function useDeleteFeatureRequest() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("feature_requests")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

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
