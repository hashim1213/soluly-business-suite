import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Organization = Tables<"organizations">;
export type OrganizationUpdate = TablesUpdate<"organizations">;

// Fetch current organization details
export function useCurrentOrganization() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["organizations", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organization.id)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!organization?.id,
  });
}

// Update organization
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { organization, refreshUserData } = useAuth();

  return useMutation({
    mutationFn: async (updates: OrganizationUpdate) => {
      if (!organization?.id) throw new Error("No organization found");

      // If updating slug, validate it
      if (updates.slug) {
        const slug = updates.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

        // Check if slug is already taken
        const { data: existing } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .neq("id", organization.id)
          .single();

        if (existing) {
          throw new Error("This organization URL is already taken");
        }

        updates.slug = slug;
      }

      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organization.id)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refreshUserData();
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Get organization stats
export function useOrganizationStats() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["organizations", organization?.id, "stats"],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Get member count
      const { count: memberCount } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "active");

      // Get project count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      // Get pending invitations count
      const { count: pendingInvitations } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      return {
        memberCount: memberCount || 0,
        projectCount: projectCount || 0,
        pendingInvitations: pendingInvitations || 0,
      };
    },
    enabled: !!organization?.id,
  });
}

// Check if slug is available
export function useCheckSlugAvailability() {
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (slug: string) => {
      const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", normalizedSlug)
        .neq("id", organization?.id || "")
        .single();

      return {
        slug: normalizedSlug,
        available: !existing,
      };
    },
  });
}
