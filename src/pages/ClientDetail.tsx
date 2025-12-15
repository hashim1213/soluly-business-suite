import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  MoreVertical,
  Trash2,
  Plus,
  DollarSign,
  Users,
  FileText,
  Loader2,
  Globe,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCrmClientByDisplayId, useUpdateCrmClient, useDeleteCrmClient } from "@/hooks/useCRM";
import { useContactsByCompany } from "@/hooks/useContacts";
import { useQuotes } from "@/hooks/useQuotes";
import { toast } from "sonner";
import { format } from "date-fns";

const clientStatusStyles: Record<string, string> = {
  active: "bg-emerald-600 text-white",
  inactive: "bg-gray-500 text-white",
  churned: "bg-red-600 text-white",
};

const quoteStatusStyles: Record<string, string> = {
  draft: "bg-slate-500 text-white",
  sent: "bg-blue-600 text-white",
  negotiating: "bg-purple-600 text-white",
  accepted: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
};

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const { navigateOrg } = useOrgNavigation();

  // Data fetching
  const { data: client, isLoading: clientLoading } = useCrmClientByDisplayId(clientId);
  const { data: contacts, isLoading: contactsLoading } = useContactsByCompany(client?.id);
  const { data: allQuotes } = useQuotes();

  // Get quotes for this client
  const clientQuotes = allQuotes?.filter((q) => q.client_id === client?.id) || [];

  // Mutations
  const updateClient = useUpdateCrmClient();
  const deleteClient = useDeleteCrmClient();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    industry: "",
    website: "",
    address: "",
    notes: "",
    status: "active",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Initialize edit data when entering edit mode
  const handleStartEdit = () => {
    if (client) {
      setEditData({
        name: client.name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        contact_phone: client.contact_phone || "",
        industry: client.industry || "",
        website: client.website || "",
        address: client.address || "",
        notes: client.notes || "",
        status: client.status || "active",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!client) return;

    try {
      await updateClient.mutateAsync({
        id: client.id,
        name: editData.name,
        contact_name: editData.contact_name || null,
        contact_email: editData.contact_email || null,
        contact_phone: editData.contact_phone || null,
        industry: editData.industry || null,
        website: editData.website || null,
        address: editData.address || null,
        notes: editData.notes || null,
        status: editData.status as "active" | "inactive" | "churned",
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    try {
      await deleteClient.mutateAsync(client.id);
      navigateOrg("/crm");
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate stats
  const totalRevenue = clientQuotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + (q.value || 0), 0);

  const pipelineValue = clientQuotes
    .filter((q) => q.status !== "accepted" && q.status !== "rejected")
    .reduce((sum, q) => sum + (q.value || 0), 0);

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Client Not Found</h2>
        <p className="text-muted-foreground">
          The client you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigateOrg("/crm")} variant="outline" className="border-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateOrg("/crm")}
            className="border-2 border-transparent hover:border-border"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge className={clientStatusStyles[client.status || "active"]}>
                {client.status || "active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{client.display_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-2"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateClient.isPending}
                className="border-2"
              >
                {updateClient.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="border-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="border-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2">
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-emerald-600">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono">{formatCurrency(totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono">{formatCurrency(pipelineValue)}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">{clientQuotes.length}</div>
                <div className="text-sm text-muted-foreground">Total Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-amber-500">
                <Users className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="text-xl font-bold">{contacts?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Contacts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border bg-secondary">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Contacts ({contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="deals"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Deals ({clientQuotes.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <Card className="border-2">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={editData.industry}
                        onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                        placeholder="e.g., Technology, Healthcare"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="churned">Churned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {client.industry && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{client.industry}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {client.website}
                        </a>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Client since {format(new Date(client.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Primary Contact */}
            <Card className="border-2">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={editData.contact_name}
                        onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editData.contact_email}
                        onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editData.contact_phone}
                        onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {client.contact_name ? (
                      <>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.contact_name}</span>
                        </div>
                        {client.contact_email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">
                              {client.contact_email}
                            </a>
                          </div>
                        )}
                        {client.contact_phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${client.contact_phone}`} className="text-primary hover:underline">
                              {client.contact_phone}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No primary contact set</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-2 md:col-span-2">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this client..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap">
                    {client.notes || "No notes yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {contactsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="border-2 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateOrg(`/contacts/${contact.display_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{contact.name}</h3>
                        {contact.job_title && (
                          <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                        )}
                        {contact.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Contacts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add contacts and link them to this company in the CRM.
                </p>
                <Button onClick={() => navigateOrg("/crm")} variant="outline" className="border-2">
                  Go to CRM
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          {clientQuotes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientQuotes.map((quote) => (
                <Card
                  key={quote.id}
                  className="border-2 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateOrg(`/quotes/${quote.display_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={quoteStatusStyles[quote.status]}>
                            {quote.status}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {quote.display_id}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate">{quote.title}</h3>
                        <p className="text-lg font-mono font-bold mt-2">
                          {formatCurrency(quote.value || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(quote.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Deals Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create deals in the CRM pipeline to track sales for this client.
                </p>
                <Button onClick={() => navigateOrg("/crm")} variant="outline" className="border-2">
                  Go to CRM
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{client.name}"? This action cannot be undone.
              All associated contacts will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
