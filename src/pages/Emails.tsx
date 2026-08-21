import { useState, useMemo } from "react";
import {
  Mail,
  RefreshCw,
  Loader2,
  Settings,
  Zap,
  Trash2,
  Calendar,
  Search,
  X,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails, useEmailStats, EmailFilters, useClearAllEmails } from "@/hooks/useEmails";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { useSyncAllGmailAccounts } from "@/hooks/useGmail";
import { useProcessAllPendingEmails } from "@/hooks/useEmailSync";
import { EmailList } from "@/components/emails/EmailList";
import { EmailDetailPanel } from "@/components/emails/EmailDetailPanel";
import { subYears, subMonths, subWeeks } from "date-fns";
import { orgPath } from "@/lib/tenant";
import { Database } from "@/integrations/supabase/types";

type EmailCategory = Database["public"]["Enums"]["email_category"];

const categoryOptions: { value: EmailCategory; label: string }[] = [
  { value: "ticket", label: "Tickets" },
  { value: "feature_request", label: "Feature Requests" },
  { value: "customer_quote", label: "Customer Quotes" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

const dateRangeOptions = [
  { value: "1week", label: "Last week" },
  { value: "1month", label: "Last month" },
  { value: "3months", label: "Last 3 months" },
  { value: "1year", label: "Last year" },
  { value: "all", label: "All time" },
];

function getFromDate(range: string): Date | undefined {
  const now = new Date();
  switch (range) {
    case "1week": return subWeeks(now, 1);
    case "2weeks": return subWeeks(now, 2);
    case "1month": return subMonths(now, 1);
    case "3months": return subMonths(now, 3);
    case "6months": return subMonths(now, 6);
    case "1year": return subYears(now, 1);
    case "2years": return subYears(now, 2);
    case "all": return undefined;
    default: return subMonths(now, 1);
  }
}

type InboxTab = "all" | "review" | "pending" | "done";

export default function Emails() {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dateRange, setDateRange] = useState("1year");
  const [accountFilter, setAccountFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<EmailCategory | undefined>();
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState("1month");
  const [syncMaxResults, setSyncMaxResults] = useState("100");

  const filters: EmailFilters = useMemo(() => ({
    fromDate: getFromDate(dateRange),
    search: appliedSearch || undefined,
    emailAccountId: accountFilter,
    category: categoryFilter,
    ...(activeTab === "review" ? { status: "processed" as const, reviewStatus: "pending" as const } : {}),
    ...(activeTab === "pending" ? { status: "pending" as const } : {}),
    ...(activeTab === "done" ? { reviewStatus: "approved" as const } : {}),
  }), [dateRange, appliedSearch, accountFilter, categoryFilter, activeTab]);

  const { data: emails, isLoading: emailsLoading } = useEmails(filters);
  const { data: stats } = useEmailStats();
  const { data: accounts } = useEmailAccounts();
  const syncAll = useSyncAllGmailAccounts();
  const processAll = useProcessAllPendingEmails();
  const clearAll = useClearAllEmails();

  const hasConnectedAccounts = accounts && accounts.length > 0;
  const activeFilterCount = (accountFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (dateRange !== "1year" ? 1 : 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
  };

  const clearSearch = () => {
    setSearch("");
    setAppliedSearch("");
  };

  const handleSyncAll = () => {
    syncAll.mutate({
      maxResults: parseInt(syncMaxResults),
      fromDate: getFromDate(syncDateRange),
    });
    setIsSyncDialogOpen(false);
  };

  if (!hasConnectedAccounts) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Email Inbox</h1>
          <p className="text-muted-foreground mb-8">
            Connect Gmail, Outlook, or a private IMAP mailbox to sync and categorize emails with AI.
          </p>
          <Button size="lg" onClick={() => navigate(orgPath(organization?.slug, "/settings"))}>
            <Settings className="h-4 w-4 mr-2" />
            Connect Email Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-background shrink-0">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm border-muted"
          />
          {appliedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] min-w-4 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {accounts && accounts.length > 1 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Account</Label>
                  <Select
                    value={accountFilter || "all"}
                    onValueChange={(v) => setAccountFilter(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : (v as EmailCategory))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => {
                    setDateRange("1year");
                    setAccountFilter(undefined);
                    setCategoryFilter(undefined);
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InboxTab)} className="ml-2">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">
              All
              {stats?.total ? <span className="ml-1 text-muted-foreground">{stats.total}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs px-2.5 h-6">
              Review
              {stats?.needsReview ? (
                <span className="ml-1 text-orange-600 font-medium">{stats.needsReview}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-2.5 h-6">
              New
              {stats?.pending ? (
                <span className="ml-1 text-yellow-600 font-medium">{stats.pending}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs px-2.5 h-6">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        {stats?.pending && stats.pending > 0 ? (
          <Button onClick={() => processAll.mutate()} disabled={processAll.isPending} size="sm" variant="default" className="h-8 text-xs">
            {processAll.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 mr-1.5" />
            )}
            Process {stats.pending}
          </Button>
        ) : null}

        <Button
          variant="ghost"
          onClick={() => syncAll.mutate({ maxResults: 50 })}
          disabled={syncAll.isPending}
          size="sm"
          className="h-8 text-xs"
        >
          {syncAll.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Sync
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsSyncDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Sync older emails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(orgPath(organization?.slug, "/settings"))}>
              <Settings className="h-4 w-4 mr-2" />
              Email settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  disabled={!stats?.total}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all emails
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Emails?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {stats?.total || 0} synced emails.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearAll.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Two-pane layout: list (narrow) + reading pane (wide) */}
      <div className="flex-1 flex min-h-0">
        {/* Email list — fixed narrow width */}
        <div className="w-80 xl:w-96 border-r flex flex-col shrink-0">
          <div className="px-3 py-1.5 border-b flex items-center justify-between bg-muted/30">
            <span className="text-[11px] font-medium text-muted-foreground">
              {emailsLoading ? "Loading..." : `${emails?.length || 0} emails`}
            </span>
            {emailsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex-1 min-h-0">
            <EmailList
              emails={emails || []}
              selectedId={selectedEmailId}
              onSelect={setSelectedEmailId}
              isLoading={emailsLoading}
            />
          </div>
        </div>

        {/* Reading pane — takes all remaining space */}
        <div className="flex-1 min-w-0">
          <EmailDetailPanel emailId={selectedEmailId} />
        </div>
      </div>

      {/* Sync Options Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Older Emails</DialogTitle>
            <DialogDescription>
              Fetch historical emails from your connected accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={syncDateRange} onValueChange={setSyncDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">Last Week</SelectItem>
                  <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="2years">Last 2 Years</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Limit</Label>
              <Select value={syncMaxResults} onValueChange={setSyncMaxResults}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 emails</SelectItem>
                  <SelectItem value="100">100 emails</SelectItem>
                  <SelectItem value="200">200 emails</SelectItem>
                  <SelectItem value="500">500 emails</SelectItem>
                  <SelectItem value="1000">1,000 emails</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSyncAll} disabled={syncAll.isPending}>
              {syncAll.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Sync
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
