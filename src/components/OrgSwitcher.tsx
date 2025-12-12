import { useState } from "react";
import { Check, ChevronsUpDown, Building2, Plus, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserOrganizations, UserOrganization } from "@/hooks/useUserOrganizations";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { data: organizations, isLoading } = useUserOrganizations();
  const { organization: currentOrg, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleOrgSelect = (org: UserOrganization) => {
    setOpen(false);
    if (org.slug !== currentOrg?.slug) {
      // Navigate to the new org's dashboard
      // This will trigger a page reload to switch context
      window.location.href = `/org/${org.slug}`;
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md border-2 border-transparent hover:border-border"
          >
            <Avatar className="h-7 w-7">
              {currentOrg?.logo_url ? (
                <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />
              ) : null}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentOrg?.icon || getOrgInitials(currentOrg?.name || "S")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" side="right">
          <OrgSwitcherContent
            organizations={organizations || []}
            currentOrg={currentOrg}
            isLoading={isLoading}
            onSelect={handleOrgSelect}
            onSignOut={handleSignOut}
            userEmail={user?.email}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-2 h-10 border-2 border-transparent hover:border-border"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 shrink-0">
              {currentOrg?.logo_url ? (
                <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />
              ) : null}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {currentOrg?.icon || getOrgInitials(currentOrg?.name || "S")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{currentOrg?.name || "Select org"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <OrgSwitcherContent
          organizations={organizations || []}
          currentOrg={currentOrg}
          isLoading={isLoading}
          onSelect={handleOrgSelect}
          onSignOut={handleSignOut}
          userEmail={user?.email}
        />
      </PopoverContent>
    </Popover>
  );
}

interface OrgSwitcherContentProps {
  organizations: UserOrganization[];
  currentOrg: { id: string; name: string; slug: string } | null;
  isLoading: boolean;
  onSelect: (org: UserOrganization) => void;
  onSignOut: () => void;
  userEmail?: string;
}

function OrgSwitcherContent({
  organizations,
  currentOrg,
  isLoading,
  onSelect,
  onSignOut,
  userEmail,
}: OrgSwitcherContentProps) {
  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Command>
      <CommandInput placeholder="Search organizations..." />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Loading..." : "No organizations found."}
        </CommandEmpty>
        <CommandGroup heading="Organizations">
          {organizations.map((org) => (
            <CommandItem
              key={org.id}
              value={org.name}
              onSelect={() => onSelect(org)}
              className="cursor-pointer"
            >
              <Avatar className="h-6 w-6 mr-2">
                {org.logo_url ? (
                  <AvatarImage src={org.logo_url} alt={org.name} />
                ) : null}
                <AvatarFallback className="text-xs bg-muted">
                  {org.icon || getOrgInitials(org.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">{org.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {org.role_name} {org.is_owner && "• Owner"}
                </span>
              </div>
              <Check
                className={cn(
                  "ml-auto h-4 w-4",
                  currentOrg?.id === org.id ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {userEmail && (
            <CommandItem disabled className="opacity-70">
              <User className="mr-2 h-4 w-4" />
              <span className="truncate text-sm">{userEmail}</span>
            </CommandItem>
          )}
          <CommandItem
            onSelect={onSignOut}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
