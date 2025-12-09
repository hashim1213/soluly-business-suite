import { User, Bell, Mail, Key, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Alex Johnson" className="border-2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex@soluly.com" className="border-2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" defaultValue="Soluly Consulting" className="border-2" />
          </div>
          <Button className="border-2">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive email updates for new tickets</div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="border-border" />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">High Priority Alerts</div>
              <div className="text-sm text-muted-foreground">Get notified immediately for high priority items</div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="border-border" />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Digest</div>
              <div className="text-sm text-muted-foreground">Receive a weekly summary of all activity</div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>Connect your email for AI-powered processing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="p-4 border-2 border-dashed border-muted-foreground/50 text-center">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Connect your business email to automatically import and categorize messages
            </p>
            <Button variant="outline" className="border-2" disabled>
              Connect Email (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API access for integrations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input value="sk_live_••••••••••••••••" readOnly className="border-2 font-mono" />
              <Button variant="outline" className="border-2 shrink-0">
                Regenerate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this key to integrate with external services</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
