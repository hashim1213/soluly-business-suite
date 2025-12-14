import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Types for forms
export type FormStatus = "draft" | "published" | "closed" | "archived";

export interface FormSettings {
  allow_anonymous?: boolean;
  allow_multiple?: boolean;
  show_progress?: boolean;
  thank_you_message?: string;
}

export interface Form {
  id: string;
  organization_id: string;
  display_id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  settings: FormSettings;
  published_at: string | null;
  closes_at: string | null;
  created_by: string | null;
  response_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormWithDetails extends Form {
  creator?: { name: string } | null;
  projects?: { id: string; name: string; display_id: string }[];
}

export interface FormInsert {
  title: string;
  description?: string | null;
  status?: FormStatus;
  settings?: FormSettings;
  closes_at?: string | null;
  project_ids?: string[]; // For linking to projects
}

export interface FormUpdate {
  title?: string;
  description?: string | null;
  status?: FormStatus;
  settings?: FormSettings;
  closes_at?: string | null;
}

// Fetch all forms for the organization
export function useForms() {
  const { organization, allowedProjectIds, hasFullProjectAccess } = useAuth();

  return useQuery({
    queryKey: ["forms", organization?.id, allowedProjectIds],
    queryFn: async () => {
      if (!organization?.id) return [];

      // If user has project restrictions, we need to check form_projects
      if (!hasFullProjectAccess() && allowedProjectIds !== null) {
        if (allowedProjectIds.length === 0) {
          return [];
        }

        // Get forms that are linked to allowed projects OR forms not linked to any project
        const { data: linkedFormIds } = await supabase
          .from("form_projects")
          .select("form_id")
          .in("project_id", allowedProjectIds);

        const formIds = linkedFormIds?.map(fp => fp.form_id) || [];

        // Get forms that have no project links (global forms) or are in allowed projects
        const { data, error } = await supabase
          .from("forms")
          .select(`
            *,
            creator:team_members!forms_created_by_fkey(name)
          `)
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter to forms that either have no projects or are linked to allowed projects
        const formsWithProjects = await Promise.all(
          (data || []).map(async (form) => {
            const { data: projects } = await supabase
              .from("form_projects")
              .select("project_id, projects(id, name, display_id)")
              .eq("form_id", form.id);

            const projectList = projects?.map(p => p.projects).filter(Boolean) || [];
            return { ...form, projects: projectList };
          })
        );

        // Filter: include if no projects OR at least one project is in allowedProjectIds
        return formsWithProjects.filter(form => {
          if (form.projects.length === 0) return true;
          return form.projects.some(p => allowedProjectIds.includes(p.id));
        }) as FormWithDetails[];
      }

      // Full access - get all forms
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          creator:team_members!forms_created_by_fkey(name)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Add projects to each form
      const formsWithProjects = await Promise.all(
        (data || []).map(async (form) => {
          const { data: projects } = await supabase
            .from("form_projects")
            .select("project_id, projects(id, name, display_id)")
            .eq("form_id", form.id);

          const projectList = projects?.map(p => p.projects).filter(Boolean) || [];
          return { ...form, projects: projectList };
        })
      );

      return formsWithProjects as FormWithDetails[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single form by ID
export function useForm(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["forms", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          creator:team_members!forms_created_by_fkey(name)
        `)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;

      // Get linked projects
      const { data: projects } = await supabase
        .from("form_projects")
        .select("project_id, projects(id, name, display_id)")
        .eq("form_id", id);

      const projectList = projects?.map(p => p.projects).filter(Boolean) || [];

      return { ...data, projects: projectList } as FormWithDetails;
    },
    enabled: !!id && !!organization?.id,
  });
}

// Fetch form by display_id
export function useFormByDisplayId(displayId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["forms", "display", displayId, organization?.id],
    queryFn: async () => {
      if (!displayId || !organization?.id) return null;

      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          creator:team_members!forms_created_by_fkey(name)
        `)
        .eq("display_id", displayId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;

      // Get linked projects
      const { data: projects } = await supabase
        .from("form_projects")
        .select("project_id, projects(id, name, display_id)")
        .eq("form_id", data.id);

      const projectList = projects?.map(p => p.projects).filter(Boolean) || [];

      return { ...data, projects: projectList } as FormWithDetails;
    },
    enabled: !!displayId && !!organization?.id,
  });
}

// Helper to generate unique display_id
async function generateFormDisplayId(organizationId: string): Promise<string> {
  const { data } = await supabase
    .from("forms")
    .select("display_id")
    .eq("organization_id", organizationId)
    .like("display_id", "FRM-%")
    .order("display_id", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const match = data[0].display_id.match(/FRM-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `FRM-${String(nextNum).padStart(3, "0")}`;
}

// Create a new form
export function useCreateForm() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async (input: FormInsert) => {
      if (!organization?.id) throw new Error("No organization found");

      const displayId = await generateFormDisplayId(organization.id);

      const { data, error } = await supabase
        .from("forms")
        .insert({
          organization_id: organization.id,
          display_id: displayId,
          title: input.title,
          description: input.description || null,
          status: input.status || "draft",
          settings: input.settings || {
            allow_anonymous: true,
            allow_multiple: false,
            show_progress: true,
            thank_you_message: "Thank you for your response!",
          },
          closes_at: input.closes_at || null,
          created_by: member?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Link to projects if provided
      if (input.project_ids && input.project_ids.length > 0) {
        const { error: projectError } = await supabase
          .from("form_projects")
          .insert(
            input.project_ids.map(projectId => ({
              form_id: data.id,
              project_id: projectId,
            }))
          );

        if (projectError) {
          console.error("Error linking form to projects:", projectError);
        }
      }

      return data as Form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create form: ${error.message}`);
    },
  });
}

// Update a form
export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FormUpdate }) => {
      const { data, error } = await supabase
        .from("forms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Form;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", data.id] });
      toast.success("Form updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update form: ${error.message}`);
    },
  });
}

// Delete a form
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete form: ${error.message}`);
    },
  });
}

// Publish a form
export function usePublishForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("forms")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Form;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", data.id] });
      toast.success("Form published successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish form: ${error.message}`);
    },
  });
}

// Unpublish (close) a form
export function useUnpublishForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("forms")
        .update({ status: "closed" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Form;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["forms", data.id] });
      toast.success("Form closed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to close form: ${error.message}`);
    },
  });
}

// Update form project associations
export function useUpdateFormProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, projectIds }: { formId: string; projectIds: string[] }) => {
      // Remove existing project links
      const { error: deleteError } = await supabase
        .from("form_projects")
        .delete()
        .eq("form_id", formId);

      if (deleteError) throw deleteError;

      // Add new project links
      if (projectIds.length > 0) {
        const { error: insertError } = await supabase
          .from("form_projects")
          .insert(
            projectIds.map(projectId => ({
              form_id: formId,
              project_id: projectId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update form projects: ${error.message}`);
    },
  });
}
