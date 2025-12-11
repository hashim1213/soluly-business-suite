import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Contact } from "./useContacts";

export interface ProjectExternalMember {
  id: string;
  organization_id: string;
  project_id: string;
  contact_id: string;
  role: string | null;
  created_at: string;
  // Joined contact data
  contact?: Contact;
}

export interface AddProjectExternalMemberInput {
  project_id: string;
  contact_id: string;
  role?: string;
}

export interface UpdateProjectExternalMemberInput {
  id: string;
  role?: string;
}

/**
 * Hook to fetch all external members for a project with their contact info
 */
export function useProjectExternalMembers(projectId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["project_external_members", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("project_external_members")
        .select(`
          *,
          contact:contacts!contact_id(
            id,
            organization_id,
            display_id,
            name,
            email,
            phone,
            job_title,
            company_id,
            notes,
            created_at,
            updated_at,
            company:crm_clients!company_id(id, name)
          )
        `)
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectExternalMember[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

/**
 * Hook to add an existing contact as an external member to a project
 */
export function useAddProjectExternalMember() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: AddProjectExternalMemberInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("project_external_members")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          contact_id: input.contact_id,
          role: input.role || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project_external_members", organization?.id, variables.project_id] });
      toast.success("External team member added");
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.error("This contact is already on the project team");
      } else {
        toast.error(`Failed to add external member: ${error.message}`);
      }
    },
  });
}

/**
 * Hook to update an external member's role
 */
export function useUpdateProjectExternalMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectExternalMemberInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("project_external_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_external_members"] });
      toast.success("External member updated");
    },
    onError: (error) => {
      toast.error(`Failed to update external member: ${error.message}`);
    },
  });
}

/**
 * Hook to remove an external member from a project
 */
export function useRemoveProjectExternalMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_external_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_external_members"] });
      toast.success("External team member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove external member: ${error.message}`);
    },
  });
}

/**
 * Hook to add a new contact and immediately add them as an external member
 * This is used when the contact doesn't exist yet
 */
export function useCreateContactAndAddToProject() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      name: string;
      email?: string;
      phone?: string;
      job_title?: string;
      company_id?: string;
      role?: string;
    }) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Generate display_id for the new contact
      const { data: existingContacts } = await supabase
        .from("contacts")
        .select("display_id")
        .eq("organization_id", organization.id)
        .order("display_id", { ascending: false })
        .limit(1);

      let displayId = "CON-001";
      if (existingContacts && existingContacts.length > 0) {
        const match = existingContacts[0].display_id.match(/CON-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          displayId = `CON-${nextNum.toString().padStart(3, "0")}`;
        }
      }

      // Create the contact
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          organization_id: organization.id,
          display_id: displayId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          job_title: input.job_title || null,
          company_id: input.company_id || null,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Add them as an external member to the project
      const { data: member, error: memberError } = await supabase
        .from("project_external_members")
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          contact_id: contact.id,
          role: input.role || null,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      return { contact, member };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["project_external_members", organization?.id, variables.project_id] });
      toast.success("Contact created and added to project");
    },
    onError: (error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });
}
