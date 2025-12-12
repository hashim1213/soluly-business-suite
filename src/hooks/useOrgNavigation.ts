import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to get organization-aware navigation helpers
 * All internal app navigation should use these to ensure proper /org/{slug}/ prefix
 */
export function useOrgNavigation() {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { organization } = useAuth();

  // Use URL slug if available (for consistency), fallback to auth org
  const orgSlug = urlSlug || organization?.slug;

  /**
   * Get the full path with org prefix
   * @param path - Path without org prefix (e.g., "/projects" or "/tickets/TKT-001")
   */
  const getOrgPath = useCallback(
    (path: string = "") => {
      if (!orgSlug) {
        // Return the path as-is if no org is available (fallback)
        return path || "/";
      }
      // Remove leading slash if present for consistent handling
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      if (!cleanPath) {
        return `/org/${orgSlug}`;
      }
      return `/org/${orgSlug}/${cleanPath}`;
    },
    [orgSlug]
  );

  /**
   * Navigate to an org-prefixed path
   * @param path - Path without org prefix (e.g., "/projects" or "/tickets/TKT-001")
   * @param options - Navigation options
   */
  const navigateOrg = useCallback(
    (path: string = "", options?: { replace?: boolean }) => {
      const fullPath = getOrgPath(path);
      navigate(fullPath, options);
    },
    [navigate, getOrgPath]
  );

  /**
   * Build common paths with org prefix
   */
  const paths = {
    dashboard: getOrgPath(""),
    projects: getOrgPath("projects"),
    project: (id: string) => getOrgPath(`projects/${id}`),
    tickets: getOrgPath("tickets"),
    ticket: (id: string) => getOrgPath(`tickets/${id}`),
    team: getOrgPath("team"),
    teamMember: (id: string) => getOrgPath(`team/${id}`),
    crm: getOrgPath("crm"),
    features: getOrgPath("tickets/features"),
    feature: (id: string) => getOrgPath(`features/${id}`),
    quotes: getOrgPath("tickets/quotes"),
    quote: (id: string) => getOrgPath(`quotes/${id}`),
    feedback: getOrgPath("tickets/feedback"),
    feedbackItem: (id: string) => getOrgPath(`feedback/${id}`),
    emails: getOrgPath("emails"),
    financials: getOrgPath("financials"),
    expenses: getOrgPath("expenses"),
    settings: getOrgPath("settings"),
  };

  return {
    /** Get the full path with org prefix */
    getOrgPath,
    /** Navigate to an org-prefixed path */
    navigateOrg,
    /** The organization slug */
    orgSlug,
    /** The organization object */
    organization,
    /** Pre-built common paths */
    paths,
  };
}

/**
 * Hook to get org slug from URL or context
 * Useful for components that need the slug but don't need full navigation
 */
export function useOrgSlug(): string | undefined {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { organization } = useAuth();
  return urlSlug || organization?.slug;
}
