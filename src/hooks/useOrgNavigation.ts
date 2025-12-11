import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to get organization-aware navigation helpers
 * All internal app navigation should use these to ensure proper /org/{slug}/ prefix
 */
export function useOrgNavigation() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  /**
   * Get the full path with org prefix
   * @param path - Path without org prefix (e.g., "/projects" or "/tickets/TKT-001")
   */
  const getOrgPath = useCallback(
    (path: string) => {
      if (!organization?.slug) {
        // Return the path as-is if no org is available (fallback)
        return path;
      }
      // Remove leading slash if present for consistent handling
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return `/org/${organization.slug}/${cleanPath}`;
    },
    [organization?.slug]
  );

  /**
   * Navigate to an org-prefixed path
   * @param path - Path without org prefix (e.g., "/projects" or "/tickets/TKT-001")
   * @param options - Navigation options
   */
  const navigateOrg = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      const fullPath = getOrgPath(path);
      navigate(fullPath, options);
    },
    [navigate, getOrgPath]
  );

  return {
    /** Get the full path with org prefix */
    getOrgPath,
    /** Navigate to an org-prefixed path */
    navigateOrg,
    /** The organization slug */
    orgSlug: organization?.slug,
  };
}
