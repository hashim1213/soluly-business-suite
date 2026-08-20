import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, Plug } from "lucide-react";
import { useTestImapConnection, useAddImapAccount } from "@/hooks/useImapEmail";

interface AddImapAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm = {
  displayName: "",
  host: "",
  port: "993",
  username: "",
  password: "",
  useSsl: true,
  syncFolder: "INBOX",
};

export function AddImapAccountDialog({ open, onOpenChange }: AddImapAccountDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [tested, setTested] = useState(false);
  const testConnection = useTestImapConnection();
  const addAccount = useAddImapAccount();

  const set = (key: keyof typeof emptyForm, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTested(false);
  };

  const credentials = {
    host: form.host.trim(),
    port: parseInt(form.port, 10) || 993,
    username: form.username.trim(),
    password: form.password,
    useSsl: form.useSsl,
    displayName: form.displayName.trim() || undefined,
    syncFolder: form.syncFolder.trim() || "INBOX",
  };

  const canSubmit = credentials.host && credentials.username && credentials.password;

  const handleTest = async () => {
    try {
      await testConnection.mutateAsync(credentials);
      setTested(true);
    } catch {
      setTested(false);
    }
  };

  const handleAdd = async () => {
    await addAccount.mutateAsync(credentials);
    setForm(emptyForm);
    setTested(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Private Mail Account</DialogTitle>
          <DialogDescription>
            Connect any mailbox over IMAP — your own mail server, Zoho, Fastmail, ProtonMail Bridge, etc.
            Credentials are stored securely and only used server-side.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <div className="space-y-2">
              <Label>IMAP Server</Label>
              <Input
                placeholder="imap.yourdomain.com"
                value={form.host}
                onChange={(e) => set("host", e.target.value)}
                className="border"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                type="number"
                value={form.port}
                onChange={(e) => set("port", e.target.value)}
                className="border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email / Username</Label>
            <Input
              placeholder="you@yourdomain.com"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className="border"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="App password or mailbox password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="border"
            />
            <p className="text-xs text-muted-foreground">
              If your provider supports app passwords, use one instead of your main password.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-2">
              <Label>Display Name (optional)</Label>
              <Input
                placeholder="Support Inbox"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                className="border"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Use SSL/TLS</Label>
              <Switch checked={form.useSsl} onCheckedChange={(v) => set("useSsl", v)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!canSubmit || testConnection.isPending}
            className="border"
          >
            {testConnection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : tested ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Plug className="h-4 w-4 mr-2" />
            )}
            {tested ? "Connection OK" : "Test Connection"}
          </Button>
          <Button onClick={handleAdd} disabled={!canSubmit || addAccount.isPending}>
            {addAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
