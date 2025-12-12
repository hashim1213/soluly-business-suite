import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  logo_url: string | null;
  role_name: string;
  is_owner: boolean;
}

/**
 * Hook to fetch all organizations the current user belongs to
 * Useful for org switcher component
 */
export function useUserOrganizations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-organizations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("team_members")
        .select(`
          is_owner,
          role,
          organization:organizations(
            id,
            name,
            slug,
            icon,
            logo_url
          )
        `)
        .eq("auth_user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      return (data || [])
        .filter((item) => item.organization)
        .map((item) => ({
          id: item.organization!.id,
          name: item.organization!.name,
          slug: item.organization!.slug,
          icon: item.organization!.icon,
          logo_url: item.organization!.logo_url,
          role_name: item.role,
          is_owner: item.is_owner,
        })) as UserOrganization[];
    },
    enabled: !!user?.id,
  });
}
