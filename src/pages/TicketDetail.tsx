import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Edit, Lightbulb, FileText, MessageSquare, Send, MoreVertical, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - in a real app this would come from API/state management
const ticketsData: Record<string, {
  id: string;
  title: string;
  description: string;
  category: string;
  project: string;
  projectId: string;
  priority: string;
  status: string;
  assignee: string;
  reporter: string;
  created: string;
  updated: string;
  comments: Array<{ id: string; author: string; content: string; timestamp: string }>;
}> = {
  "TKT-001": {
    id: "TKT-001",
    title: "Add export functionality to reports",
    description: "We need the ability to export reports in multiple formats including PDF, CSV, and Excel. This should include all data from the dashboard analytics section and custom date range selection for the export.",
    category: "feature",
    project: "Acme Corp",
    projectId: "PRJ-001",
    priority: "high",
    status: "open",
    assignee: "You",
    reporter: "John Smith",
    created: "Dec 8, 2024",
    updated: "Dec 9, 2024",
    comments: [
      { id: "1", author: "John Smith", content: "This is critical for our quarterly reporting process.", timestamp: "Dec 8, 2024 10:30 AM" },
      { id: "2", author: "You", content: "I'll start working on this. Should have initial implementation ready by end of week.", timestamp: "Dec 8, 2024 2:15 PM" },
    ],
  },
  "TKT-002": {
    id: "TKT-002",
    title: "Quote request for enterprise package",
    description: "TechStart Inc is interested in our enterprise package. They need a detailed quote including all features, support levels, and implementation timeline.",
    category: "quote",
    project: "TechStart Inc",
    projectId: "PRJ-002",
    priority: "medium",
    status: "in-progress",
    assignee: "You",
    reporter: "Sarah Johnson",
    created: "Dec 8, 2024",
    updated: "Dec 8, 2024",
    comments: [
      { id: "1", author: "Sarah Johnson", content: "Looking for a quote that includes 24/7 support and custom integrations.", timestamp: "Dec 8, 2024 9:00 AM" },
    ],
  },
  "TKT-003": {
    id: "TKT-003",
    title: "Dashboard loading speed issue",
    description: "Users are reporting that the main dashboard takes over 10 seconds to load. This needs to be investigated and optimized.",
    category: "feedback",
    project: "Global Solutions",
    projectId: "PRJ-003",
    priority: "high",
    status: "open",
    assignee: "You",
    reporter: "Mike Chen",
    created: "Dec 7, 2024",
    updated: "Dec 7, 2024",
    comments: [],
  },
  "TKT-004": {
    id: "TKT-004",
    title: "Integration with Salesforce CRM",
    description: "Request to integrate our system with Salesforce CRM for automatic data sync between platforms.",
    category: "feature",
    project: "Acme Corp",
    projectId: "PRJ-001",
    priority: "low",
    status: "open",
    assignee: "You",
    reporter: "John Smith",
    created: "Dec 7, 2024",
    updated: "Dec 7, 2024",
    comments: [],
  },
  "TKT-005": {
    id: "TKT-005",
    title: "Annual contract renewal discussion",
    description: "Annual contract is up for renewal. Need to discuss terms and any changes to the service level agreement.",
    category: "quote",
    project: "DataFlow Ltd",
    projectId: "PRJ-004",
    priority: "medium",
    status: "pending",
    assignee: "You",
    reporter: "Emma Wilson",
    created: "Dec 6, 2024",
    updated: "Dec 6, 2024",
    comments: [],
  },
  "TKT-006": {
    id: "TKT-006",
    title: "Mobile app feature request",
    description: "Request for a mobile application that allows basic functionality like viewing dashboards and approving requests.",
    category: "feature",
    project: "TechStart Inc",
    projectId: "PRJ-002",
    priority: "medium",
    status: "open",
    assignee: "You",
    reporter: "Sarah Johnson",
    created: "Dec 5, 2024",
    updated: "Dec 5, 2024",
    comments: [],
  },
  "TKT-007": {
    id: "TKT-007",
    title: "Positive feedback on new UI",
    description: "Team loves the new user interface redesign. Great job on the improved navigation and cleaner look.",
    category: "feedback",
    project: "Global Solutions",
    projectId: "PRJ-003",
    priority: "low",
    status: "closed",
    assignee: "You",
    reporter: "Mike Chen",
    created: "Dec 4, 2024",
    updated: "Dec 4, 2024",
    comments: [
      { id: "1", author: "Mike Chen", content: "The team is very happy with the changes!", timestamp: "Dec 4, 2024 11:00 AM" },
    ],
  },
  "TKT-008": {
    id: "TKT-008",
    title: "Extended support package quote",
    description: "Acme Corp is interested in upgrading to our extended support package with 24/7 coverage.",
    category: "quote",
    project: "Acme Corp",
    projectId: "PRJ-001",
    priority: "high",
    status: "in-progress",
    assignee: "You",
    reporter: "John Smith",
    created: "Dec 3, 2024",
    updated: "Dec 5, 2024",
    comments: [],
  },
};

const categoryIcons = {
  feature: Lightbulb,
  quote: FileText,
  feedback: MessageSquare,
};

const categoryLabels = {
  feature: "Feature Request",
  quote: "Customer Quote",
  feedback: "Feedback",
};

const priorityStyles = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-chart-4 text-foreground",
  low: "bg-secondary text-secondary-foreground border-2 border-border",
};

const statusStyles = {
  open: "bg-chart-1 text-background",
  "in-progress": "bg-chart-2 text-background",
  pending: "bg-chart-4 text-foreground",
  closed: "bg-muted text-muted-foreground",
};

export default function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");

  const ticket = ticketsData[ticketId || ""];

  // Initialize status and priority from ticket data
  if (ticket && !status) {
    setStatus(ticket.status);
  }
  if (ticket && !priority) {
    setPriority(ticket.priority);
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/tickets")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground">The ticket you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons];

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, this would call an API
      console.log("Adding comment:", newComment);
      setNewComment("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/tickets")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CategoryIcon className="h-4 w-4" />
              <span className="text-sm">{categoryLabels[ticket.category as keyof typeof categoryLabels]}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span
              className="hover:text-foreground cursor-pointer"
              onClick={() => navigate(`/projects/${ticket.projectId}`)}
            >
              Project: <strong className="text-foreground">{ticket.project}</strong>
            </span>
            <span>Reporter: <strong className="text-foreground">{ticket.reporter}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="border-2 border-transparent hover:border-border">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2">
              <DropdownMenuItem>Convert to Quote</DropdownMenuItem>
              <DropdownMenuItem>Link to Another Ticket</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Ticket</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {ticket.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No comments yet</p>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b-2 border-border last:border-0 last:pb-0">
                    <Avatar className="h-8 w-8 border-2 border-border">
                      <AvatarFallback className="bg-secondary text-xs">
                        {comment.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-4 border-t-2 border-border">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="border-2 min-h-[100px] mb-3"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} className="border-2">
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status</div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-2">Priority</div>
                <Select value={priority} onValueChange={setPriority}>
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

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Assignee</div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border-2 border-border">
                    <AvatarFallback className="bg-secondary text-xs">Y</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{ticket.assignee}</span>
                </div>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Reporter</div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border-2 border-border">
                    <AvatarFallback className="bg-secondary text-xs">
                      {ticket.reporter.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{ticket.reporter}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{ticket.created}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{ticket.updated}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
