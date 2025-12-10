import { useState } from "react";
import { Plus, Lightbulb, ArrowLeft, MapPin, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";

const projectOptions = [
  { id: "prj-1", name: "Acme Corp Website Redesign" },
  { id: "prj-2", name: "TechStart Mobile App" },
  { id: "prj-3", name: "Global Solutions Dashboard" },
  { id: "prj-4", name: "DataFlow Integration Platform" },
  { id: "prj-5", name: "CloudNine API Development" },
];

const initialFeatures = [
  {
    id: "FTR-001",
    title: "Add export functionality to reports",
    description: "Users want to export reports in PDF and Excel formats for offline analysis. This should include custom formatting options and the ability to schedule automated exports.",
    projects: ["prj-1", "prj-3"],
    priority: "high",
    status: "in-review",
    requestedBy: "john@acmecorp.com",
    clientName: "John Smith",
    created: "Dec 8, 2024",
    addedToRoadmap: false,
    notes: "Engineering reviewed - estimated 2 sprints of work.",
  },
  {
    id: "FTR-002",
    title: "Integration with Salesforce CRM",
    description: "Sync customer data automatically between our platform and Salesforce. Need bi-directional sync with conflict resolution.",
    projects: ["prj-1"],
    priority: "low",
    status: "backlog",
    requestedBy: "sarah@acmecorp.com",
    clientName: "Sarah Johnson",
    created: "Dec 7, 2024",
    addedToRoadmap: false,
    notes: "",
  },
  {
    id: "FTR-003",
    title: "Mobile app feature request",
    description: "Native mobile app for iOS and Android with offline capabilities. Should support push notifications and biometric authentication.",
    projects: ["prj-2", "prj-3", "prj-5"],
    priority: "medium",
    status: "planned",
    requestedBy: "mike@techstart.io",
    clientName: "Mike Chen",
    created: "Dec 5, 2024",
    addedToRoadmap: true,
    notes: "Added to Q1 2025 roadmap.",
  },
  {
    id: "FTR-004",
    title: "Advanced analytics dashboard",
    description: "Custom widgets and drag-and-drop dashboard builder. Users should be able to save multiple dashboard layouts.",
    projects: ["prj-3"],
    priority: "medium",
    status: "in-progress",
    requestedBy: "emma@globalsol.com",
    clientName: "Emma Williams",
    created: "Dec 2, 2024",
    addedToRoadmap: true,
    notes: "Currently in development - 60% complete.",
  },
  {
    id: "FTR-005",
    title: "Multi-language support",
    description: "Support for Spanish, French, and German languages. Should include RTL support for future Arabic/Hebrew additions.",
    projects: ["prj-4", "prj-5"],
    priority: "low",
    status: "backlog",
    requestedBy: "david@dataflow.io",
    clientName: "David Brown",
    created: "Nov 28, 2024",
    addedToRoadmap: false,
    notes: "",
  },
];

const priorityStyles: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-chart-4 text-foreground",
  low: "bg-secondary text-secondary-foreground border-2 border-border",
};

const statusStyles: Record<string, string> = {
  backlog: "bg-muted text-muted-foreground",
  planned: "bg-chart-3 text-background",
  "in-review": "bg-chart-4 text-foreground",
  "in-progress": "bg-chart-2 text-background",
  completed: "bg-primary text-primary-foreground",
};

