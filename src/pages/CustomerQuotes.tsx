import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Customer Quotes page - Redirects to unified Tickets page with quote filter
 * This maintains backward compatibility with existing routes while using the
 * enhanced unified ticket management system.
 */
export default function CustomerQuotes() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  useEffect(() => {
    if (organization?.slug) {
      // Redirect to unified Tickets page with quote category filter
      navigate(`/org/${organization.slug}/tickets?category=quote`, { replace: true });
    }
  }, [organization, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to customer quotes...</p>
    </div>
  );
}
