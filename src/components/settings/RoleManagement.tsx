import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, roleTemplates, defaultPermissions, Role } from "@/hooks/useRoles";
import { usePermissions } from "@/hooks/usePermissions";
import { useProjects } from "@/hooks/useProjects";
import { Permissions, PERMISSION_LABELS, ACTION_LABELS, Permission, ResourcePermissions } from "@/integrations/supabase/types";
import { Plus, Pencil, Trash2, Shield, Users, Copy, FolderKanban, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type PermissionAction = "view" | "create" | "edit" | "delete";

const RESOURCE_KEYS: (keyof Omit<Permissions, "settings" | "dashboard">)[] = [
  "projects",
  "tickets",
  "team",
  "crm",
  "quotes",
  "features",
  "feedback",
  "emails",
  "financials",
  "expenses",
];

const SETTINGS_ACTIONS = [
  { key: "view", label: "View Settings" },
  { key: "manage_org", label: "Manage Organization" },
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_roles", label: "Manage Roles" },
] as const;

interface RoleFormData {
  name: string;
  description: string;
  permissions: Permissions;
  projectScope: string[] | null; // null = all projects, [] = no projects, [...] = specific projects
}

export function RoleManagement() {
  const { data: roles, isLoading } = useRoles();
  const { data: projects } = useProjects();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const { canManageRoles } = usePermissions();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: defaultPermissions,
    projectScope: null,
  });

  const canManage = canManageRoles();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: defaultPermissions,
      projectScope: null,
    });
  };

  const handleCreateOpen = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEditOpen = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: (role.permissions as Permissions) || defaultPermissions,
      projectScope: role.project_scope || null,
    });
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = roleTemplates[templateKey as keyof typeof roleTemplates];
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        permissions: template.permissions,
        projectScope: (template as any).projectScope ?? null,
      });
    }
  };

  const handlePermissionChange = (
    resource: keyof Permissions,
    action: string,
    value: Permission
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: {
          ...prev.permissions[resource],
          [action]: value,
        },
      },
    }));
  };

  const handleCreate = async () => {
    await createRole.mutateAsync({
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      project_scope: formData.projectScope,
      is_system: false,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingRole) return;
    await updateRole.mutateAsync({
      id: editingRole.id,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      project_scope: formData.projectScope,
    });
    setEditingRole(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteRoleId) return;
    await deleteRole.mutateAsync(deleteRoleId);
    setDeleteRoleId(null);
  };

  const renderPermissionValue = (value: Permission): string => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === "own") return "Own Only";
    return "No";
  };

  const renderPermissionSwitch = (
    resource: keyof Permissions,
    action: string,
    currentValue: Permission
  ) => {
    const isOwn = currentValue === "own";

    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={currentValue === true || currentValue === "own"}
          onCheckedChange={(checked) => {
            handlePermissionChange(resource, action, checked ? true : false);
          }}
          disabled={!canManage}
        />
        {(currentValue === true || isOwn) && action !== "view" && (
          <Button
            variant={isOwn ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              handlePermissionChange(resource, action, isOwn ? true : "own");
            }}
            disabled={!canManage}
          >
            {isOwn ? "Own Only" : "All"}
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Manage roles and permissions for your organization
              </CardDescription>
            </div>
            {canManage && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateOpen}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with custom permissions
                    </DialogDescription>
                  </DialogHeader>
                  <RoleForm
                    formData={formData}
                    setFormData={setFormData}
                    onTemplateSelect={handleTemplateSelect}
                    onPermissionChange={handlePermissionChange}
                    renderPermissionSwitch={renderPermissionSwitch}
                    projects={projects || []}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={createRole.isPending}>
                      {createRole.isPending ? "Creating..." : "Create Role"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles?.map((role) => (
              <Card key={role.id} className="border">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {role.name}
                          {role.is_system && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                          {role.project_scope !== null && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {role.project_scope.length === 0
                                ? "No Projects"
                                : `${role.project_scope.length} Project${role.project_scope.length !== 1 ? "s" : ""}`}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!role.is_system && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteRoleId(role.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-0 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {RESOURCE_KEYS.map((resource) => {
                      const perms = (role.permissions as Permissions)?.[resource] as ResourcePermissions;
                      const hasAccess = perms?.view === true || perms?.view === "own";
                      return (
                        <div
                          key={resource}
                          className={`flex items-center gap-2 p-2 rounded ${
                            hasAccess ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          <span className="font-medium">{PERMISSION_LABELS[resource]}</span>
                          {hasAccess && perms?.create && <Badge variant="outline" className="text-xs">C</Badge>}
                          {hasAccess && perms?.edit && <Badge variant="outline" className="text-xs">E</Badge>}
                          {hasAccess && perms?.delete && <Badge variant="outline" className="text-xs">D</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!roles || roles.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No roles found. Create your first role to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>
              {editingRole?.is_system
                ? "System roles can have their permissions modified but cannot be renamed."
                : "Modify the role name and permissions"}
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            formData={formData}
            setFormData={setFormData}
            onPermissionChange={handlePermissionChange}
            renderPermissionSwitch={renderPermissionSwitch}
            isSystemRole={editingRole?.is_system}
            projects={projects || []}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateRole.isPending}>
              {updateRole.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={(open) => !open && setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
              Team members assigned to this role will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRole.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  display_id: string;
}

interface RoleFormProps {
  formData: RoleFormData;
  setFormData: React.Dispatch<React.SetStateAction<RoleFormData>>;
  onTemplateSelect?: (template: string) => void;
  onPermissionChange: (resource: keyof Permissions, action: string, value: Permission) => void;
  renderPermissionSwitch: (resource: keyof Permissions, action: string, value: Permission) => React.ReactNode;
  isSystemRole?: boolean;
  projects: Project[];
}

function RoleForm({
  formData,
  setFormData,
  onTemplateSelect,
  onPermissionChange,
  renderPermissionSwitch,
  isSystemRole,
  projects,
}: RoleFormProps) {
  const isProjectScoped = formData.projectScope !== null;

  const handleProjectScopeToggle = (enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      projectScope: enabled ? [] : null,
    }));
  };

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    setFormData((prev) => {
      const currentScope = prev.projectScope || [];
      const newScope = checked
        ? [...currentScope, projectId]
        : currentScope.filter((id) => id !== projectId);
      return { ...prev, projectScope: newScope };
    });
  };
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {onTemplateSelect && (
        <div className="space-y-2">
          <Label>Start from Template</Label>
          <Select onValueChange={onTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleTemplates).map(([key, template]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {template.name} - {template.description}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Project Manager"
            disabled={isSystemRole}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this role"
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-2">
        <Label>Permissions</Label>
        <Accordion type="multiple" className="w-full">
          {/* Dashboard - Simple view only */}
          <AccordionItem value="dashboard">
            <AccordionTrigger className="text-sm font-medium">
              Dashboard
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center justify-between py-2">
                <span>View Dashboard</span>
                {renderPermissionSwitch("dashboard", "view", formData.permissions.dashboard.view)}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Resource Permissions */}
          {RESOURCE_KEYS.map((resource) => (
            <AccordionItem key={resource} value={resource}>
              <AccordionTrigger className="text-sm font-medium">
                {PERMISSION_LABELS[resource]}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {(["view", "create", "edit", "delete"] as PermissionAction[]).map((action) => (
                    <div key={action} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="capitalize">{ACTION_LABELS[action]}</span>
                      {renderPermissionSwitch(
                        resource,
                        action,
                        (formData.permissions[resource] as ResourcePermissions)[action]
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Settings Permissions */}
          <AccordionItem value="settings">
            <AccordionTrigger className="text-sm font-medium">
              Settings & Administration
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {SETTINGS_ACTIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span>{label}</span>
                    <Switch
                      checked={formData.permissions.settings[key] === true}
                      onCheckedChange={(checked) => {
                        onPermissionChange("settings", key, checked);
                      }}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Project Scope */}
          <AccordionItem value="project-scope">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Project Access Scope
                {isProjectScoped && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Restricted
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium">Restrict to Specific Projects</span>
                    <p className="text-sm text-muted-foreground">
                      When enabled, users with this role can only access selected projects and their related data
                    </p>
                  </div>
                  <Switch
                    checked={isProjectScoped}
                    onCheckedChange={handleProjectScopeToggle}
                  />
                </div>

                {isProjectScoped && (
                  <div className="border rounded-md p-4 space-y-3">
                    <Label className="text-sm font-medium">Select Allowed Projects</Label>
                    {projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No projects available</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={formData.projectScope?.includes(project.id) || false}
                              onCheckedChange={(checked) => handleProjectToggle(project.id, checked as boolean)}
                            />
                            <label
                              htmlFor={`project-${project.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {project.display_id} - {project.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {isProjectScoped && formData.projectScope?.length === 0 && (
                      <p className="text-sm text-amber-600">
                        No projects selected. Users with this role will not have access to any projects.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