export default function FeatureRequests() {
  const [features, setFeatures] = useState(initialFeatures);
  const [selectedFeature, setSelectedFeature] = useState<typeof initialFeatures[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    projects: [] as string[],
    priority: "",
    requestedBy: "",
    clientName: "",
    notes: "",
  });

  const getProjectNames = (projectIds: string[]) => {
    return projectIds.map(id => projectOptions.find(p => p.id === id)?.name || id).join(", ");
  };

  const handleCreateFeature = () => {
    if (!newFeature.title || newFeature.projects.length === 0 || !newFeature.priority) {
      toast.error("Please fill in all required fields");
      return;
    }

    const featureId = `FTR-${String(features.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const feature = {
      id: featureId,
      title: newFeature.title,
      description: newFeature.description,
      projects: newFeature.projects,
      priority: newFeature.priority,
      status: "backlog",
      requestedBy: newFeature.requestedBy || "Unknown",
      clientName: newFeature.clientName || "Unknown Client",
      created: today,
      addedToRoadmap: false,
      notes: newFeature.notes,
    };

    setFeatures([feature, ...features]);
    setNewFeature({
      title: "",
      description: "",
      projects: [],
      priority: "",
      requestedBy: "",
      clientName: "",
      notes: "",
    });
    setIsDialogOpen(false);
    toast.success("Feature request created successfully");
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setFeatures(features.map(f =>
      f.id === id ? { ...f, status: newStatus } : f
    ));
    if (selectedFeature?.id === id) {
      setSelectedFeature({ ...selectedFeature, status: newStatus });
    }
    toast.success("Status updated");
  };

  const handleAddToRoadmap = (id: string) => {
    setFeatures(features.map(f =>
      f.id === id ? { ...f, addedToRoadmap: true, status: f.status === "backlog" ? "planned" : f.status } : f
    ));
    if (selectedFeature?.id === id) {
      setSelectedFeature({ ...selectedFeature, addedToRoadmap: true, status: selectedFeature.status === "backlog" ? "planned" : selectedFeature.status });
    }
    toast.success("Feature added to project roadmap!");
  };

  const handleRemoveFromRoadmap = (id: string) => {
    setFeatures(features.map(f =>
      f.id === id ? { ...f, addedToRoadmap: false } : f
    ));
    if (selectedFeature?.id === id) {
      setSelectedFeature({ ...selectedFeature, addedToRoadmap: false });
    }
    toast.info("Feature removed from roadmap");
  };

  const handleUpdateNotes = () => {
    if (!selectedFeature) return;
    setFeatures(features.map(f =>
      f.id === selectedFeature.id ? { ...f, notes: selectedFeature.notes } : f
    ));
    setIsEditDialogOpen(false);
    toast.success("Notes updated");
  };

  const handleDeleteFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
    setSelectedFeature(null);
    toast.success("Feature request deleted");
  };

  const toggleProjectSelection = (projectId: string) => {
    setNewFeature(prev => ({
      ...prev,
      projects: prev.projects.includes(projectId)
        ? prev.projects.filter(id => id !== projectId)
        : [...prev.projects, projectId]
    }));
  };

  const roadmapCount = features.filter(f => f.addedToRoadmap).length;
  const inProgressCount = features.filter(f => f.status === "in-progress").length;
  const backlogCount = features.filter(f => f.status === "backlog").length;

  // Detail view
  if (selectedFeature) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedFeature(null)}
            className="border-2 border-transparent hover:border-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feature Requests
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
              <Lightbulb className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-sm text-muted-foreground">{selectedFeature.id}</span>
                <Badge className={statusStyles[selectedFeature.status]}>
                  {selectedFeature.status.replace('-', ' ')}
                </Badge>
                <Badge className={priorityStyles[selectedFeature.priority]}>
                  {selectedFeature.priority} priority
                </Badge>
                {selectedFeature.addedToRoadmap && (
                  <Badge className="bg-chart-2 text-background">
                    <MapPin className="h-3 w-3 mr-1" />
                    On Roadmap
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{selectedFeature.title}</h1>
              <p className="text-muted-foreground mt-1">Requested by {selectedFeature.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectedFeature.addedToRoadmap ? (
              <Button
                className="border-2 bg-chart-2 hover:bg-chart-2/90"
                onClick={() => handleAddToRoadmap(selectedFeature.id)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Add to Roadmap
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-2"
                onClick={() => handleRemoveFromRoadmap(selectedFeature.id)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Remove from Roadmap
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleDeleteFeature(selectedFeature.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Feature Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedFeature.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Applicable Projects</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.projects.map(projectId => {
                    const project = projectOptions.find(p => p.id === projectId);
                    return (
                      <Badge key={projectId} variant="outline" className="text-sm py-1 px-3 border-2">
                        {project?.name || projectId}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  This feature request will be added to the roadmap of all selected projects when approved.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Internal Notes</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-2 border-transparent hover:border-border"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                {selectedFeature.notes ? (
                  <p className="text-muted-foreground">{selectedFeature.notes}</p>
                ) : (
                  <p className="text-muted-foreground italic">No notes added yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["backlog", "in-review", "planned", "in-progress", "completed"].map(status => (
                    <Button
                      key={status}
                      variant={selectedFeature.status === status ? "default" : "outline"}
                      size="sm"
                      className="border-2"
                      onClick={() => handleUpdateStatus(selectedFeature.id, status)}
                    >
                      {status.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Client Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Requested By</div>
                    <div className="font-medium">{selectedFeature.clientName}</div>
                    <div className="text-sm text-muted-foreground">{selectedFeature.requestedBy}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="font-medium capitalize">{selectedFeature.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{selectedFeature.status.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium">{selectedFeature.projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{selectedFeature.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">On Roadmap</span>
                    <span className="font-medium">{selectedFeature.addedToRoadmap ? "Yes" : "No"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Notes Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="border-2">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Edit Notes</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Add internal notes about this feature request..."
                value={selectedFeature.notes}
                onChange={(e) => setSelectedFeature({ ...selectedFeature, notes: e.target.value })}
                className="border-2 min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateNotes} className="border-2">
                Save Notes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Requests</h1>
          <p className="text-muted-foreground">Track and manage customer feature requests across projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[550px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create Feature Request</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="title">Feature Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for the feature"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the feature request"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="border-2"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Applicable Projects * (select all that apply)</Label>
                <div className="border-2 border-border p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  {projectOptions.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={project.id}
                        checked={newFeature.projects.includes(project.id)}
                        onCheckedChange={() => toggleProjectSelection(project.id)}
                      />
                      <label
                        htmlFor={project.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {project.name}
                      </label>
                    </div>
                  ))}
                </div>
                {newFeature.projects.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {newFeature.projects.length} project(s) selected
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={newFeature.priority}
                    onValueChange={(value) => setNewFeature({ ...newFeature, priority: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="John Smith"
                    value={newFeature.clientName}
                    onChange={(e) => setNewFeature({ ...newFeature, clientName: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requestedBy">Client Email</Label>
                <Input
                  id="requestedBy"
                  type="email"
                  placeholder="client@example.com"
                  value={newFeature.requestedBy}
                  onChange={(e) => setNewFeature({ ...newFeature, requestedBy: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any internal notes about this request..."
                  value={newFeature.notes}
                  onChange={(e) => setNewFeature({ ...newFeature, notes: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateFeature} className="border-2">
                Create Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <MapPin className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{roadmapCount}</div>
                <div className="text-sm text-muted-foreground">On Roadmap</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{backlogCount}</div>
                <div className="text-sm text-muted-foreground">In Backlog</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedFeature(feature)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
                  <Lightbulb className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{feature.id}</span>
                        <Badge className={statusStyles[feature.status]}>
                          {feature.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={priorityStyles[feature.priority]}>
                          {feature.priority}
                        </Badge>
                        {feature.addedToRoadmap && (
                          <Badge className="bg-chart-2 text-background">
                            <MapPin className="h-3 w-3 mr-1" />
                            Roadmap
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                    </div>

                    <div className="shrink-0">
                      {!feature.addedToRoadmap && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2 border-chart-2 text-chart-2 hover:bg-chart-2 hover:text-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToRoadmap(feature.id);
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Add to Roadmap
                        </Button>
                      )}
                      {feature.addedToRoadmap && (
                        <div className="flex items-center gap-1 text-chart-2 text-sm font-medium">
                          <Check className="h-4 w-4" />
                          On Roadmap
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                    <span>
                      <strong className="text-foreground">Projects:</strong>{" "}
                      {feature.projects.length} project{feature.projects.length !== 1 ? 's' : ''}
                    </span>
                    <span><strong className="text-foreground">From:</strong> {feature.clientName}</span>
                    <span>{feature.created}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
