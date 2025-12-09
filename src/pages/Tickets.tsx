import { useState } from "react";
import { Plus, Filter, Lightbulb, FileText, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const allTickets = [
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredTickets = allTickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || ticket.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage all your project tickets</p>
        </div>
        <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
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
                  <TableRow key={ticket.id} className="border-b-2 cursor-pointer hover:bg-accent/50">
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
