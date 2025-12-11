import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Settings2, Trash2, CheckCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  useEmailAccounts,
  useUpdateEmailAccount,
  useDeleteEmailAccount,
} from "@/hooks/useEmailAccounts";
import { useConnectGmail, useSyncGmailAccount } from "@/hooks/useGmail";
import { format } from "date-fns";

// Gmail logo SVG
const GmailLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    <path fill="#34A853" d="M1.636 21.002h3.819V11.73L0 7.364v12.002c0 .904.732 1.636 1.636 1.636z"/>
    <path fill="#4285F4" d="M18.545 21.002h3.819A1.636 1.636 0 0 0 24 19.366V7.364l-5.455 4.364v9.274z"/>
    <path fill="#FBBC05" d="M5.455 4.64V11.73L0 7.364V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64z"/>
    <path fill="#C5221F" d="M18.545 4.64l1.528-1.145C21.69 2.28 24 3.434 24 5.457v1.907l-5.455 4.364V4.64z"/>
  </svg>
);

export function EmailAccountsSettings() {
  const { data: accounts, isLoading } = useEmailAccounts();
  const updateAccount = useUpdateEmailAccount();
  const deleteAccount = useDeleteEmailAccount();
  const connectGmail = useConnectGmail();
  const syncGmail = useSyncGmailAccount();

  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const handleConnectGmail = async () => {
    connectGmail.mutate();
  };

  const handleSync = async (accountId: string) => {
    syncGmail.mutate({ accountId });
  };

  const handleUpdateSettings = async () => {
    if (!editingAccount) return;

    await updateAccount.mutateAsync({
      id: editingAccount.id,
      auto_categorize: editingAccount.auto_categorize,
      auto_create_records: editingAccount.auto_create_records,
    });
    setEditingAccount(null);
  };

  const handleDelete = async () => {
    if (deleteAccountId) {
      await deleteAccount.mutateAsync(deleteAccountId);
      setDeleteAccountId(null);
    }
  };

  const getStatusBadge = (account: any) => {
    if (account.status === "syncing") {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      );
    }
    if (account.status === "error") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    if (account.oauth_provider === "google") {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Manual
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const gmailAccounts = accounts?.filter(a => a.oauth_provider === "google") || [];
  const manualAccounts = accounts?.filter(a => !a.oauth_provider) || [];

  return (
    <div className="space-y-6">
      {/* Gmail Connection Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Gmail Accounts</h3>
            <p className="text-sm text-muted-foreground">
              Connect Gmail accounts to automatically sync and categorize emails.
            </p>
          </div>
          <Button onClick={handleConnectGmail} disabled={connectGmail.isPending}>
            {connectGmail.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GmailLogo />
            )}
            <span className="ml-2">Connect Gmail</span>
          </Button>
        </div>

        {gmailAccounts.length > 0 ? (
          <div className="grid gap-4">
            {gmailAccounts.map((account) => (
              <Card key={account.id} className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                        <GmailLogo />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.display_name}</CardTitle>
                        <CardDescription>{account.email_address}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(account)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {account.last_sync_at ? (
                        <>Last synced: {format(new Date(account.last_sync_at), "MMM d, yyyy h:mm a")}</>
                      ) : (
                        <>Never synced</>
                      )}
                      {account.last_error && (
                        <span className="text-destructive ml-2">Error: {account.last_error}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account.id)}
                        disabled={syncGmail.isPending || account.status === "syncing"}
                      >
                        {syncGmail.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Sync</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                      >
                        <Settings2 className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">Settings</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteAccountId(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className={account.auto_categorize ? "text-green-600" : "text-muted-foreground"}>
                      {account.auto_categorize ? "Auto-categorize on" : "Auto-categorize off"}
                    </span>
                    <span className={account.auto_create_records ? "text-green-600" : "text-muted-foreground"}>
                      {account.auto_create_records ? "Auto-create on" : "Review first"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <GmailLogo />
              </div>
              <h4 className="font-medium mb-2">No Gmail accounts connected</h4>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Connect your Gmail account to automatically sync emails and use AI to categorize them.
              </p>
              <Button onClick={handleConnectGmail} disabled={connectGmail.isPending}>
                {connectGmail.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GmailLogo />
                )}
                <span className="ml-2">Connect Gmail</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Manual Email Sources Section */}
      {manualAccounts.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Manual Email Sources</h3>
            <p className="text-sm text-muted-foreground">
              Email sources added manually.
            </p>
          </div>

          <div className="grid gap-4">
            {manualAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.display_name}</CardTitle>
                        <CardDescription>{account.email_address}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(account)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {format(new Date(account.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAccount(account)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteAccountId(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Settings Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle>Email Account Settings</DialogTitle>
            <DialogDescription>
              Configure how emails from this account are processed.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {editingAccount.oauth_provider === "google" ? <GmailLogo /> : <Mail className="h-5 w-5" />}
                <div>
                  <div className="font-medium">{editingAccount.display_name}</div>
                  <div className="text-sm text-muted-foreground">{editingAccount.email_address}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Categorize</Label>
                    <p className="text-sm text-muted-foreground">Use AI to automatically categorize emails</p>
                  </div>
                  <Switch
                    checked={editingAccount.auto_categorize}
                    onCheckedChange={(checked) => setEditingAccount({ ...editingAccount, auto_categorize: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Create Records</Label>
                    <p className="text-sm text-muted-foreground">Automatically create tickets, features, etc.</p>
                  </div>
                  <Switch
                    checked={editingAccount.auto_create_records}
                    onCheckedChange={(checked) => setEditingAccount({ ...editingAccount, auto_create_records: checked })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} disabled={updateAccount.isPending}>
              {updateAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Email Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this email account?
              Existing emails will not be deleted, but syncing will stop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
