import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type Project = Tables<"projects">;
export type ProjectInsert = TablesInsert<"projects">;
export type ProjectUpdate = TablesUpdate<"projects">;

// Fetch all projects for the current organization (filtered by user's allowed projects)
export function useProjects() {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["projects", organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("projects")
        .select("*")
        .eq("organization_id", organization.id);

      // If user has project restrictions, filter by allowed projects
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        if (allowedProjectIds.length === 0) {
          return []; // No projects allowed
        }
        query = query.in("id", allowedProjectIds);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single project by ID (filtered by organization and access)
export function useProject(id: string | undefined) {
  const { organization, hasProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["projects", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      // Check if user has access to this project
      if (!hasProjectAccess(id)) {
        throw new Error("Access denied to this project");
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch project by display_id (e.g., PRJ-001) - filtered by organization
export function useProjectByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["projects", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Generate unique display ID within organization
async function generateUniqueProjectDisplayId(organizationId: string): Promise<string> {
  const { data } = await supabase
    .from("projects")
    .select("display_id")
    .eq("organization_id", organizationId)
    .like("display_id", "PRJ-%")
    .order("display_id", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    // Match patterns like PRJ-001 or PRJ-DEMO-001
    const match = data[0].display_id.match(/PRJ-(?:DEMO-)?(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `PRJ-${String(nextNum).padStart(3, "0")}`;
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (project: Omit<ProjectInsert, "display_id" | "organization_id"> & { display_id?: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      // Generate display_id if not provided
      if (!project.display_id) {
        project.display_id = await generateUniqueProjectDisplayId(organization.id);
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, organization_id: organization.id } as ProjectInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create project: " + error.message);
    },
  });
}

// Update project (filtered by organization)
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      if (!organization?.id) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
    },
    onError: (error) => {
      toast.error("Failed to update project: " + error.message);
    },
  });
}

// Delete project (filtered by organization)
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!organization?.id) throw new Error("No organization found");

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete project: " + error.message);
    },
  });
}

// Get ticket count for a project (filtered by organization)
export function useProjectTicketCount(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["projects", projectId, "ticket-count", organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return 0;
      const { count, error } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("organization_id", organization.id)
        .neq("status", "closed");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId && !!organization?.id,
  });
}
