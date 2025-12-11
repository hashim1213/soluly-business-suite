import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Plus, Lightbulb, MapPin, Edit, Trash2, Check, Loader2, Ticket, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useFeatureRequests, useCreateFeatureRequest, useUpdateFeatureRequest, useDeleteFeatureRequest } from "@/hooks/useFeatureRequests";
import { useTickets, useDeleteTicket } from "@/hooks/useTickets";
import { useProjects } from "@/hooks/useProjects";
import { Database } from "@/integrations/supabase/types";
import { ticketPriorityStyles, featureStatusStyles, ticketStatusStyles } from "@/lib/styles";

type FeaturePriority = Database["public"]["Enums"]["feature_priority"];
type FeatureStatus = Database["public"]["Enums"]["feature_status"];

// Combined status colors for features and tickets
const statusColors: Record<string, string> = {
  // Feature statuses
  backlog: "bg-slate-400 text-black",
  "in-review": "bg-amber-500 text-black",
  planned: "bg-blue-600 text-white",
  "in-progress": "bg-cyan-600 text-white",
  completed: "bg-emerald-600 text-white",
  // Ticket statuses
  ...ticketStatusStyles,
};

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  "in-review": "In Review",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
  // Ticket statuses
  open: "Open",
  pending: "Pending",
  closed: "Closed",
};

// Unified type for both feature requests and tickets
type UnifiedFeature = {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  source: "feature_request" | "ticket";
  client_name: string | null;
  requested_by: string | null;
  added_to_roadmap: boolean;
  created_at: string;
  projects: Array<{ project_id: string; project: { id: string; name: string; display_id: string } | null }>;
  notes: string | null;
};

