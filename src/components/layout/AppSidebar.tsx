import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Mail,
  Lightbulb,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Contact,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Permissions } from "@/integrations/supabase/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  path: string; // relative path within org
  icon: React.ComponentType<{ className?: string }>;
  permission?: keyof Permissions;
};

const mainNavItems: NavItem[] = [
  { title: "Dashboard", path: "", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Projects", path: "projects", icon: FolderKanban, permission: "projects" },
  { title: "Tickets", path: "tickets", icon: Ticket, permission: "tickets" },
  { title: "Team Members", path: "team", icon: Users, permission: "team" },
  { title: "CRM", path: "crm", icon: Contact, permission: "crm" },
];

const ticketCategories: NavItem[] = [
  { title: "Feature Requests", path: "tickets/features", icon: Lightbulb, permission: "features" },
  { title: "Customer Quotes", path: "tickets/quotes", icon: FileText, permission: "quotes" },
  { title: "Feedback", path: "tickets/feedback", icon: MessageSquare, permission: "feedback" },
];

const systemItems: NavItem[] = [
  { title: "Email Inbox", path: "emails", icon: Mail, permission: "emails" },
  { title: "Settings", path: "settings", icon: Settings, permission: "settings" },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasPermission, organization } = useAuth();

  // Build the base URL for the organization
  const orgBase = organization?.slug ? `/org/${organization.slug}` : "";

  // Filter items based on permissions
  const filterByPermission = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission, "view");
    });
  };

  // Convert relative paths to full URLs
  const getFullUrl = (path: string) => `${orgBase}${path ? `/${path}` : ""}`;

  const visibleMainItems = filterByPermission(mainNavItems);
  const visibleTicketCategories = filterByPermission(ticketCategories);
  const visibleSystemItems = filterByPermission(systemItems);

  return (
    <Sidebar className="border-r-2 border-border">
      <SidebarHeader className="border-b-2 border-border p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-md overflow-hidden">
                {organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name || "Organization"}
                    className="h-full w-full object-cover"
                  />
                ) : organization?.icon ? (
                  <span className="text-lg">{organization.icon}</span>
                ) : (
                  <span className="text-primary-foreground font-bold text-sm">
                    {organization?.name?.[0]?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
              <span className="font-bold text-lg tracking-tight truncate max-w-[140px]">
                {organization?.name || "SOLULY"}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 bg-primary flex items-center justify-center mx-auto rounded-md overflow-hidden">
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name || "Organization"}
                  className="h-full w-full object-cover"
                />
              ) : organization?.icon ? (
                <span className="text-lg">{organization.icon}</span>
              ) : (
                <span className="text-primary-foreground font-bold text-sm">
                  {organization?.name?.[0]?.toUpperCase() || "S"}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {visibleMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              {!collapsed && "Main"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={getFullUrl(item.path)}
                        end={item.path === ""}
                        className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-border hover:bg-accent transition-all"
                        activeClassName="bg-primary text-primary-foreground border-border"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleTicketCategories.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              {!collapsed && "Ticket Categories"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleTicketCategories.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={getFullUrl(item.path)}
                        className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-border hover:bg-accent transition-all"
                        activeClassName="bg-primary text-primary-foreground border-border"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleSystemItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              {!collapsed && "System"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSystemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={getFullUrl(item.path)}
                        className="flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-border hover:bg-accent transition-all"
                        activeClassName="bg-primary text-primary-foreground border-border"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center border-2 border-transparent hover:border-border"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
