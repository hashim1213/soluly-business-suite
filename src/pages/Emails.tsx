import { useState } from "react";
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

// Inbox-style tabs mapped onto status/review filters
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

  const filters: EmailFilters = {
    fromDate: getFromDate(dateRange),
    toDate: new Date(),
    search: appliedSearch || undefined,
    emailAccountId: accountFilter,
    category: categoryFilter,
    ...(activeTab === "review" ? { status: "processed" as const, reviewStatus: "pending" as const } : {}),
    ...(activeTab === "pending" ? { status: "pending" as const } : {}),
    ...(activeTab === "done" ? { reviewStatus: "approved" as const } : {}),
  };

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
      <div className="space-y-6">
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-3">Email Inbox</h1>
            <p className="text-muted-foreground mb-8 max-w-md text-base">
              Connect Gmail, Outlook, or a private IMAP mailbox to automatically sync, categorize,
              and manage incoming emails with AI-powered processing.
            </p>
            <Button size="lg" onClick={() => navigate(orgPath(organization?.slug, "/settings"))} className="border">
              <Settings className="h-5 w-5 mr-2" />
              Connect Email in Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-3">
      {/* Toolbar: search + filters + actions in one row */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 border"
          />
          {appliedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border h-9">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 border" align="start">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-8 border">
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Account</Label>
                  <Select
                    value={accountFilter || "all"}
                    onValueChange={(v) => setAccountFilter(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="h-8 border">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : (v as EmailCategory))}
                >
                  <SelectTrigger className="h-8 border">
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
                  className="w-full h-8"
                  onClick={() => {
                    setDateRange("1year");
                    setAccountFilter(undefined);
                    setCategoryFilter(undefined);
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Reset filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Primary actions */}
        {stats?.pending && stats.pending > 0 ? (
          <Button onClick={() => processAll.mutate()} disabled={processAll.isPending} size="sm" className="h-9">
            {processAll.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Process {stats.pending}
          </Button>
        ) : null}

        <Button
          variant="outline"
          onClick={() => syncAll.mutate({ maxResults: 50 })}
          disabled={syncAll.isPending}
          size="sm"
          className="border h-9"
        >
          {syncAll.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border h-9 w-9 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border w-52">
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
              <AlertDialogContent className="border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Emails?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {stats?.total || 0} synced emails. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border">Cancel</AlertDialogCancel>
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

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InboxTab)}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-sm">
            All
            {stats?.total ? <span className="ml-1.5 text-xs text-muted-foreground">{stats.total}</span> : null}
          </TabsTrigger>
          <TabsTrigger value="review" className="text-sm">
            Needs Review
            {stats?.needsReview ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {stats.needsReview}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm">
            Unprocessed
            {stats?.pending ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                {stats.pending}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="done" className="text-sm">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Two-pane inbox */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-3 min-h-0">
        <Card className="border overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              {emailsLoading ? "Loading..." : `${emails?.length || 0} email${(emails?.length || 0) !== 1 ? "s" : ""}`}
            </span>
            {emailsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex-1 min-h-0">
            <EmailList
              emails={emails || []}
              selectedId={selectedEmailId}
              onSelect={setSelectedEmailId}
              isLoading={emailsLoading}
            />
          </div>
        </Card>

        <Card className="border overflow-hidden">
          <EmailDetailPanel emailId={selectedEmailId} />
        </Card>
      </div>

      {/* Sync Options Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="border sm:max-w-md">
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
                <SelectTrigger className="border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border">
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
                <SelectTrigger className="border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border">
                  <SelectItem value="50">50 emails</SelectItem>
                  <SelectItem value="100">100 emails</SelectItem>
                  <SelectItem value="200">200 emails</SelectItem>
                  <SelectItem value="500">500 emails</SelectItem>
                  <SelectItem value="1000">1,000 emails</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Larger limits may take longer to sync and process.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} className="border">
              Cancel
            </Button>
            <Button onClick={handleSyncAll} disabled={syncAll.isPending} className="border">
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
