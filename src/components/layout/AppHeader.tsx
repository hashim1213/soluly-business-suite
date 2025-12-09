import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="h-14 border-b-2 border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="border-2 border-transparent hover:border-border" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets, projects..."
            className="w-80 pl-10 border-2 focus:ring-0 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            3
          </span>
        </Button>
        <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
