import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { ArrowLeft, Lightbulb, Building, Calendar, Loader2, Trash2, MapPin, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFeatureRequestByDisplayId, useUpdateFeatureRequest, useDeleteFeatureRequest } from "@/hooks/useFeatureRequests";
import { Database } from "@/integrations/supabase/types";
import { ticketPriorityStyles, featureStatusStyles } from "@/lib/styles";

type FeatureStatus = Database["public"]["Enums"]["feature_status"];
type FeaturePriority = Database["public"]["Enums"]["feature_priority"];

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  "in-review": "In Review",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
  submitted: "Submitted",
  under_review: "Under Review",
  rejected: "Rejected",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function FeatureRequestDetail() {
  const { featureId } = useParams<{ featureId: string }>();
  const { navigateOrg } = useOrgNavigation();
  const { data: feature, isLoading, error } = useFeatureRequestByDisplayId(featureId);
  const updateFeature = useUpdateFeatureRequest();
  const deleteFeature = useDeleteFeatureRequest();

  const handleStatusChange = (newStatus: FeatureStatus) => {
    if (feature) {
      updateFeature.mutate({ id: feature.id, status: newStatus, projectIds: feature.projects?.map(p => p.project_id) || [] });
    }
  };

  const handlePriorityChange = (newPriority: FeaturePriority) => {
    if (feature) {
      updateFeature.mutate({ id: feature.id, priority: newPriority, projectIds: feature.projects?.map(p => p.project_id) || [] });
    }
  };

  const handleRoadmapToggle = () => {
    if (feature) {
      updateFeature.mutate({
        id: feature.id,
        added_to_roadmap: !feature.added_to_roadmap,
        projectIds: feature.projects?.map(p => p.project_id) || []
      });
    }
  };

  const handleDelete = () => {
    if (feature) {
      deleteFeature.mutate(feature.id, {
        onSuccess: () => {
          navigateOrg("/tickets/features");
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets/features")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Feature Requests
        </Button>
        <Card className="border-2 border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Feature request not found</p>
            <Button variant="outline" onClick={() => navigateOrg("/tickets/features")}>
              Return to Feature Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigateOrg("/tickets/features")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{feature.display_id}</span>
              <Badge className={featureStatusStyles[feature.status as keyof typeof featureStatusStyles] || "bg-slate-400 text-black"}>
                {statusLabels[feature.status] || feature.status}
              </Badge>
              <Badge className={ticketPriorityStyles[feature.priority as keyof typeof ticketPriorityStyles] || "bg-slate-400 text-black"}>
                {priorityLabels[feature.priority] || feature.priority}
              </Badge>
              {feature.added_to_roadmap && (
                <Badge variant="outline" className="border-2 gap-1">
                  <MapPin className="h-3 w-3" />
                  Roadmap
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{feature.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={feature.added_to_roadmap ? "default" : "outline"}
            size="sm"
            className="border-2 gap-1"
            onClick={handleRoadmapToggle}
          >
            <MapPin className="h-4 w-4" />
            {feature.added_to_roadmap ? "On Roadmap" : "Add to Roadmap"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="border-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-2">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Feature Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this feature request? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {feature.description ? (
                <p className="text-foreground whitespace-pre-wrap">{feature.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {feature.notes && (
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="text-lg font-bold uppercase tracking-wider">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-foreground whitespace-pre-wrap">{feature.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Associated Projects */}
          {feature.projects && feature.projects.length > 0 && (
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle className="text-lg font-bold uppercase tracking-wider">Associated Projects</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {feature.projects.map((p) => (
                    <div
                      key={p.project_id}
                      className="flex items-center gap-3 p-3 border-2 border-border rounded cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigateOrg(`/projects/${p.project?.display_id}`)}
                    >
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{p.project?.name || p.project_id}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Select value={feature.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full border-2">
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
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Priority</p>
                <Select value={feature.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {feature.client_name && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{feature.client_name}</span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {feature.requested_by && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested By</p>
                    <p className="mt-1 font-medium">{feature.requested_by}</p>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <div className="flex items-center gap-2 mt-1">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <span>{feature.source === "ticket" ? "From Ticket" : "Direct Request"}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(feature.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
