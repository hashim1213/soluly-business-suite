import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orgPath } from "@/lib/tenant";

export default function CustomerQuotes() {
  const { organization } = useAuth();

  if (organization?.slug) {
    return <Navigate to={orgPath(organization.slug, "/tickets?category=quote")} replace />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Redirecting to customer quotes...</p>
    </div>
  );
}
