import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orgPath } from "@/lib/tenant";

/**
 * Feedback page - Redirects to unified Tickets page with feedback filter
 * This maintains backward compatibility with existing routes while using the
 * enhanced unified ticket management system.
 */
export default function Feedback() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  useEffect(() => {
    if (organization?.slug) {
      // Redirect to unified Tickets page with feedback category filter
      navigate(orgPath(organization.slug, "/tickets?category=feedback"), { replace: true });
    }
  }, [organization, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to feedback...</p>
    </div>
  );
}
