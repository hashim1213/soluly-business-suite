import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Emails() {
  const { organization } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/org/${organization?.slug}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Inbox</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Automatically sync, categorize, and manage incoming emails with AI-powered processing.
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-medium">
            Coming Soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
