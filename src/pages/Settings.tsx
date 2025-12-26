import { useState, useRef, useEffect } from "react";
import {
  User,
  Bell,
  Mail,
  Building2,
  Users,
  Shield,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Check,
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
  Upload,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { EmailAccountsSettings } from "@/components/settings/EmailAccountsSettings";
import { useInvitations, useCreateInvitation, useDeleteInvitation } from "@/hooks/useInvitations";
import { useUpdateOrganization, useOrganizationStats, useCurrentOrganization } from "@/hooks/useOrganization";
import { Textarea } from "@/components/ui/textarea";
import { useUploadOrgLogo, useRemoveOrgLogo } from "@/hooks/useOrgLogo";
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { useTheme, ThemeMode, ThemeStyle } from "@/contexts/ThemeContext";
import { useUpdateNotificationPreferences, NotificationPreferences } from "@/hooks/useNotifications";

export default function Settings() {
  const { member, organization, role, hasPermission, refreshUserData } = useAuth();
  const { mode, style, setMode, setStyle, resolvedMode } = useTheme();
  const { data: roles } = useRoles();
  const { data: invitations } = useInvitations();
  const { data: teamMembers } = useTeamMembers();
  const { data: orgStats } = useOrganizationStats();
  const { data: orgDetails } = useCurrentOrganization();

  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const updateOrganization = useUpdateOrganization();
  const uploadOrgLogo = useUploadOrgLogo();
  const removeOrgLogo = useRemoveOrgLogo();
  const updateTeamMember = useUpdateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();
  const updateNotificationPreferences = useUpdateNotificationPreferences();

  // Logo upload ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences state
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    (member as { email_notifications_enabled?: boolean })?.email_notifications_enabled !== false
  );
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    ((member as { notification_preferences?: NotificationPreferences })?.notification_preferences) || {
      comments: true,
      tickets: true,
      features: true,
      feedback: true,
    }
  );

  // Profile state
  const [profileName, setProfileName] = useState(member?.name || "");
  const [profilePhone, setProfilePhone] = useState(member?.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Organization state
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [orgSlug, setOrgSlug] = useState(organization?.slug || "");
  const [orgIcon, setOrgIcon] = useState(organization?.icon || "");
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Billing state
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("Canada");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [defaultInvoiceTerms, setDefaultInvoiceTerms] = useState("");
  const [defaultInvoiceNotes, setDefaultInvoiceNotes] = useState("");
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // Initialize billing state from organization details
  useEffect(() => {
    if (orgDetails) {
      setBillingName((orgDetails as any).billing_name || "");
      setBillingAddress((orgDetails as any).billing_address || "");
      setBillingCity((orgDetails as any).billing_city || "");
      setBillingState((orgDetails as any).billing_state || "");
      setBillingPostalCode((orgDetails as any).billing_postal_code || "");
      setBillingCountry((orgDetails as any).billing_country || "Canada");
      setBillingPhone((orgDetails as any).billing_phone || "");
      setBillingEmail((orgDetails as any).billing_email || "");
      setTaxNumber((orgDetails as any).tax_number || "");
      setDefaultInvoiceTerms((orgDetails as any).default_invoice_terms || "Payment is due within 30 days of receipt of this invoice. Please make payment via bank transfer or cheque to the details provided.");
      setDefaultInvoiceNotes((orgDetails as any).default_invoice_notes || "");
    }
  }, [orgDetails]);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const canManageUsers = hasPermission("settings", "manage_users");
  const canManageRoles = hasPermission("settings", "manage_roles");
  const canManageOrg = hasPermission("settings", "manage_org");

  // Save profile
  const handleSaveProfile = async () => {
    if (!member) return;
    setIsSavingProfile(true);
    try {
      await updateTeamMember.mutateAsync({
        id: member.id,
        name: profileName,
        phone: profilePhone || null,
      });
      await refreshUserData();
    } catch (error) {
      // Error handled by hook
    }
    setIsSavingProfile(false);
  };

  // Save organization
  const handleSaveOrg = async () => {
    setIsSavingOrg(true);
    try {
      await updateOrganization.mutateAsync({
        name: orgName,
        slug: orgSlug,
        icon: orgIcon || null,
      });
    } catch (error) {
      // Error handled by hook
    }
    setIsSavingOrg(false);
  };

  // Save billing settings
  const handleSaveBilling = async () => {
    setIsSavingBilling(true);
    try {
      await updateOrganization.mutateAsync({
        billing_name: billingName || null,
        billing_address: billingAddress || null,
        billing_city: billingCity || null,
        billing_state: billingState || null,
        billing_postal_code: billingPostalCode || null,
        billing_country: billingCountry || null,
        billing_phone: billingPhone || null,
        billing_email: billingEmail || null,
        tax_number: taxNumber || null,
        default_invoice_terms: defaultInvoiceTerms || null,
        default_invoice_notes: defaultInvoiceNotes || null,
      } as any);
      toast.success("Billing settings saved successfully");
    } catch (error) {
      // Error handled by hook
    }
    setIsSavingBilling(false);
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadOrgLogo.mutateAsync(file);
    }
    // Reset input so same file can be selected again
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteRoleId) {
      toast.error("Please enter an email and select a role");
      return;
    }
    try {
      await createInvitation.mutateAsync({
        email: inviteEmail,
        roleId: inviteRoleId,
      });
      setInviteEmail("");
      setInviteRoleId("");
      setIsInviteDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Copy invite link - use app.soluly.com for production
  const copyInviteLink = (token: string) => {
    const baseUrl = import.meta.env.PROD ? "https://app.soluly.com" : window.location.origin;
    const link = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  // Remove team member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await deleteTeamMember.mutateAsync(memberId);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Update member role
  const handleUpdateMemberRole = async (memberId: string, roleId: string) => {
    try {
      await updateTeamMember.mutateAsync({
        id: memberId,
        role_id: roleId,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle email notifications toggle
  const handleEmailNotificationsToggle = async (enabled: boolean) => {
    setEmailNotificationsEnabled(enabled);
    try {
      await updateNotificationPreferences.mutateAsync({
        emailNotificationsEnabled: enabled,
      });
      toast.success(enabled ? "Email notifications enabled" : "Email notifications disabled");
    } catch (error) {
      setEmailNotificationsEnabled(!enabled);
      toast.error("Failed to update notification settings");
    }
  };

  // Handle specific notification preference toggle
  const handleNotificationPrefToggle = async (key: keyof NotificationPreferences, enabled: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: enabled };
    setNotificationPrefs(newPrefs);
    try {
      await updateNotificationPreferences.mutateAsync({
        notificationPreferences: newPrefs,
      });
      toast.success("Notification preferences updated");
    } catch (error) {
      setNotificationPrefs(notificationPrefs);
      toast.error("Failed to update notification preferences");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and organization</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <TabsList className="border-2 inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
            {canManageOrg && <TabsTrigger value="organization" className="text-xs sm:text-sm">Org</TabsTrigger>}
            {canManageOrg && <TabsTrigger value="billing" className="text-xs sm:text-sm">Billing</TabsTrigger>}
            {canManageUsers && <TabsTrigger value="team" className="text-xs sm:text-sm">Team</TabsTrigger>}
            {canManageRoles && <TabsTrigger value="roles" className="text-xs sm:text-sm">Roles</TabsTrigger>}
            {hasPermission("emails", "edit") && <TabsTrigger value="email-accounts" className="text-xs sm:text-sm">Email</TabsTrigger>}
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifs</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
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
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={member?.email || ""}
                    disabled
                    className="border-2 bg-muted"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={role?.name || member?.role || "Member"}
                    disabled
                    className="border-2 bg-muted"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="border-2">
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of the application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Color Mode */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Color Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Choose between light, dark, or system preference
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light" as ThemeMode, label: "Light", icon: Sun },
                    { value: "dark" as ThemeMode, label: "Dark", icon: Moon },
                    { value: "system" as ThemeMode, label: "System", icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMode(value)}
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                        mode === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${mode === value ? "text-primary" : ""}`} />
                      <span className={`text-sm font-medium ${mode === value ? "text-primary" : ""}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="border-border" />

              {/* Theme Style */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Theme Style</Label>
                <p className="text-sm text-muted-foreground">
                  Select a visual style that matches your preference
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    {
                      value: "default" as ThemeStyle,
                      label: "Neobrutalist",
                      description: "Bold black borders, sharp edges",
                      colors: ["#000000", "#404040", "#737373"],
                    },
                    {
                      value: "professional" as ThemeStyle,
                      label: "Professional",
                      description: "Clean corporate blue accents",
                      colors: ["#1e40af", "#3b82f6", "#60a5fa"],
                    },
                    {
                      value: "modern" as ThemeStyle,
                      label: "Modern",
                      description: "Contemporary violet accents",
                      colors: ["#7c3aed", "#8b5cf6", "#a78bfa"],
                    },
                    {
                      value: "minimal" as ThemeStyle,
                      label: "Minimal",
                      description: "Ultra clean grayscale",
                      colors: ["#374151", "#6b7280", "#9ca3af"],
                    },
                    {
                      value: "green" as ThemeStyle,
                      label: "Nature",
                      description: "Fresh and natural greens",
                      colors: ["#15803d", "#22c55e", "#4ade80"],
                    },
                    {
                      value: "pink" as ThemeStyle,
                      label: "Rose",
                      description: "Warm and playful pinks",
                      colors: ["#be185d", "#ec4899", "#f472b6"],
                    },
                    {
                      value: "pastel" as ThemeStyle,
                      label: "Pastel",
                      description: "Soft and gentle tones",
                      colors: ["#60a5fa", "#f9a8d4", "#86efac"],
                    },
                    {
                      value: "enterprise" as ThemeStyle,
                      label: "Enterprise",
                      description: "Premium Morgan Stanley style",
                      colors: ["#1e3a5f", "#2563eb", "#64748b"],
                    },
                    {
                      value: "ocean" as ThemeStyle,
                      label: "Soluly Ocean",
                      description: "Signature teal oceanic theme",
                      colors: ["#0d9488", "#14b8a6", "#2dd4bf"],
                    },
                    {
                      value: "sunset" as ThemeStyle,
                      label: "Soluly Sunset",
                      description: "Warm amber sunset vibes",
                      colors: ["#ea580c", "#f97316", "#fb923c"],
                    },
                    {
                      value: "midnight" as ThemeStyle,
                      label: "Midnight",
                      description: "Deep violet midnight aesthetic",
                      colors: ["#7c3aed", "#8b5cf6", "#a78bfa"],
                    },
                    {
                      value: "carbon" as ThemeStyle,
                      label: "Carbon",
                      description: "IBM-inspired industrial design",
                      colors: ["#0072c3", "#42be65", "#f1c21b"],
                    },
                    {
                      value: "lightning" as ThemeStyle,
                      label: "Lightning",
                      description: "Salesforce-inspired business",
                      colors: ["#0176d3", "#1b96ff", "#57cbff"],
                    },
                    {
                      value: "spectrum" as ThemeStyle,
                      label: "Spectrum",
                      description: "Adobe-inspired creative style",
                      colors: ["#1473e6", "#2680eb", "#4b9cf5"],
                    },
                  ].map(({ value, label, description, colors }) => (
                    <button
                      key={value}
                      onClick={() => setStyle(value)}
                      className={`flex flex-col items-start gap-2 p-4 border-2 rounded-lg transition-colors text-left ${
                        style === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {style === value && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                      <span className={`font-medium ${style === value ? "text-primary" : ""}`}>
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="border-border" />

              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Preview</Label>
                <div className="p-4 border-2 rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-medium">Sample Card</div>
                    <Badge>Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is how content will appear with your selected theme settings.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="outline">Secondary</Button>
                    <Button size="sm" variant="ghost">Ghost</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently using: <span className="font-medium capitalize">{style}</span> theme in{" "}
                  <span className="font-medium capitalize">{resolvedMode}</span> mode
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        {canManageOrg && (
          <TabsContent value="organization" className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>Manage your organization details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Organization Logo */}
                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload a custom logo or choose an emoji for your organization
                  </p>
                  <div className="flex items-start gap-4">
                    {/* Logo/Icon Preview */}
                    <div className="h-16 w-16 bg-primary flex items-center justify-center rounded-lg border-2 overflow-hidden shrink-0">
                      {organization?.logo_url ? (
                        <img
                          src={organization.logo_url}
                          alt="Organization logo"
                          className="h-full w-full object-cover"
                        />
                      ) : orgIcon ? (
                        <span className="text-3xl">{orgIcon}</span>
                      ) : (
                        <span className="text-primary-foreground font-bold text-xl">
                          {orgName?.[0]?.toUpperCase() || "S"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Upload Logo Button */}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="border-2"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadOrgLogo.isPending}
                      >
                        {uploadOrgLogo.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </>
                        )}
                      </Button>

                      {/* Remove Logo Button */}
                      {organization?.logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrgLogo.mutate()}
                          disabled={removeOrgLogo.isPending}
                          className="text-muted-foreground justify-start"
                        >
                          {removeOrgLogo.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Remove Logo
                        </Button>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Max 2MB. Supports JPEG, PNG, GIF, WebP, SVG.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emoji Icon (as fallback when no logo) */}
                <div className="space-y-2">
                  <Label>Fallback Icon</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose an emoji to show when no logo is uploaded
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-secondary flex items-center justify-center rounded-md border-2">
                      {orgIcon ? (
                        <span className="text-xl">{orgIcon}</span>
                      ) : (
                        <span className="font-bold">
                          {orgName?.[0]?.toUpperCase() || "S"}
                        </span>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="border-2">
                          Choose Emoji
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-2" align="start">
                        <div className="space-y-3">
                          <div className="font-medium">Select an icon</div>
                          <div className="grid grid-cols-8 gap-1">
                            {["🏢", "🏠", "🏗️", "🏭", "🏬", "🏛️", "🏪", "🏫",
                              "💼", "📊", "📈", "💡", "🚀", "⭐", "🎯", "🔥",
                              "💎", "🌟", "✨", "🎨", "🛠️", "⚙️", "🔧", "💻",
                              "📱", "🌐", "☁️", "🔒", "🛡️", "🎁", "📦", "🏆",
                              "🌈", "🌸", "🌺", "🌻", "🍀", "🌿", "🌴", "🌵",
                              "🦁", "🐯", "🦊", "🐺", "🦅", "🦋", "🐝", "🦄"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => setOrgIcon(emoji)}
                                className={`h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-lg ${
                                  orgIcon === emoji ? "bg-primary/10 ring-2 ring-primary" : ""
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Input
                              placeholder="Or type any emoji..."
                              value={orgIcon}
                              onChange={(e) => setOrgIcon(e.target.value.slice(-2))}
                              className="border-2 flex-1"
                              maxLength={2}
                            />
                            {orgIcon && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOrgIcon("")}
                                className="text-muted-foreground"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgSlug">Organization URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">app.soluly.com/org/</span>
                      <Input
                        id="orgSlug"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                {orgStats && (
                  <div className="grid gap-4 sm:grid-cols-3 pt-4">
                    <div className="p-4 border-2 rounded-lg">
                      <div className="text-2xl font-bold">{orgStats.memberCount}</div>
                      <div className="text-sm text-muted-foreground">Team Members</div>
                    </div>
                    <div className="p-4 border-2 rounded-lg">
                      <div className="text-2xl font-bold">{orgStats.projectCount}</div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                    <div className="p-4 border-2 rounded-lg">
                      <div className="text-2xl font-bold">{orgStats.pendingInvitations}</div>
                      <div className="text-sm text-muted-foreground">Pending Invites</div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="border-2">
                  {isSavingOrg ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Billing Tab */}
        {canManageOrg && (
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Billing & Invoice Settings</CardTitle>
                    <CardDescription>Configure your company billing information for invoices</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Company Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingName">Business Name</Label>
                      <Input
                        id="billingName"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        placeholder={organization?.name || "Your Company Name"}
                        className="border-2"
                      />
                      <p className="text-xs text-muted-foreground">Defaults to organization name if not set</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Tax ID / GST Number</Label>
                      <Input
                        id="taxNumber"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="e.g., 123456789RT0001"
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Billing Address</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Street Address</Label>
                      <Input
                        id="billingAddress"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="123 Business Street"
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          value={billingCity}
                          onChange={(e) => setBillingCity(e.target.value)}
                          placeholder="City"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingState">Province/State</Label>
                        <Input
                          id="billingState"
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value)}
                          placeholder="Province"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingPostalCode">Postal Code</Label>
                        <Input
                          id="billingPostalCode"
                          value={billingPostalCode}
                          onChange={(e) => setBillingPostalCode(e.target.value)}
                          placeholder="A1A 1A1"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country</Label>
                        <Input
                          id="billingCountry"
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          placeholder="Canada"
                          className="border-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingPhone">Phone Number</Label>
                      <Input
                        id="billingPhone"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">Billing Email</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        placeholder="billing@yourcompany.com"
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Default Invoice Terms */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Default Invoice Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultInvoiceTerms">Default Payment Terms</Label>
                      <Textarea
                        id="defaultInvoiceTerms"
                        value={defaultInvoiceTerms}
                        onChange={(e) => setDefaultInvoiceTerms(e.target.value)}
                        placeholder="Payment is due within 30 days..."
                        className="border-2 min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">These terms will appear on all invoices by default</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultInvoiceNotes">Default Invoice Notes</Label>
                      <Textarea
                        id="defaultInvoiceNotes"
                        value={defaultInvoiceNotes}
                        onChange={(e) => setDefaultInvoiceNotes(e.target.value)}
                        placeholder="Thank you for your business!"
                        className="border-2 min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground">Optional notes to include on all invoices</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveBilling} disabled={isSavingBilling} className="border-2">
                  {isSavingBilling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Billing Settings"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Team Tab */}
        {canManageUsers && (
          <TabsContent value="team" className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>Manage your team and send invitations</CardDescription>
                    </div>
                  </div>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="border-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-2">
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="border-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                            <SelectTrigger className="border-2">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles?.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleSendInvite}
                          disabled={createInvitation.isPending}
                          className="w-full border-2"
                        >
                          {createInvitation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Invitation"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Active Members */}
                <div className="space-y-4">
                  <h4 className="font-medium">Active Members ({teamMembers?.length || 0})</h4>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2">
                          <TableHead>Member</TableHead>
                          <TableHead className="hidden sm:table-cell">Role</TableHead>
                          <TableHead className="hidden md:table-cell">Status</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers?.map((tm) => (
                          <TableRow key={tm.id} className="border-b-2">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback>
                                    {tm.name?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{tm.name}</div>
                                  <div className="text-sm text-muted-foreground truncate">{tm.email}</div>
                                  <div className="sm:hidden mt-1">
                                    <Badge variant={tm.status === "active" ? "default" : "secondary"} className="text-xs">
                                      {tm.role || "Member"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Select
                                value={tm.role_id || ""}
                                onValueChange={(value) => handleUpdateMemberRole(tm.id, value)}
                                disabled={tm.is_owner}
                              >
                                <SelectTrigger className="w-[120px] sm:w-[140px] border-2">
                                  <SelectValue placeholder={tm.role} />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles?.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={tm.status === "active" ? "default" : "secondary"}>
                                {tm.status}
                              </Badge>
                              {tm.is_owner && (
                                <Badge variant="outline" className="ml-2">
                                  Owner
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!tm.is_owner && tm.id !== member?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveMember(tm.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pending Invitations */}
                {invitations && invitations.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <h4 className="font-medium">Pending Invitations ({invitations.length})</h4>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2">
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden sm:table-cell">Role</TableHead>
                            <TableHead className="hidden md:table-cell">Invited By</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map((inv) => (
                            <TableRow key={inv.id} className="border-b-2">
                              <TableCell>
                                <span className="truncate block max-w-[150px] sm:max-w-none">{inv.email}</span>
                                <span className="sm:hidden text-xs text-muted-foreground">{inv.role?.name || "Member"}</span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{inv.role?.name || "Member"}</TableCell>
                              <TableCell className="hidden md:table-cell">{inv.inviter?.name || "Unknown"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyInviteLink(inv.token)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteInvitation.mutate(inv.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Roles Tab */}
        {canManageRoles && (
          <TabsContent value="roles" className="space-y-6">
            <RoleManagement />
          </TabsContent>
        )}

        {/* Email Accounts Tab */}
        {hasPermission("emails", "edit") && (
          <TabsContent value="email-accounts" className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Email Accounts</CardTitle>
                    <CardDescription>Connect email accounts to sync and categorize incoming emails</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <EmailAccountsSettings />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
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
                  <div className="text-sm text-muted-foreground">Receive email updates when activity happens</div>
                </div>
                <Switch
                  checked={emailNotificationsEnabled}
                  onCheckedChange={handleEmailNotificationsToggle}
                  disabled={updateNotificationPreferences.isPending}
                />
              </div>

              {emailNotificationsEnabled && (
                <>
                  <Separator className="border-border" />
                  <div className="pl-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Choose which notifications you want to receive via email:</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Comments</div>
                        <div className="text-sm text-muted-foreground">New comments on tickets, features, and feedback</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.comments}
                        onCheckedChange={(checked) => handleNotificationPrefToggle("comments", checked)}
                        disabled={updateNotificationPreferences.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tickets</div>
                        <div className="text-sm text-muted-foreground">New tickets created or assigned to you</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.tickets}
                        onCheckedChange={(checked) => handleNotificationPrefToggle("tickets", checked)}
                        disabled={updateNotificationPreferences.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Feature Requests</div>
                        <div className="text-sm text-muted-foreground">New feature requests and updates</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.features}
                        onCheckedChange={(checked) => handleNotificationPrefToggle("features", checked)}
                        disabled={updateNotificationPreferences.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Feedback</div>
                        <div className="text-sm text-muted-foreground">New feedback submissions</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.feedback}
                        onCheckedChange={(checked) => handleNotificationPrefToggle("feedback", checked)}
                        disabled={updateNotificationPreferences.isPending}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
