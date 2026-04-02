import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Feature Requests page - Redirects to unified Tickets page with feature filter
 * This maintains backward compatibility with existing routes while using the
 * enhanced unified ticket management system.
 */
export default function FeatureRequests() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  useEffect(() => {
    if (organization?.slug) {
      // Redirect to unified Tickets page with feature category filter
      navigate(`/org/${organization.slug}/tickets?category=feature`, { replace: true });
    }
  }, [organization, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to feature requests...</p>
    </div>
  );
}