export default function FeatureRequests() {
  const { navigateOrg } = useOrgNavigation();
  const { data: features, isLoading: featuresLoading, error: featuresError } = useFeatureRequests();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: projects } = useProjects();
  const createFeature = useCreateFeatureRequest();
  const updateFeature = useUpdateFeatureRequest();
  const deleteFeature = useDeleteFeatureRequest();
  const deleteTicket = useDeleteTicket();

  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    priority: "medium" as FeaturePriority,
    requested_by: "",
    client_name: "",
    notes: "",
  });

  const isLoading = featuresLoading || ticketsLoading;

  // Get feature tickets
  const featureTickets = useMemo(() => {
    return tickets?.filter(t => t.category === "feature") || [];
  }, [tickets]);

  // Unify features and tickets into single list
  const unifiedFeatures: UnifiedFeature[] = useMemo(() => {
    const items: UnifiedFeature[] = [];

    // Add feature requests
    features?.forEach((feature) => {
      items.push({
        id: feature.id,
        display_id: feature.display_id,
        title: feature.title,
        description: feature.description,
        priority: feature.priority,
        status: feature.status,
        source: "feature_request",
        client_name: feature.client_name,
        requested_by: feature.requested_by,
        added_to_roadmap: feature.added_to_roadmap,
        created_at: feature.created_at,
        projects: feature.projects,
        notes: feature.notes,
      });
    });

    // Add tickets with category="feature"
    featureTickets.forEach((ticket) => {
      items.push({
        id: ticket.id,
        display_id: ticket.display_id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        source: "ticket",
        client_name: ticket.project?.name || null,
        requested_by: null,
        added_to_roadmap: false,
        created_at: ticket.created_at,
        projects: ticket.project_id && ticket.project ? [{
          project_id: ticket.project_id,
          project: { id: ticket.project_id, name: ticket.project.name, display_id: ticket.project.display_id }
        }] : [],
        notes: null,
      });
    });

    // Sort by created_at descending
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [features, featureTickets]);

  // Filter based on tab
  const filteredFeatures = useMemo(() => {
    if (activeTab === "all") return unifiedFeatures;
    if (activeTab === "feature_requests") return unifiedFeatures.filter(f => f.source === "feature_request");
    if (activeTab === "tickets") return unifiedFeatures.filter(f => f.source === "ticket");
    return unifiedFeatures;
  }, [unifiedFeatures, activeTab]);

  const handleCreateFeature = async () => {
    if (!newFeature.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await createFeature.mutateAsync({
        title: newFeature.title,
        description: newFeature.description || null,
        priority: newFeature.priority,
        requested_by: newFeature.requested_by || null,
        client_name: newFeature.client_name || null,
        notes: newFeature.notes || null,
        projectIds: selectedProjects,
      });

      setNewFeature({
        title: "",
        description: "",
        priority: "medium",
        requested_by: "",
        client_name: "",
        notes: "",
      });
      setSelectedProjects([]);
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateStatus = (feature: UnifiedFeature, status: FeatureStatus) => {
    if (feature.source === "feature_request") {
      updateFeature.mutate({ id: feature.id, status });
    }
    // For tickets, we'd need to navigate to ticket detail or add a ticket update mutation
  };

  const handleToggleRoadmap = (feature: UnifiedFeature) => {
    if (feature.source === "feature_request") {
      updateFeature.mutate({ id: feature.id, added_to_roadmap: !feature.added_to_roadmap });
    }
  };

  const handleDelete = (feature: UnifiedFeature) => {
    if (feature.source === "feature_request") {
      deleteFeature.mutate(feature.id);
    } else {
      deleteTicket.mutate(feature.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (featuresError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load feature requests</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const featureRequestCount = features?.length || 0;
  const ticketCount = featureTickets.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Requests</h1>
          <p className="text-muted-foreground">Track and prioritize customer feature requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>New Feature Request</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Feature request title"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the feature in detail..."
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={newFeature.priority} onValueChange={(value: FeaturePriority) => setNewFeature({ ...newFeature, priority: value })}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    placeholder="Client name"
                    value={newFeature.client_name}
                    onChange={(e) => setNewFeature({ ...newFeature, client_name: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requested_by">Requested By (email)</Label>
                <Input
                  id="requested_by"
                  placeholder="customer@example.com"
                  value={newFeature.requested_by}
                  onChange={(e) => setNewFeature({ ...newFeature, requested_by: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Related Projects</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border-2 rounded p-2">
                  {projects?.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <label htmlFor={project.id} className="text-sm cursor-pointer">{project.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes..."
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
              <Button onClick={handleCreateFeature} className="border-2" disabled={createFeature.isPending}>
                {createFeature.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All ({unifiedFeatures.length})
          </TabsTrigger>
          <TabsTrigger value="feature_requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lightbulb className="h-4 w-4 mr-1" />
            Feature Requests ({featureRequestCount})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Ticket className="h-4 w-4 mr-1" />
            From Tickets ({ticketCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredFeatures.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No feature requests yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeatures.map((feature) => (
            <Card
              key={`${feature.source}-${feature.id}`}
              className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (feature.source === "ticket") {
                  navigateOrg(`/tickets/${feature.display_id}`);
                } else {
                  navigateOrg(`/features/${feature.display_id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${feature.source === "ticket" ? "bg-blue-600" : "bg-amber-500"}`}>
                      {feature.source === "ticket" ? (
                        <Ticket className="h-5 w-5 text-white" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-black" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{feature.display_id}</span>
                        {feature.source === "ticket" && (
                          <Badge variant="outline" className="border-2 text-xs">
                            <Ticket className="h-3 w-3 mr-1" />
                            Ticket
                          </Badge>
                        )}
                        <Badge className={ticketPriorityStyles[feature.priority as keyof typeof ticketPriorityStyles] || "bg-slate-400 text-black"}>
                          {feature.priority}
                        </Badge>
                        <Badge className={statusColors[feature.status] || statusColors.backlog}>
                          {statusLabels[feature.status] || feature.status}
                        </Badge>
                        {feature.added_to_roadmap && (
                          <Badge variant="outline" className="border-2 gap-1">
                            <MapPin className="h-3 w-3" />
                            Roadmap
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {feature.client_name && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {feature.client_name}
                          </span>
                        )}
                        {feature.requested_by && (
                          <span>From: {feature.requested_by}</span>
                        )}
                        <span>{formatDate(feature.created_at)}</span>
                      </div>
                      {feature.projects.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {feature.projects.map((p) => (
                            <Badge key={p.project_id} variant="outline" className="border text-xs">
                              {p.project?.name || p.project_id}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {feature.notes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">Notes:</span> {feature.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {feature.source === "feature_request" && (
                      <>
                        <Button
                          variant={feature.added_to_roadmap ? "default" : "outline"}
                          size="sm"
                          className="border-2"
                          onClick={() => handleToggleRoadmap(feature)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          {feature.added_to_roadmap ? "On Roadmap" : "Add to Roadmap"}
                        </Button>
                        <Select
                          value={feature.status}
                          onValueChange={(value: FeatureStatus) => handleUpdateStatus(feature, value)}
                        >
                          <SelectTrigger className="w-[130px] border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-2">
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="in-review">In Review</SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(feature)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
