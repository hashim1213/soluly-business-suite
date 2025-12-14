import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Link,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  Type,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Star,
  Sliders,
  Calendar,
  Mail,
  Hash,
  ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  useFormByDisplayId,
  useUpdateForm,
  usePublishForm,
  useUnpublishForm,
  FormSettings,
} from "@/hooks/useForms";
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  useDuplicateFormField,
  FormField,
  FormFieldType,
  FieldOption,
  FIELD_TYPE_CONFIG,
} from "@/hooks/useFormFields";
import {
  useFormLinks,
  useCreateFormLink,
  useDeactivateFormLink,
  getFormPublicUrl,
} from "@/hooks/useFormLinks";
import { formStatusStyles } from "@/lib/styles";
import { format } from "date-fns";

// Icon mapping for field types
const fieldTypeIcons: Record<FormFieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: AlignLeft,
  select: ChevronDown,
  multiselect: CheckSquare,
  radio: Circle,
  checkbox: CheckSquare,
  rating: Star,
  scale: Sliders,
  date: Calendar,
  email: Mail,
  number: Hash,
  yes_no: ToggleLeft,
};

export default function FormBuilder() {
  const { displayId } = useParams<{ displayId: string }>();
  const { navigateOrg } = useOrgNavigation();
  const { data: form, isLoading: formLoading, error: formError } = useFormByDisplayId(displayId);
  const { data: fields, isLoading: fieldsLoading } = useFormFields(form?.id);
  const { data: links } = useFormLinks(form?.id);

  const updateForm = useUpdateForm();
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const createField = useCreateFormField();
  const updateField = useUpdateFormField();
  const deleteField = useDeleteFormField();
  const duplicateField = useDuplicateFormField();
  const createLink = useCreateFormLink();
  const deactivateLink = useDeactivateFormLink();

  const [activeTab, setActiveTab] = useState("fields");
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [newFieldType, setNewFieldType] = useState<FormFieldType>("text");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSettings, setFormSettings] = useState<FormSettings>({
    allow_anonymous: true,
    allow_multiple: false,
    show_progress: true,
    thank_you_message: "Thank you for your response!",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New link state
  const [newLink, setNewLink] = useState({
    link_type: "public" as "public" | "personal",
    recipient_name: "",
    recipient_email: "",
    recipient_company: "",
  });

  // Sync form data
  useEffect(() => {
    if (form) {
      setFormTitle(form.title);
      setFormDescription(form.description || "");
      setFormSettings(form.settings);
    }
  }, [form]);

  const handleSaveForm = async () => {
    if (!form) return;

    try {
      await updateForm.mutateAsync({
        id: form.id,
        updates: {
          title: formTitle,
          description: formDescription || null,
          settings: formSettings,
        },
      });
      setHasUnsavedChanges(false);
    } catch {
      // Error handled by hook
    }
  };

  const handlePublish = async () => {
    if (!form) return;

    // Check if form has at least one field
    if (!fields || fields.length === 0) {
      toast.error("Please add at least one field before publishing");
      return;
    }

    try {
      await publishForm.mutateAsync(form.id);
    } catch {
      // Error handled by hook
    }
  };

  const handleUnpublish = async () => {
    if (!form) return;

    try {
      await unpublishForm.mutateAsync(form.id);
    } catch {
      // Error handled by hook
    }
  };

  const handleAddField = async () => {
    if (!form) return;

    try {
      await createField.mutateAsync({
        form_id: form.id,
        field_type: newFieldType,
        label: `New ${FIELD_TYPE_CONFIG[newFieldType].label} Field`,
        required: false,
        options: FIELD_TYPE_CONFIG[newFieldType].hasOptions
          ? [
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ]
          : null,
        validation: FIELD_TYPE_CONFIG[newFieldType].defaultValidation || null,
      });
      setIsFieldDialogOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleUpdateField = async (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return;

    try {
      await updateField.mutateAsync({
        id: fieldId,
        formId: form.id,
        updates,
      });
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!form) return;

    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      await deleteField.mutateAsync({ id: fieldId, formId: form.id });
      setEditingField(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleDuplicateField = async (fieldId: string) => {
    if (!form) return;

    try {
      await duplicateField.mutateAsync({ id: fieldId, formId: form.id });
    } catch {
      // Error handled by hook
    }
  };

  const handleCreateLink = async () => {
    if (!form) return;

    try {
      await createLink.mutateAsync({
        form_id: form.id,
        link_type: newLink.link_type,
        recipient_name: newLink.recipient_name || null,
        recipient_email: newLink.recipient_email || null,
        recipient_company: newLink.recipient_company || null,
      });
      setNewLink({
        link_type: "public",
        recipient_name: "",
        recipient_email: "",
        recipient_company: "",
      });
      setIsLinkDialogOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleCopyLink = (token: string) => {
    const url = getFormPublicUrl(token);
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const isLoading = formLoading || fieldsLoading;

  if (formError) {
    return (
      <div className="p-8">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading form: {formError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeLinks = links?.filter((l) => l.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateOrg("forms")}
                className="border-2 border-border"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{form.title}</h1>
                  <Badge className={formStatusStyles[form.status]}>
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Badge>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Unsaved changes
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{form.display_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigateOrg(`forms/${displayId}/responses`)}
                className="border-2 border-border"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Responses ({form.response_count})
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveForm}
                disabled={updateForm.isPending || !hasUnsavedChanges}
                className="border-2 border-border"
              >
                {updateForm.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>

              {form.status === "draft" ? (
                <Button
                  onClick={handlePublish}
                  disabled={publishForm.isPending}
                  className="border-2 border-border bg-emerald-600 hover:bg-emerald-700"
                >
                  {publishForm.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Publish
                </Button>
              ) : form.status === "published" ? (
                <Button
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={unpublishForm.isPending}
                  className="border-2 border-border"
                >
                  {unpublishForm.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Close Form
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-2 border-border">
            <TabsTrigger value="fields" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Fields
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Settings
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Links ({activeLinks.length})
            </TabsTrigger>
          </TabsList>

          {/* Fields Tab */}
          <TabsContent value="fields" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Field List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Form Fields</h2>
                  <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="border-2 border-border">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-2 border-border">
                      <DialogHeader>
                        <DialogTitle>Add New Field</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-3 py-4">
                        {(Object.keys(FIELD_TYPE_CONFIG) as FormFieldType[]).map((type) => {
                          const config = FIELD_TYPE_CONFIG[type];
                          const Icon = fieldTypeIcons[type];
                          return (
                            <Card
                              key={type}
                              className={`cursor-pointer border-2 transition-all ${
                                newFieldType === type
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => setNewFieldType(type)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-muted rounded">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-sm">{config.label}</span>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleAddField}
                          disabled={createField.isPending}
                          className="border-2 border-border"
                        >
                          {createField.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Add Field
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {fields && fields.length > 0 ? (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const Icon = fieldTypeIcons[field.field_type];
                      return (
                        <Card
                          key={field.id}
                          className={`border-2 cursor-pointer transition-all ${
                            editingField?.id === field.id
                              ? "border-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setEditingField(field)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="cursor-grab p-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="p-2 bg-muted rounded">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{field.label}</span>
                                  {field.required && (
                                    <Badge variant="outline" className="text-xs border-red-200 text-red-600">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {FIELD_TYPE_CONFIG[field.field_type].label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateField(field.id);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteField(field.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-border">
                    <CardContent className="py-12 text-center">
                      <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No fields yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add fields to build your form
                      </p>
                      <Button onClick={() => setIsFieldDialogOpen(true)} className="border-2 border-border">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Field
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Field Editor */}
              <div>
                {editingField ? (
                  <FieldEditor
                    field={editingField}
                    onUpdate={(updates) => handleUpdateField(editingField.id, updates)}
                    onClose={() => setEditingField(null)}
                  />
                ) : (
                  <Card className="border-2 border-border">
                    <CardContent className="py-12 text-center">
                      <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Select a field to edit its properties
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card className="border-2 border-border max-w-2xl">
              <CardHeader>
                <CardTitle>Form Settings</CardTitle>
                <CardDescription>
                  Configure how your form behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Form Title</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="border-2 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => {
                      setFormDescription(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="border-2 border-border min-h-[100px]"
                    placeholder="Describe what this form is for..."
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Submission Settings</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow anonymous submissions</Label>
                      <p className="text-sm text-muted-foreground">
                        Respondents don't need to provide their name/email
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.allow_anonymous}
                      onCheckedChange={(checked) => {
                        setFormSettings({ ...formSettings, allow_anonymous: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow multiple submissions</Label>
                      <p className="text-sm text-muted-foreground">
                        Same person can submit multiple times
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.allow_multiple}
                      onCheckedChange={(checked) => {
                        setFormSettings({ ...formSettings, allow_multiple: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show progress indicator</Label>
                      <p className="text-sm text-muted-foreground">
                        Display progress bar during submission
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.show_progress}
                      onCheckedChange={(checked) => {
                        setFormSettings({ ...formSettings, show_progress: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="thank_you">Thank You Message</Label>
                  <Textarea
                    id="thank_you"
                    value={formSettings.thank_you_message}
                    onChange={(e) => {
                      setFormSettings({ ...formSettings, thank_you_message: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="border-2 border-border"
                    placeholder="Message shown after submission..."
                  />
                </div>

                <Button
                  onClick={handleSaveForm}
                  disabled={updateForm.isPending || !hasUnsavedChanges}
                  className="border-2 border-border"
                >
                  {updateForm.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Form Links</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate and manage shareable links for your form
                  </p>
                </div>
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="border-2 border-border" disabled={form.status !== "published"}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] border-2 border-border">
                    <DialogHeader>
                      <DialogTitle>Generate Form Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Link Type</Label>
                        <Select
                          value={newLink.link_type}
                          onValueChange={(value: "public" | "personal") =>
                            setNewLink({ ...newLink, link_type: value })
                          }
                        >
                          <SelectTrigger className="border-2 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public Link</SelectItem>
                            <SelectItem value="personal">Personal Link</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {newLink.link_type === "public"
                            ? "Anyone with this link can submit"
                            : "Track responses by individual recipient"}
                        </p>
                      </div>

                      {newLink.link_type === "personal" && (
                        <>
                          <div className="space-y-2">
                            <Label>Recipient Name</Label>
                            <Input
                              value={newLink.recipient_name}
                              onChange={(e) =>
                                setNewLink({ ...newLink, recipient_name: e.target.value })
                              }
                              placeholder="John Smith"
                              className="border-2 border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Recipient Email</Label>
                            <Input
                              type="email"
                              value={newLink.recipient_email}
                              onChange={(e) =>
                                setNewLink({ ...newLink, recipient_email: e.target.value })
                              }
                              placeholder="john@example.com"
                              className="border-2 border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              value={newLink.recipient_company}
                              onChange={(e) =>
                                setNewLink({ ...newLink, recipient_company: e.target.value })
                              }
                              placeholder="Acme Inc."
                              className="border-2 border-border"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateLink}
                        disabled={createLink.isPending}
                        className="border-2 border-border"
                      >
                        {createLink.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Link className="mr-2 h-4 w-4" />
                        )}
                        Generate Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {form.status !== "published" && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>Publish your form to generate shareable links</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {links && links.length > 0 ? (
                <div className="space-y-3">
                  {links.map((link) => (
                    <Card key={link.id} className="border-2 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={link.link_type === "public" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {link.link_type === "public" ? "Public" : "Personal"}
                              </Badge>
                              {!link.is_active && (
                                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                  Inactive
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {link.response_count} responses
                              </span>
                            </div>
                            {link.link_type === "personal" && (
                              <div className="text-sm">
                                {link.recipient_name && <span className="font-medium">{link.recipient_name}</span>}
                                {link.recipient_email && (
                                  <span className="text-muted-foreground ml-1">
                                    ({link.recipient_email})
                                  </span>
                                )}
                                {link.recipient_company && (
                                  <span className="text-muted-foreground ml-1">
                                    @ {link.recipient_company}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="font-mono text-xs text-muted-foreground mt-1">
                              {getFormPublicUrl(link.token)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(link.token)}
                              className="border-2 border-border"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getFormPublicUrl(link.token), "_blank")}
                              className="border-2 border-border"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {link.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  deactivateLink.mutate({ id: link.id, formId: form.id })
                                }
                                className="border-2 border-border text-red-600"
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                form.status === "published" && (
                  <Card className="border-2 border-dashed border-border">
                    <CardContent className="py-12 text-center">
                      <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No links generated yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create links to share your form with respondents
                      </p>
                      <Button onClick={() => setIsLinkDialogOpen(true)} className="border-2 border-border">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate First Link
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Field Editor Component
function FieldEditor({
  field,
  onUpdate,
  onClose,
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(field.label);
  const [description, setDescription] = useState(field.description || "");
  const [placeholder, setPlaceholder] = useState(field.placeholder || "");
  const [required, setRequired] = useState(field.required);
  const [options, setOptions] = useState<FieldOption[]>(field.options || []);

  useEffect(() => {
    setLabel(field.label);
    setDescription(field.description || "");
    setPlaceholder(field.placeholder || "");
    setRequired(field.required);
    setOptions(field.options || []);
  }, [field]);

  const handleSave = () => {
    onUpdate({
      label,
      description: description || null,
      placeholder: placeholder || null,
      required,
      options: FIELD_TYPE_CONFIG[field.field_type].hasOptions ? options : null,
    });
  };

  const hasOptions = FIELD_TYPE_CONFIG[field.field_type].hasOptions;

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Field</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            className="border-2 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Help text for respondents..."
            className="border-2 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            onBlur={handleSave}
            placeholder="Placeholder text..."
            className="border-2 border-border"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Required</Label>
          <Switch
            checked={required}
            onCheckedChange={(checked) => {
              setRequired(checked);
              onUpdate({ required: checked });
            }}
          />
        </div>

        {hasOptions && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = {
                        ...option,
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      };
                      setOptions(newOptions);
                    }}
                    onBlur={handleSave}
                    className="border-2 border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => {
                      const newOptions = options.filter((_, i) => i !== index);
                      setOptions(newOptions);
                      onUpdate({ options: newOptions });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOption = {
                    value: `option${options.length + 1}`,
                    label: `Option ${options.length + 1}`,
                  };
                  const newOptions = [...options, newOption];
                  setOptions(newOptions);
                  onUpdate({ options: newOptions });
                }}
                className="border-2 border-border w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
