import { Plus, FolderPlus, Ticket, Mail, Users, FileText, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

interface QuickAction {
  label: string;
  icon: typeof Plus;
  href: string;
  color: string;
}

const actions: QuickAction[] = [
  { label: "New Project", icon: FolderPlus, href: "/projects?new=true", color: "text-blue-600" },
  { label: "New Ticket", icon: Ticket, href: "/tickets?new=true", color: "text-red-600" },
  { label: "Sync Emails", icon: Mail, href: "/emails", color: "text-purple-600" },
  { label: "Add Contact", icon: Users, href: "/crm?tab=contacts&new=true", color: "text-green-600" },
  { label: "New Quote", icon: FileText, href: "/crm?tab=quotes&new=true", color: "text-orange-600" },
  { label: "Feature Request", icon: Lightbulb, href: "/feature-requests?new=true", color: "text-yellow-600" },
];

export function QuickActions() {
  const { navigateOrg } = useOrgNavigation();

  return (
    <Card className="border-2">
      <CardHeader className="border-b-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 border-2 hover:bg-accent"
              onClick={() => navigateOrg(action.href)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
