import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Lightbulb, FileText, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const initialTickets = [
  {
    id: "TKT-001",
    title: "Add export functionality to reports",
    category: "feature",
    project: "Acme Corp",
    priority: "high",
    status: "open",
    assignee: "You",
    created: "Dec 8, 2024",
  },
  {
    id: "TKT-002",
    title: "Quote request for enterprise package",
    category: "quote",
    project: "TechStart Inc",
    priority: "medium",
    status: "in-progress",
    assignee: "You",
    created: "Dec 8, 2024",
  },
  {
    id: "TKT-003",
    title: "Dashboard loading speed issue",
    category: "feedback",
    project: "Global Solutions",
    priority: "high",
    status: "open",
    assignee: "You",
    created: "Dec 7, 2024",
  },
  {
    id: "TKT-004",
    title: "Integration with Salesforce CRM",
    category: "feature",
    project: "Acme Corp",
    priority: "low",
    status: "open",
    assignee: "You",
    created: "Dec 7, 2024",
  },
  {
    id: "TKT-005",
    title: "Annual contract renewal discussion",
    category: "quote",
    project: "DataFlow Ltd",
    priority: "medium",
    status: "pending",
    assignee: "You",
    created: "Dec 6, 2024",
  },
  {
    id: "TKT-006",
    title: "Mobile app feature request",
    category: "feature",
    project: "TechStart Inc",
    priority: "medium",
    status: "open",
    assignee: "You",
    created: "Dec 5, 2024",
  },
  {
    id: "TKT-007",
    title: "Positive feedback on new UI",
    category: "feedback",
    project: "Global Solutions",
    priority: "low",
    status: "closed",
    assignee: "You",
    created: "Dec 4, 2024",
  },
  {
    id: "TKT-008",
    title: "Extended support package quote",
    category: "quote",
    project: "Acme Corp",
    priority: "high",
    status: "in-progress",
    assignee: "You",
    created: "Dec 3, 2024",
  },
];

const projectOptions = [
  "Acme Corp",
  "TechStart Inc",
  "Global Solutions",
  "DataFlow Ltd",
  "CloudNine Systems",
  "InnovateTech",
];

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

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "feature",
    project: "",
    priority: "medium",
  });

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || ticket.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.project) {
      toast.error("Please fill in all required fields");
      return;
    }

    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const ticket = {
      id: ticketId,
      title: newTicket.title,
      category: newTicket.category,
      project: newTicket.project,
      priority: newTicket.priority,
      status: "open",
      assignee: "You",
      created: today,
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({
      title: "",
      description: "",
      category: "feature",
      project: "",
      priority: "medium",
    });
    setIsDialogOpen(false);
    toast.success("Ticket created successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage all your project tickets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter ticket title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the ticket in detail"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="quote">Customer Quote</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={newTicket.project}
                    onValueChange={(value) => setNewTicket({ ...newTicket, project: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {projectOptions.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                >
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
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} className="border-2">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="border-2 border-border p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  All
                </TabsTrigger>
                <TabsTrigger value="feature" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="quote" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4 mr-1" />
                  Quotes
                </TabsTrigger>
                <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Feedback
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 border-2"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent">
                <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                <TableHead className="font-bold uppercase text-xs">Title</TableHead>
                <TableHead className="font-bold uppercase text-xs">Category</TableHead>
                <TableHead className="font-bold uppercase text-xs">Project</TableHead>
                <TableHead className="font-bold uppercase text-xs">Priority</TableHead>
                <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                <TableHead className="font-bold uppercase text-xs">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons];
                return (
                  <TableRow
                    key={ticket.id}
                    className="border-b-2 cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{categoryLabels[ticket.category as keyof typeof categoryLabels]}</span>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.project}</TableCell>
                    <TableCell>
                      <Badge className={priorityStyles[ticket.priority as keyof typeof priorityStyles]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[ticket.status as keyof typeof statusStyles]}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ticket.created}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
