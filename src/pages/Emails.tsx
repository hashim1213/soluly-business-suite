import { useState } from "react";
import { Mail, RefreshCw, Loader2, Settings, Inbox, CheckCircle, Clock, AlertCircle, Zap, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails, useEmailStats, EmailFilters, useClearAllEmails } from "@/hooks/useEmails";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { useSyncAllGmailAccounts } from "@/hooks/useGmail";
import { useProcessAllPendingEmails } from "@/hooks/useEmailSync";
import { EmailList } from "@/components/emails/EmailList";
import { EmailDetailPanel } from "@/components/emails/EmailDetailPanel";
import { EmailFilterBar } from "@/components/emails/EmailFilterBar";
import { subYears, subMonths, subWeeks, subDays } from "date-fns";

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
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Inbox</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Connect your Gmail account to automatically sync, categorize, and manage incoming emails with AI-powered processing.
            </p>
            <Button onClick={() => navigate(`/org/${organization?.slug}/settings`)}>
              <Settings className="h-4 w-4 mr-2" />
              Connect Gmail in Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered email categorization and ticket creation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessAll}
            disabled={processAll.isPending || !stats?.pending}
            className="border-2"
          >
            {processAll.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Process {stats?.pending || 0} Pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickSync}
            disabled={syncAll.isPending}
            className="border-2"
          >
            {syncAll.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSyncDialogOpen(true)}
            disabled={syncAll.isPending}
            className="border-2"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Sync Older
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={!stats?.total || clearAll.isPending}
              >
                {clearAll.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Emails?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all {stats?.total || 0} synced emails. You can re-sync afterwards with your updated filters. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearAll.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All Emails
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/org/${organization?.slug}/settings`)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{stats?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Total Emails</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{stats?.pending || 0}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{stats?.needsReview || 0}</div>
                <div className="text-xs text-muted-foreground">Needs Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{stats?.approved || 0}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{stats?.tickets || 0}</div>
                <div className="text-xs text-muted-foreground">→ Tickets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <EmailFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Email List */}
        <Card className="border-2 overflow-hidden">
          <CardHeader className="p-4 border-b-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {emails?.length || 0} emails
              </CardTitle>
              {emailsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-4rem)]">
            <EmailList
              emails={emails || []}
              selectedId={selectedEmailId}
              onSelect={setSelectedEmailId}
              isLoading={emailsLoading}
            />
          </CardContent>
        </Card>

        {/* Email Detail */}
        <Card className="border-2 overflow-hidden">
          <CardContent className="p-0 h-full">
            <EmailDetailPanel emailId={selectedEmailId} />
          </CardContent>
        </Card>
      </div>

      {/* Sync Options Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle>Sync Older Emails</DialogTitle>
            <DialogDescription>
              Choose how far back to sync emails from your connected accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date Range</Label>
              <Select value={syncDateRange} onValueChange={setSyncDateRange}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="1week">Last 1 Week</SelectItem>
                  <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="1month">Last 1 Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last 1 Year</SelectItem>
                  <SelectItem value="2years">Last 2 Years</SelectItem>
                  <SelectItem value="all">All Time (may be slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Maximum Emails</Label>
              <Select value={syncMaxResults} onValueChange={setSyncMaxResults}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="50">50 emails</SelectItem>
                  <SelectItem value="100">100 emails</SelectItem>
                  <SelectItem value="200">200 emails</SelectItem>
                  <SelectItem value="500">500 emails</SelectItem>
                  <SelectItem value="1000">1000 emails (slow)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher limits will take longer to sync and process.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleSyncAll} disabled={syncAll.isPending} className="border-2">
              {syncAll.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Start Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
