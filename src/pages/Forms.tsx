import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  Plus,
  ClipboardList,
  Search,
  FileText,
  Users,
  BarChart3,
  Calendar,
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useForms,
  useCreateForm,
  useDeleteForm,
  useUpdateForm,
  FormStatus,
} from "@/hooks/useForms";
import { useProjects } from "@/hooks/useProjects";
import { formStatusStyles } from "@/lib/styles";
import { format } from "date-fns";

const statusLabels: Record<FormStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export default function Forms() {
  const { navigateOrg } = useOrgNavigation();
  const { data: forms, isLoading, error } = useForms();
  const { data: projects } = useProjects();
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const updateForm = useUpdateForm();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    description: "",
    project_ids: [] as string[],
  });

  // Filter forms
  const filteredForms = useMemo(() => {
    if (!forms) return [];

    return forms.filter((form) => {
      const matchesSearch =
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || form.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [forms, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!forms) return { draft: 0, published: 0, closed: 0, totalResponses: 0 };

    return {
      draft: forms.filter((f) => f.status === "draft").length,
      published: forms.filter((f) => f.status === "published").length,
      closed: forms.filter((f) => f.status === "closed").length,
      totalResponses: forms.reduce((sum, f) => sum + f.response_count, 0),
    };
  }, [forms]);

  const handleCreateForm = async () => {
    if (!newForm.title.trim()) {
      toast.error("Please enter a form title");
      return;
    }

    try {
      const form = await createForm.mutateAsync({
        title: newForm.title,
        description: newForm.description || null,
        project_ids: newForm.project_ids.length > 0 ? newForm.project_ids : undefined,
      });

      setNewForm({ title: "", description: "", project_ids: [] });
      setIsCreateDialogOpen(false);

      // Navigate to form builder
      navigateOrg(`forms/${form.display_id}`);
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form? All responses will be lost.")) {
      return;
    }

    try {
      await deleteForm.mutateAsync(id);
    } catch {
      // Error handled by hook
    }
  };

  const handleArchiveForm = async (id: string) => {
    try {
      await updateForm.mutateAsync({
        id,
        updates: { status: "archived" },
      });
      toast.success("Form archived");
    } catch {
      // Error handled by hook
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading forms: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage custom forms for collecting feedback
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 border-border">
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-2 border-border">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title *</Label>
                <Input
                  id="title"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="Customer Feedback Survey"
                  className="border-2 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Optional description for your form..."
                  className="border-2 border-border min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Link to Projects (Optional)</Label>
                <Select
                  value={newForm.project_ids[0] || "none"}
                  onValueChange={(value) =>
                    setNewForm({
                      ...newForm,
                      project_ids: value === "none" ? [] : [value],
                    })
                  }
                >
                  <SelectTrigger className="border-2 border-border">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project (global form)</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Forms linked to projects will only be visible to team members with access to that project.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-2 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateForm}
                disabled={createForm.isPending}
                className="border-2 border-border"
              >
                {createForm.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Form"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Forms in progress</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <ExternalLink className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Accepting responses</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">No longer accepting</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">Across all forms</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-2 border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] border-2 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Forms Table */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No forms yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first form to start collecting feedback
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="border-2 border-border">
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border">
                    <TableHead className="font-bold">Form</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold hidden sm:table-cell">Responses</TableHead>
                    <TableHead className="font-bold hidden md:table-cell">Projects</TableHead>
                    <TableHead className="font-bold hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow
                      key={form.id}
                      className="border-b border-border cursor-pointer hover:bg-accent/50"
                      onClick={() => navigateOrg(`forms/${form.display_id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg hidden sm:block">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{form.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {form.display_id}
                            </div>
                            <div className="flex items-center gap-2 sm:hidden mt-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{form.response_count} responses</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={formStatusStyles[form.status]}>
                          {statusLabels[form.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{form.response_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {form.projects && form.projects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {form.projects.slice(0, 2).map((project) => (
                              <Badge
                                key={project.id}
                                variant="outline"
                                className="text-xs border-2"
                              >
                                {project.name}
                              </Badge>
                            ))}
                            {form.projects.length > 2 && (
                              <Badge variant="outline" className="text-xs border-2">
                                +{form.projects.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Global</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(form.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-2 border-border">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateOrg(`forms/${form.display_id}`);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Form
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateOrg(`forms/${form.display_id}/responses`);
                            }}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Responses
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(form.display_id);
                              toast.success("Form ID copied");
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveForm(form.id);
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteForm(form.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
