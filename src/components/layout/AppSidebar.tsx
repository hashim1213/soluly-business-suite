import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Mail,
  Lightbulb,
  FileText,
  MessageSquare,
  Settings,
  Users,
  Contact,
  DollarSign,
  Receipt,
  ClipboardList,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Permissions } from "@/integrations/supabase/types";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  title: string;
  path: string; // relative path within org
  icon: React.ComponentType<{ className?: string }>;
  permission?: keyof Permissions;
};

const mainNavItems: NavItem[] = [
  { title: "Dashboard", path: "", icon: LayoutDashboard, permission: "dashboard" },
  { title: "My Hours", path: "my-hours", icon: Clock },
  { title: "Projects", path: "projects", icon: FolderKanban, permission: "projects" },
  { title: "Tickets", path: "tickets", icon: Ticket, permission: "tickets" },
  { title: "Forms", path: "forms", icon: ClipboardList, permission: "forms" },
  { title: "Team Members", path: "team", icon: Users, permission: "team" },
  { title: "CRM", path: "crm", icon: Contact, permission: "crm" },
  { title: "Financials", path: "financials", icon: DollarSign, permission: "financials" },
  { title: "Expenses", path: "expenses", icon: Receipt, permission: "expenses" },
  { title: "Projections", path: "projections", icon: TrendingUp, permission: "financials" },
];

const ticketCategories: NavItem[] = [
  { title: "Feature Requests", path: "tickets/features", icon: Lightbulb, permission: "features" },
  { title: "Customer Quotes", path: "tickets/quotes", icon: FileText, permission: "quotes" },
  { title: "Feedback", path: "tickets/feedback", icon: MessageSquare, permission: "feedback" },
  { title: "Issues", path: "tickets/issues", icon: AlertCircle, permission: "issues" },
];

const systemItems: NavItem[] = [
  { title: "Email Inbox", path: "emails", icon: Mail, permission: "emails" },
  { title: "Reports", path: "reports", icon: BarChart3, permission: "crm" },
  { title: "Audit Log", path: "audit-log", icon: Shield, permission: "settings" },
  { title: "Settings", path: "settings", icon: Settings, permission: "settings" },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasPermission, organization, member } = useAuth();

  // Build the base URL for the organization
  const orgBase = organization?.slug ? `/org/${organization.slug}` : "";

  // Filter items based on permissions and member status
  const filterByPermission = (items: NavItem[]) => {
    return items.filter((item) => {
      // My Hours only shows if user has a team member record
      if (item.path === "my-hours") {
        return !!member;
      }
      if (!item.permission) return true;
      return hasPermission(item.permission, "view");
    });
  };

  // Convert relative paths to full URLs
  const getFullUrl = (path: string) => `${orgBase}${path ? `/${path}` : ""}`;

  const visibleMainItems = filterByPermission(mainNavItems);
  const visibleTicketCategories = filterByPermission(ticketCategories);
  const visibleSystemItems = filterByPermission(systemItems);

  const renderNavItem = (item: NavItem) => {
    const content = (
      <NavLink
        to={getFullUrl(item.path)}
        end={item.path === ""}
        className={`flex items-center border-2 border-transparent hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all ${
          collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
        }`}
        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="font-medium">{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.title}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="border-2">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-sidebar-border">
      <SidebarHeader className="h-14 border-b-2 border-sidebar-border px-2 flex items-center">
        <OrgSwitcher collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent className="p-2">
        {visibleMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/60 px-2 mb-2">
              {!collapsed && "Main"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderNavItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleTicketCategories.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/60 px-2 mb-2">
              {!collapsed && "Ticket Categories"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleTicketCategories.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderNavItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleSystemItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/60 px-2 mb-2">
              {!collapsed && "System"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSystemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderNavItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-sidebar-border p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`w-full border-2 border-transparent hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                collapsed ? "justify-center p-2" : "justify-start gap-3 px-3"
              }`}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span className="font-medium">Collapse</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="border-2">
              Expand sidebar
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
