import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orgPath } from "@/lib/tenant";

/**
 * Issues page - Redirects to unified Tickets page with issue filter
 * This maintains backward compatibility with existing routes while using the
 * enhanced unified ticket management system.
 */
export default function Issues() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  useEffect(() => {
    if (organization?.slug) {
      // Redirect to unified Tickets page with issue category filter
      navigate(orgPath(organization.slug, "/tickets?category=issue"), { replace: true });
    }
  }, [organization, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to issues...</p>
    </div>
  );
}
