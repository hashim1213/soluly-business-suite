import { useState } from "react";
import { Mail, RefreshCw, Loader2, Settings, Inbox, CheckCircle, Clock, AlertCircle, Zap, Trash2, Calendar, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails, useEmailStats, EmailFilters, useClearAllEmails } from "@/hooks/useEmails";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { useSyncAllGmailAccounts } from "@/hooks/useGmail";
import { useProcessAllPendingEmails } from "@/hooks/useEmailSync";
import { EmailList } from "@/components/emails/EmailList";
import { EmailDetailPanel } from "@/components/emails/EmailDetailPanel";
import { EmailFilterBar } from "@/components/emails/EmailFilterBar";
import { subYears, subMonths, subWeeks } from "date-fns";

export default function Emails() {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmailFilters>({
    fromDate: subYears(new Date(), 1),
    toDate: new Date(),
  });
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState("1month");
  const [syncMaxResults, setSyncMaxResults] = useState("100");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: emails, isLoading: emailsLoading } = useEmails(filters);
  const { data: stats } = useEmailStats();
  const { data: accounts } = useEmailAccounts();
  const syncAll = useSyncAllGmailAccounts();
  const processAll = useProcessAllPendingEmails();
  const clearAll = useClearAllEmails();

  const hasConnectedAccounts = accounts && accounts.length > 0;

  const getFromDate = (range: string): Date | undefined => {
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
  };

  const handleSyncAll = () => {
    syncAll.mutate({
      maxResults: parseInt(syncMaxResults),
      fromDate: getFromDate(syncDateRange),
    });
    setIsSyncDialogOpen(false);
  };

  const handleQuickSync = () => {
    syncAll.mutate({ maxResults: 50 });
  };

  const handleProcessAll = () => {
    processAll.mutate();
  };

  // If no email accounts are connected, show setup prompt
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
              Connect your Gmail account to automatically sync, categorize, and manage incoming emails with AI-powered processing.
            </p>
            <Button size="lg" onClick={() => navigate(`/org/${organization?.slug}/settings`)} className="border">
              <Settings className="h-5 w-5 mr-2" />
              Connect Gmail in Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveFilters =
    filters.emailAccountId ||
    filters.category ||
    filters.status ||
    filters.reviewStatus ||
    filters.search;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Compact Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Quick Process Button */}
          {stats?.pending && stats.pending > 0 && (
            <Button
              onClick={handleProcessAll}
              disabled={processAll.isPending}
              className="border"
              size="sm"
            >
              {processAll.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Process ({stats.pending})
            </Button>
          )}

          {/* Quick Sync */}
          <Button
            variant="outline"
            onClick={handleQuickSync}
            disabled={syncAll.isPending}
            className="border"
            size="sm"
          >
            {syncAll.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync
          </Button>

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border w-48">
              <DropdownMenuItem onClick={() => setIsSyncDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Sync Older Emails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/org/${organization?.slug}/settings`)}>
                <Settings className="h-4 w-4 mr-2" />
                Email Settings
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
                    Clear All Emails
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

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{stats?.total || 0}</span>
            <span className="text-muted-foreground">total</span>
          </div>
          {stats?.pending && stats.pending > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-600">{stats.pending}</span>
              <span className="text-muted-foreground">pending</span>
            </div>
          )}
          {stats?.needsReview && stats.needsReview > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-orange-600">{stats.needsReview}</span>
              <span className="text-muted-foreground">review</span>
            </div>
          )}
        </div>
      </div>


      {/* Collapsible Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="border">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          {emails && (
            <span className="text-sm text-muted-foreground">
              Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <CollapsibleContent className="mt-4">
          <EmailFilterBar filters={filters} onFiltersChange={setFilters} />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content - Gmail-style Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[33.33%_66.67%] gap-4 min-h-0">
        {/* Email List - 1/3 width */}
        <Card className="border overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">
                {emailsLoading ? 'Loading...' : `${emails?.length || 0} Emails`}
              </h2>
            </div>
            {emailsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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

        {/* Email Detail - 2/3 width for reading */}
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
