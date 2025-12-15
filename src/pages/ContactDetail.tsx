import { useState, useEffect } from "react";
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
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  MoreVertical,
  Trash2,
  Plus,
  PhoneCall,
  MessageSquare,
  Users,
  FileText,
  CheckSquare,
  Loader2,
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
  DropdownMenuSeparator,
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
import { useContactByDisplayId, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { useContactActivities, useCreateActivity, useCompleteTask, useDeleteActivity } from "@/hooks/useContactActivities";
import { useContactTags, useTags, useAddContactTag, useRemoveContactTag } from "@/hooks/useTags";
import { useCustomFields, useContactCustomFieldValues, useBulkSetCustomFieldValues } from "@/hooks/useCustomFields";
import { useCrmClients } from "@/hooks/useCRM";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { SocialProfiles, ContactActivityType, CallOutcome, EmailDirection, ActivityTaskPriority } from "@/types/crm";
import { activityTypeStyles, callOutcomeStyles, taskStatusStyles, taskPriorityStyles } from "@/lib/styles";

export default function ContactDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const { navigateOrg } = useOrgNavigation();

  // Data fetching - use display_id for the contact, then use contact.id for related data
  const { data: contact, isLoading: contactLoading } = useContactByDisplayId(contactId);
  const { data: activities, isLoading: activitiesLoading } = useContactActivities(contact?.id);
  const { data: contactTags } = useContactTags(contact?.id);
  const { data: allTags } = useTags();
  const { data: customFields } = useCustomFields();
  const { data: customFieldValues } = useContactCustomFieldValues(contact?.id);
  const { data: clients } = useCrmClients();

  // Mutations
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createActivity = useCreateActivity();
  const completeTask = useCompleteTask();
  const deleteActivity = useDeleteActivity();
  const addContactTag = useAddContactTag();
  const removeContactTag = useRemoveContactTag();
  const bulkSetCustomFieldValues = useBulkSetCustomFieldValues();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    job_title: string;
    company_id: string;
    address: string;
    notes: string;
    social_profiles: SocialProfiles;
  } | null>(null);

  // Dialog states
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState<ContactActivityType>("call");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    call_duration: "",
    call_outcome: "" as CallOutcome | "",
    email_subject: "",
    email_direction: "" as EmailDirection | "",
    meeting_location: "",
    meeting_outcome: "",
    task_due_date: "",
    task_priority: "medium" as ActivityTaskPriority,
  });

  // Custom field values state
  const [customFieldFormValues, setCustomFieldFormValues] = useState<Record<string, unknown>>({});

  // Initialize edit data when contact loads
  useEffect(() => {
    if (contact) {
      setEditData({
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        job_title: contact.job_title || "",
        company_id: contact.company_id || "",
        address: contact.address || "",
        notes: contact.notes || "",
        social_profiles: contact.social_profiles || {},
      });
    }
  }, [contact]);

  // Initialize custom field values
  useEffect(() => {
    if (customFieldValues) {
      const values: Record<string, unknown> = {};
      customFieldValues.forEach((cfv) => {
        values[cfv.field_id] = cfv.value;
      });
      setCustomFieldFormValues(values);
    }
  }, [customFieldValues]);

  const handleSave = async () => {
    if (!editData || !contact) return;

    try {
      await updateContact.mutateAsync({
        id: contact.id,
        name: editData.name,
        email: editData.email || undefined,
        phone: editData.phone || undefined,
        job_title: editData.job_title || undefined,
        company_id: editData.company_id || undefined,
        address: editData.address || undefined,
        notes: editData.notes || undefined,
        social_profiles: editData.social_profiles,
      });

      // Save custom field values
      if (customFields && customFields.length > 0) {
        const valuesToSave = customFields.map((field) => ({
          fieldId: field.id,
          value: customFieldFormValues[field.id] ?? null,
        }));
        await bulkSetCustomFieldValues.mutateAsync({
          contactId: contact.id,
          values: valuesToSave,
        });
      }

      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    try {
      await deleteContact.mutateAsync(contact.id);
      navigateOrg("/crm");
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateActivity = async () => {
    if (!contact) return;

    try {
      await createActivity.mutateAsync({
        contact_id: contact.id,
        activity_type: activityType,
        title: activityForm.title || undefined,
        description: activityForm.description || undefined,
        call_duration: activityForm.call_duration ? parseInt(activityForm.call_duration) * 60 : undefined,
        call_outcome: activityForm.call_outcome || undefined,
        email_subject: activityForm.email_subject || undefined,
        email_direction: activityForm.email_direction || undefined,
        meeting_location: activityForm.meeting_location || undefined,
        meeting_outcome: activityForm.meeting_outcome || undefined,
        task_due_date: activityForm.task_due_date || undefined,
        task_priority: activityForm.task_priority,
      });

      setIsActivityDialogOpen(false);
      setActivityForm({
        title: "",
        description: "",
        call_duration: "",
        call_outcome: "",
        email_subject: "",
        email_direction: "",
        meeting_location: "",
        meeting_outcome: "",
        task_due_date: "",
        task_priority: "medium",
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!contact) return;
    await addContactTag.mutateAsync({ contactId: contact.id, tagId });
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!contact) return;
    await removeContactTag.mutateAsync({ contactId: contact.id, tagId });
  };

  if (contactLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateOrg("/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Contact Not Found</h1>
        </div>
        <p className="text-muted-foreground">The contact you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const currentTagIds = contactTags?.map((ct) => ct.tag_id) || [];
  const availableTags = allTags?.filter((t) => !currentTagIds.includes(t.id)) || [];

  const pendingTasks = activities?.filter(
    (a) => a.activity_type === "task" && a.task_status !== "completed" && a.task_status !== "cancelled"
  ) || [];

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateOrg("/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{contact.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {contact.display_id}
              </Badge>
            </div>
            {contact.job_title && (
              <p className="text-muted-foreground">{contact.job_title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateContact.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateContact.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsActivityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {contactTags?.map((ct) => (
          <Badge
            key={ct.id}
            style={{ backgroundColor: ct.tag?.color, color: "#fff" }}
            className="flex items-center gap-1"
          >
            {ct.tag?.name}
            {isEditing && (
              <button
                onClick={() => handleRemoveTag(ct.tag_id)}
                className="ml-1 hover:bg-white/20 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {isEditing && availableTags.length > 0 && (
          <DropdownMenu open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => {
                    handleAddTag(tag.id);
                    setTagDialogOpen(false);
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">
            Activities {activities && activities.length > 0 && `(${activities.length})`}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks {pendingTasks.length > 0 && `(${pendingTasks.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && editData ? (
                  <>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={editData.job_title}
                        onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Select
                        value={editData.company_id || "none"}
                        onValueChange={(value) => setEditData({ ...editData, company_id: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No company</SelectItem>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
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
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.job_title || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company?.name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.address || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created {format(new Date(contact.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Social Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Social Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && editData ? (
                  <>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </Label>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={editData.social_profiles?.linkedin_url || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            social_profiles: {
                              ...editData.social_profiles,
                              linkedin_url: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </Label>
                      <Input
                        placeholder="https://twitter.com/..."
                        value={editData.social_profiles?.twitter_url || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            social_profiles: {
                              ...editData.social_profiles,
                              twitter_url: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        placeholder="https://facebook.com/..."
                        value={editData.social_profiles?.facebook_url || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            social_profiles: {
                              ...editData.social_profiles,
                              facebook_url: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        placeholder="https://..."
                        value={editData.social_profiles?.website_url || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            social_profiles: {
                              ...editData.social_profiles,
                              website_url: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {contact.social_profiles?.linkedin_url && (
                      <a
                        href={contact.social_profiles.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {contact.social_profiles?.twitter_url && (
                      <a
                        href={contact.social_profiles.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:underline"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </a>
                    )}
                    {contact.social_profiles?.facebook_url && (
                      <a
                        href={contact.social_profiles.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:underline"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    )}
                    {contact.social_profiles?.website_url && (
                      <a
                        href={contact.social_profiles.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {!contact.social_profiles?.linkedin_url &&
                      !contact.social_profiles?.twitter_url &&
                      !contact.social_profiles?.facebook_url &&
                      !contact.social_profiles?.website_url && (
                        <p className="text-muted-foreground">No social profiles added</p>
                      )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && editData ? (
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this contact..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{contact.notes || "No notes added"}</p>
                )}
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {customFields && customFields.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label>{field.name}</Label>
                        {isEditing ? (
                          field.field_type === "boolean" ? (
                            <Select
                              value={customFieldFormValues[field.id]?.toString() || ""}
                              onValueChange={(value) =>
                                setCustomFieldFormValues({
                                  ...customFieldFormValues,
                                  [field.id]: value === "true",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : field.field_type === "select" && field.options ? (
                            <Select
                              value={(customFieldFormValues[field.id] as string) || ""}
                              onValueChange={(value) =>
                                setCustomFieldFormValues({
                                  ...customFieldFormValues,
                                  [field.id]: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options as string[]).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.field_type === "date" ? (
                            <Input
                              type="date"
                              value={(customFieldFormValues[field.id] as string) || ""}
                              onChange={(e) =>
                                setCustomFieldFormValues({
                                  ...customFieldFormValues,
                                  [field.id]: e.target.value,
                                })
                              }
                            />
                          ) : field.field_type === "number" ? (
                            <Input
                              type="number"
                              value={(customFieldFormValues[field.id] as string) || ""}
                              onChange={(e) =>
                                setCustomFieldFormValues({
                                  ...customFieldFormValues,
                                  [field.id]: e.target.value ? parseFloat(e.target.value) : null,
                                })
                              }
                            />
                          ) : (
                            <Input
                              type={field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : "text"}
                              value={(customFieldFormValues[field.id] as string) || ""}
                              onChange={(e) =>
                                setCustomFieldFormValues({
                                  ...customFieldFormValues,
                                  [field.id]: e.target.value,
                                })
                              }
                            />
                          )
                        ) : (
                          <p className="text-sm">
                            {customFieldFormValues[field.id]?.toString() || "-"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Activity Timeline</h3>
            <Button onClick={() => setIsActivityDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${activityTypeStyles[activity.activity_type]}`}>
                          {activity.activity_type === "call" && <PhoneCall className="h-4 w-4" />}
                          {activity.activity_type === "email" && <Mail className="h-4 w-4" />}
                          {activity.activity_type === "meeting" && <Users className="h-4 w-4" />}
                          {activity.activity_type === "note" && <FileText className="h-4 w-4" />}
                          {activity.activity_type === "task" && <CheckSquare className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{activity.activity_type}</span>
                            <span className="text-xs text-muted-foreground">
                              {activity.display_id}
                            </span>
                            {activity.activity_type === "call" && activity.call_outcome && (
                              <Badge className={callOutcomeStyles[activity.call_outcome]}>
                                {activity.call_outcome.replace("_", " ")}
                              </Badge>
                            )}
                            {activity.activity_type === "email" && activity.email_direction && (
                              <Badge variant="outline">{activity.email_direction}</Badge>
                            )}
                            {activity.activity_type === "task" && activity.task_status && (
                              <Badge className={taskStatusStyles[activity.task_status]}>
                                {activity.task_status.replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                          {activity.title && (
                            <p className="font-medium mt-1">{activity.title}</p>
                          )}
                          {activity.email_subject && (
                            <p className="mt-1">Subject: {activity.email_subject}</p>
                          )}
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          )}
                          {activity.activity_type === "call" && activity.call_duration && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Duration: {formatDuration(activity.call_duration)}
                            </p>
                          )}
                          {activity.activity_type === "meeting" && (
                            <>
                              {activity.meeting_location && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Location: {activity.meeting_location}
                                </p>
                              )}
                              {activity.meeting_outcome && (
                                <p className="text-sm text-muted-foreground">
                                  Outcome: {activity.meeting_outcome}
                                </p>
                              )}
                            </>
                          )}
                          {activity.activity_type === "task" && activity.task_due_date && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Due: {format(new Date(activity.task_due_date), "MMM d, yyyy")}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                            {activity.creator && ` by ${activity.creator.name}`}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {activity.activity_type === "task" &&
                            activity.task_status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  completeTask.mutate({
                                    id: activity.id,
                                    contactId: contact.id,
                                  })
                                }
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuItem
                            onClick={() =>
                              deleteActivity.mutate({
                                id: activity.id,
                                contactId: contact.id,
                              })
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No activities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Log your first activity with this contact
                </p>
                <Button onClick={() => setIsActivityDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <Button
              onClick={() => {
                setActivityType("task");
                setIsActivityDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            completeTask.mutate({
                              id: task.id,
                              contactId: contact.id,
                            })
                          }
                          className="p-1 rounded hover:bg-muted"
                        >
                          <CheckSquare className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div>
                          <p className="font-medium">{task.title || task.description || "Untitled task"}</p>
                          {task.task_due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(task.task_due_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.task_priority && (
                          <Badge className={taskPriorityStyles[task.task_priority]}>
                            {task.task_priority}
                          </Badge>
                        )}
                        {task.task_status && (
                          <Badge className={taskStatusStyles[task.task_status]}>
                            {task.task_status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No pending tasks</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a task for this contact
                </p>
                <Button
                  onClick={() => {
                    setActivityType("task");
                    setIsActivityDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={(value) => setActivityType(value as ContactActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="Activity title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            {activityType === "call" && (
              <>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={activityForm.call_duration}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, call_duration: e.target.value })
                    }
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Select
                    value={activityForm.call_outcome}
                    onValueChange={(value) =>
                      setActivityForm({ ...activityForm, call_outcome: value as CallOutcome })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="voicemail">Voicemail</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activityType === "email" && (
              <>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={activityForm.email_subject}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, email_subject: e.target.value })
                    }
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    value={activityForm.email_direction}
                    onValueChange={(value) =>
                      setActivityForm({ ...activityForm, email_direction: value as EmailDirection })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activityType === "meeting" && (
              <>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={activityForm.meeting_location}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, meeting_location: e.target.value })
                    }
                    placeholder="Meeting location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Input
                    value={activityForm.meeting_outcome}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, meeting_outcome: e.target.value })
                    }
                    placeholder="Meeting outcome"
                  />
                </div>
              </>
            )}

            {activityType === "task" && (
              <>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={activityForm.task_due_date}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, task_due_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={activityForm.task_priority}
                    onValueChange={(value) =>
                      setActivityForm({
                        ...activityForm,
                        task_priority: value as ActivityTaskPriority,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateActivity} disabled={createActivity.isPending}>
              {createActivity.isPending ? "Saving..." : "Save Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.name}? This action cannot be undone.
              All activities and tags associated with this contact will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
