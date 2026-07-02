import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Settings, Building2, ChevronDown, Bell, Check, MessageSquare, Ticket, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const routeTitles: Record<string, string> = {
  '': 'Dashboard',
  'projects': 'Projects',
  'tickets': 'Tickets',
  'team': 'Team',
  'my-hours': 'My Hours',
  'crm': 'CRM',
  'reports': 'Reports',
  'emails': 'Email Inbox',
  'financials': 'Financials',
  'expenses': 'Business Expenses',
  'projections': 'Projections & Goals',
  'forms': 'Forms',
  'settings': 'Settings',
  'audit-log': 'Audit Log',
  'tickets/features': 'Feature Requests',
  'tickets/quotes': 'Quotes',
  'tickets/feedback': 'Feedback',
  'tickets/issues': 'Issues',
};

type Crumb = { label: string; path?: string };

// Detail routes map to the section they live under so the
// breadcrumb can offer a one-click way back up the hierarchy.
const detailParents: Record<string, { label: string; path: string }> = {
  projects: { label: 'Projects', path: 'projects' },
  tickets: { label: 'Tickets', path: 'tickets' },
  team: { label: 'Team', path: 'team' },
  contacts: { label: 'CRM', path: 'crm' },
  clients: { label: 'CRM', path: 'crm' },
  features: { label: 'Tickets', path: 'tickets' },
  quotes: { label: 'Tickets', path: 'tickets' },
  feedback: { label: 'Tickets', path: 'tickets' },
};

const detailTitles: Record<string, string> = {
  projects: 'Project Details',
  tickets: 'Ticket Details',
  team: 'Team Member',
  contacts: 'Contact Details',
  clients: 'Client Details',
  features: 'Feature Request',
  quotes: 'Quote Details',
  feedback: 'Feedback Details',
};

function useBreadcrumbs(): Crumb[] {
  const location = useLocation();
  const pathWithoutOrg = location.pathname.replace(/^\/org\/[^/]+\/?/, '');
  const segments = pathWithoutOrg.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard' }];
  }

  if (routeTitles[pathWithoutOrg]) {
    // Ticket sub-pages like tickets/features keep Tickets as parent
    if (segments.length > 1 && routeTitles[segments[0]]) {
      return [
        { label: routeTitles[segments[0]], path: segments[0] },
        { label: routeTitles[pathWithoutOrg] },
      ];
    }
    return [{ label: routeTitles[pathWithoutOrg] }];
  }

  if (segments.length >= 2) {
    const baseRoute = segments[0];
    if (baseRoute === 'forms') {
      const crumbs: Crumb[] = [{ label: 'Forms', path: 'forms' }];
      if (segments[2] === 'responses') {
        crumbs.push({ label: 'Form Builder', path: `forms/${segments[1]}` });
        crumbs.push({ label: 'Responses' });
      } else {
        crumbs.push({ label: 'Form Builder' });
      }
      return crumbs;
    }
    const parent = detailParents[baseRoute];
    if (parent) {
      return [
        { label: parent.label, path: parent.path },
        { label: detailTitles[baseRoute] || 'Details' },
      ];
    }
  }

  if (segments.length === 1 && routeTitles[segments[0]]) {
    return [{ label: routeTitles[segments[0]] }];
  }

  return [{ label: 'Soluly' }];
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "comment":
      return MessageSquare;
    case "ticket":
      return Ticket;
    case "feature_request":
      return Lightbulb;
    case "feedback":
      return MessageCircle;
    default:
      return Bell;
  }
}

function getNotificationUrl(notification: Notification): string {
  if (!notification.entity_display_id) return "";

  switch (notification.entity_type) {
    case "ticket":
      return `/tickets/${notification.entity_display_id}`;
    case "feature_request":
      return `/features/${notification.entity_display_id}`;
    case "feedback":
      return `/feedback/${notification.entity_display_id}`;
    default:
      return "";
  }
}

export function AppHeader() {
  const navigate = useNavigate();
  const { navigateOrg } = useOrgNavigation();
  const { member, organization, role, signOut } = useAuth();
  const crumbs = useBreadcrumbs();

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    const url = getNotificationUrl(notification);
    if (url) {
      navigateOrg(url);
    }
  };

  const initials = member?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-2 sm:px-4 shrink-0">
      {/* Breadcrumb trail (Fluent command bar) */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <span className="text-muted-foreground/70 px-0.5">/</span>}
              {isLast || !crumb.path ? (
                <h1 className={`truncate ${isLast ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {crumb.label}
                </h1>
              ) : (
                <button
                  onClick={() => navigateOrg(`/${crumb.path}`)}
                  className="truncate rounded-sm px-1 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative border border-transparent hover:border-border">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 border">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs h-7"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!notification.read ? "font-medium" : ""}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={() => navigateOrg("/settings?tab=notifications")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Notification settings
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="border border-transparent hover:border-border gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">{member?.name || "User"}</span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                  {role?.name || member?.role || "Member"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{member?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{member?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigateOrg("/settings")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateOrg("/settings")} className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{organization?.name || "Organization"}</span>
                <span className="text-xs text-muted-foreground">{organization?.slug}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateOrg("/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
