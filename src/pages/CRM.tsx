import { useState } from "react";
import {
  Building,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  Star,
  UserPlus,
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  CheckCircle,
  Circle,
  ArrowRight,
  Target,
  Handshake,
  XCircle,
  Send,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Pipeline stages
const pipelineStages = [
  { id: "lead", name: "Lead", color: "bg-slate-200", textDark: false },
  { id: "qualified", name: "Qualified", color: "bg-amber-400", textDark: false },
  { id: "proposal", name: "Proposal", color: "bg-blue-500", textDark: true },
  { id: "negotiation", name: "Negotiation", color: "bg-purple-500", textDark: true },
  { id: "won", name: "Won", color: "bg-green-500", textDark: true },
  { id: "lost", name: "Lost", color: "bg-red-500", textDark: true },
];

// Mock deals data
const initialDeals = [
  {
    id: "DEAL-001",
    title: "Enterprise Software Package",
    companyId: "CLT-001",
    companyName: "Acme Corporation",
    contactName: "John Smith",
    contactEmail: "john@acmecorp.com",
    value: 75000,
    stage: "negotiation",
    probability: 80,
    expectedClose: "Dec 30, 2024",
    createdAt: "Nov 1, 2024",
    notes: "Final contract review in progress",
    lastActivity: "Dec 9, 2024",
  },
  {
    id: "DEAL-002",
    title: "Annual Support Contract",
    companyId: "CLT-002",
    companyName: "TechStart Inc",
    contactName: "Sarah Wilson",
    contactEmail: "sarah@techstart.io",
    value: 28000,
    stage: "proposal",
    probability: 60,
    expectedClose: "Jan 15, 2025",
    createdAt: "Nov 15, 2024",
    notes: "Waiting for budget approval",
    lastActivity: "Dec 7, 2024",
  },
  {
    id: "DEAL-003",
    title: "Automation Dashboard Project",
    companyId: "LEAD-001",
    companyName: "NextGen Robotics",
    contactName: "Robert Chen",
    contactEmail: "rchen@nextgenrobotics.com",
    value: 50000,
    stage: "qualified",
    probability: 70,
    expectedClose: "Feb 1, 2025",
    createdAt: "Dec 1, 2024",
    notes: "Demo scheduled for next week",
    lastActivity: "Dec 8, 2024",
  },
  {
    id: "DEAL-004",
    title: "Healthcare Data Platform",
    companyId: "LEAD-002",
    companyName: "HealthTech Solutions",
    contactName: "Dr. Amanda Lee",
    contactEmail: "alee@healthtech.com",
    value: 85000,
    stage: "lead",
    probability: 30,
    expectedClose: "Mar 1, 2025",
    createdAt: "Dec 5, 2024",
    notes: "Initial discovery call completed",
    lastActivity: "Dec 5, 2024",
  },
  {
    id: "DEAL-005",
    title: "Green Energy Monitoring System",
    companyId: "LEAD-003",
    companyName: "EcoEnergy Corp",
    contactName: "James Green",
    contactEmail: "jgreen@ecoenergy.com",
    value: 120000,
    stage: "negotiation",
    probability: 85,
    expectedClose: "Dec 20, 2024",
    createdAt: "Nov 10, 2024",
    notes: "Legal review of contract terms",
    lastActivity: "Dec 9, 2024",
  },
  {
    id: "DEAL-006",
    title: "Legacy System Migration",
    companyId: "CLT-003",
    companyName: "Global Solutions Ltd",
    contactName: "Michael Brown",
    contactEmail: "m.brown@globalsol.com",
    value: 95000,
    stage: "won",
    probability: 100,
    expectedClose: "Dec 1, 2024",
    createdAt: "Sep 15, 2024",
    notes: "Contract signed, project starting Q1",
    lastActivity: "Dec 1, 2024",
  },
  {
    id: "DEAL-007",
    title: "Mobile App Development",
    companyId: "CLT-004",
    companyName: "DataFlow Ltd",
    contactName: "Emily Davis",
    contactEmail: "emily@dataflow.co",
    value: 45000,
    stage: "lost",
    probability: 0,
    expectedClose: "Nov 15, 2024",
    createdAt: "Aug 20, 2024",
    notes: "Lost to competitor - pricing issue",
    lastActivity: "Nov 15, 2024",
  },
];

// Mock activities
const initialActivities = [
  { id: "ACT-001", dealId: "DEAL-001", type: "call", description: "Contract discussion call with John", date: "Dec 9, 2024", duration: "45 min" },
  { id: "ACT-002", dealId: "DEAL-001", type: "email", description: "Sent revised pricing proposal", date: "Dec 8, 2024", duration: "" },
  { id: "ACT-003", dealId: "DEAL-002", type: "meeting", description: "Product demo with stakeholders", date: "Dec 7, 2024", duration: "1 hr" },
  { id: "ACT-004", dealId: "DEAL-003", type: "call", description: "Discovery call - requirements gathering", date: "Dec 8, 2024", duration: "30 min" },
  { id: "ACT-005", dealId: "DEAL-005", type: "email", description: "Contract sent for legal review", date: "Dec 9, 2024", duration: "" },
  { id: "ACT-006", dealId: "DEAL-001", type: "note", description: "Client requested additional features in scope", date: "Dec 6, 2024", duration: "" },
];

// Mock tasks
const initialTasks = [
  { id: "TSK-001", dealId: "DEAL-001", title: "Send final contract", dueDate: "Dec 12, 2024", completed: false, priority: "high" },
  { id: "TSK-002", dealId: "DEAL-002", title: "Follow up on budget approval", dueDate: "Dec 15, 2024", completed: false, priority: "medium" },
  { id: "TSK-003", dealId: "DEAL-003", title: "Prepare demo environment", dueDate: "Dec 14, 2024", completed: false, priority: "high" },
  { id: "TSK-004", dealId: "DEAL-005", title: "Schedule final negotiation call", dueDate: "Dec 11, 2024", completed: true, priority: "high" },
  { id: "TSK-005", dealId: "DEAL-004", title: "Send case studies", dueDate: "Dec 10, 2024", completed: false, priority: "low" },
];

// Mock clients data
const initialClients = [
  { id: "CLT-001", name: "Acme Corporation", contactName: "John Smith", contactEmail: "john@acmecorp.com", contactPhone: "+1 555-0111", industry: "Technology", address: "100 Tech Drive, San Jose, CA", totalRevenue: 145000, activeDeals: 1, status: "active", createdAt: "Jan 15, 2023" },
  { id: "CLT-002", name: "TechStart Inc", contactName: "Sarah Wilson", contactEmail: "sarah@techstart.io", contactPhone: "+1 555-0112", industry: "Startup", address: "200 Innovation Ave, Palo Alto, CA", totalRevenue: 28000, activeDeals: 1, status: "active", createdAt: "Mar 10, 2023" },
  { id: "CLT-003", name: "Global Solutions Ltd", contactName: "Michael Brown", contactEmail: "m.brown@globalsol.com", contactPhone: "+1 555-0113", industry: "Consulting", address: "50 Business Park, Chicago, IL", totalRevenue: 167000, activeDeals: 1, status: "active", createdAt: "Jun 5, 2022" },
  { id: "CLT-004", name: "DataFlow Ltd", contactName: "Emily Davis", contactEmail: "emily@dataflow.co", contactPhone: "+1 555-0114", industry: "Data Analytics", address: "75 Data Center Rd, Austin, TX", totalRevenue: 35000, activeDeals: 0, status: "inactive", createdAt: "Sep 20, 2023" },
];

const initialLeads = [
  { id: "LEAD-001", name: "NextGen Robotics", contactName: "Robert Chen", contactEmail: "rchen@nextgenrobotics.com", contactPhone: "+1 555-0121", industry: "Robotics", source: "Referral", status: "warm", createdAt: "Nov 15, 2024" },
  { id: "LEAD-002", name: "HealthTech Solutions", contactName: "Dr. Amanda Lee", contactEmail: "alee@healthtech.com", contactPhone: "+1 555-0122", industry: "Healthcare", source: "Website", status: "cold", createdAt: "Oct 28, 2024" },
  { id: "LEAD-003", name: "EcoEnergy Corp", contactName: "James Green", contactEmail: "jgreen@ecoenergy.com", contactPhone: "+1 555-0123", industry: "Energy", source: "Conference", status: "hot", createdAt: "Dec 1, 2024" },
];

const industries = ["Technology", "Startup", "Consulting", "Data Analytics", "Healthcare", "Energy", "Robotics", "Finance", "Retail", "Other"];
const leadSources = ["Referral", "Website", "Conference", "Cold Outreach", "Social Media", "Partner", "Other"];

export default function CRM() {
  const [deals, setDeals] = useState(initialDeals);
  const [clients, setClients] = useState(initialClients);
  const [leads, setLeads] = useState(initialLeads);
  const [activities, setActivities] = useState(initialActivities);
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState<typeof initialDeals[0] | null>(null);
  const [selectedClient, setSelectedClient] = useState<typeof initialClients[0] | null>(null);
  const [isAddDealDialogOpen, setIsAddDealDialogOpen] = useState(false);
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: "", companyName: "", contactName: "", contactEmail: "", value: "", expectedClose: "", notes: "" });
  const [newActivity, setNewActivity] = useState({ type: "call", description: "" });
  const [newTask, setNewTask] = useState({ title: "", dueDate: "", priority: "medium" });
  const [newClient, setNewClient] = useState({ name: "", contactName: "", contactEmail: "", contactPhone: "", industry: "Technology", address: "" });

  // Stats
  const activeDeals = deals.filter(d => !["won", "lost"].includes(d.stage));
  const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = activeDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const wonDeals = deals.filter(d => d.stage === "won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pendingTasks = tasks.filter(t => !t.completed).length;

  // Filtered deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === "all" || deal.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  // Get deals by stage for pipeline view
  const getDealsByStage = (stageId: string) => deals.filter(d => d.stage === stageId);

  const handleAddDeal = () => {
    if (!newDeal.title || !newDeal.companyName || !newDeal.value) {
      toast.error("Please fill in required fields");
      return;
    }
    const deal = {
      id: `DEAL-${String(deals.length + 1).padStart(3, "0")}`,
      ...newDeal,
      companyId: "",
      value: parseInt(newDeal.value) || 0,
      stage: "lead",
      probability: 20,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastActivity: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setDeals([deal, ...deals]);
    setNewDeal({ title: "", companyName: "", contactName: "", contactEmail: "", value: "", expectedClose: "", notes: "" });
    setIsAddDealDialogOpen(false);
    toast.success("Deal created successfully");
  };

  const handleAddActivity = () => {
    if (!newActivity.description || !selectedDeal) return;
    const activity = {
      id: `ACT-${String(activities.length + 1).padStart(3, "0")}`,
      dealId: selectedDeal.id,
      type: newActivity.type,
      description: newActivity.description,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      duration: "",
    };
    setActivities([activity, ...activities]);
    setDeals(deals.map(d => d.id === selectedDeal.id ? { ...d, lastActivity: activity.date } : d));
    setSelectedDeal({ ...selectedDeal, lastActivity: activity.date });
    setNewActivity({ type: "call", description: "" });
    setIsAddActivityDialogOpen(false);
    toast.success("Activity logged");
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.dueDate || !selectedDeal) return;
    const task = {
      id: `TSK-${String(tasks.length + 1).padStart(3, "0")}`,
      dealId: selectedDeal.id,
      title: newTask.title,
      dueDate: new Date(newTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      completed: false,
      priority: newTask.priority,
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: "", dueDate: "", priority: "medium" });
    setIsAddTaskDialogOpen(false);
    toast.success("Task created");
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.contactEmail) {
      toast.error("Please fill in required fields");
      return;
    }
    const client = {
      id: `CLT-${String(clients.length + 1).padStart(3, "0")}`,
      ...newClient,
      totalRevenue: 0,
      activeDeals: 0,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setClients([...clients, client]);
    setNewClient({ name: "", contactName: "", contactEmail: "", contactPhone: "", industry: "Technology", address: "" });
    setIsAddClientDialogOpen(false);
    toast.success("Client added successfully");
  };

  const moveDealToStage = (dealId: string, newStage: string) => {
    const probabilities: Record<string, number> = { lead: 20, qualified: 40, proposal: 60, negotiation: 80, won: 100, lost: 0 };
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage, probability: probabilities[newStage] } : d));
    if (selectedDeal?.id === dealId) {
      setSelectedDeal({ ...selectedDeal, stage: newStage, probability: probabilities[newStage] });
    }
    toast.success(`Deal moved to ${pipelineStages.find(s => s.id === newStage)?.name}`);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteDeal = (id: string) => {
    setDeals(deals.filter(d => d.id !== id));
    setSelectedDeal(null);
    toast.success("Deal deleted");
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    setSelectedClient(null);
    toast.success("Client removed");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <PhoneCall className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Video className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    const stageData = pipelineStages.find(s => s.id === stage);
    if (!stageData) return "bg-muted";
    return `${stageData.color} ${stageData.textDark ? "text-white" : "text-black"}`;
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-chart-4 text-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-secondary";
    }
  };

  // Deal Detail View
  if (selectedDeal) {
    const dealActivities = activities.filter(a => a.dealId === selectedDeal.id);
    const dealTasks = tasks.filter(t => t.dealId === selectedDeal.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedDeal(null)} className="border-2 border-transparent hover:border-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-muted-foreground">{selectedDeal.id}</span>
              <Badge className={getStageColor(selectedDeal.stage)}>
                {pipelineStages.find(s => s.id === selectedDeal.stage)?.name}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{selectedDeal.title}</h1>
            <p className="text-muted-foreground">{selectedDeal.companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="border-2">
                  Move to Stage
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-2">
                {pipelineStages.map(stage => (
                  <DropdownMenuItem
                    key={stage.id}
                    onClick={() => moveDealToStage(selectedDeal.id, stage.id)}
                    disabled={selectedDeal.stage === stage.id}
                  >
                    <div className={`h-3 w-3 rounded-full mr-2 ${stage.color}`} />
                    {stage.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteDeal(selectedDeal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Deal Value</div>
              <div className="text-2xl font-bold font-mono">${selectedDeal.value.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Probability</div>
              <div className="text-2xl font-bold">{selectedDeal.probability}%</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Weighted Value</div>
              <div className="text-2xl font-bold font-mono">${Math.round(selectedDeal.value * selectedDeal.probability / 100).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Expected Close</div>
              <div className="text-2xl font-bold">{selectedDeal.expectedClose}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Activities */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center justify-between">
                  <CardTitle>Activities</CardTitle>
                  <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="border-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Log Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-2">
                      <DialogHeader className="border-b-2 border-border pb-4">
                        <DialogTitle>Log Activity</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Activity Type</Label>
                          <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent className="border-2">
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Description *</Label>
                          <Textarea
                            placeholder="What happened?"
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            className="border-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                        <Button variant="outline" onClick={() => setIsAddActivityDialogOpen(false)} className="border-2">Cancel</Button>
                        <Button onClick={handleAddActivity} className="border-2">Log Activity</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {dealActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No activities logged yet</p>
                ) : (
                  <div className="space-y-4">
                    {dealActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b-2 border-border last:border-0 last:pb-0">
                        <div className="h-8 w-8 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-2 text-xs capitalize">{activity.type}</Badge>
                            <span className="text-xs text-muted-foreground">{activity.date}</span>
                          </div>
                          <p className="mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks</CardTitle>
                  <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="border-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-2">
                      <DialogHeader className="border-b-2 border-border pb-4">
                        <DialogTitle>Add Task</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Task Title *</Label>
                          <Input
                            placeholder="What needs to be done?"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            className="border-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Due Date *</Label>
                            <Input
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                              className="border-2"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                              <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                              <SelectContent className="border-2">
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                        <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)} className="border-2">Cancel</Button>
                        <Button onClick={handleAddTask} className="border-2">Add Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {dealTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No tasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {dealTasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 border-2 border-border cursor-pointer hover:bg-accent/50 ${task.completed ? "opacity-60" : ""}`}
                        onClick={() => toggleTaskComplete(task.id)}
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-chart-2 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1">
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                        </div>
                        <Badge className={getPriorityStyle(task.priority)} variant="secondary">{task.priority}</Badge>
                        <span className="text-sm text-muted-foreground">{task.dueDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback>{selectedDeal.contactName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedDeal.contactName}</div>
                    <div className="text-sm text-muted-foreground">{selectedDeal.companyName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedDeal.contactEmail}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-muted-foreground">{selectedDeal.notes || "No notes"}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{selectedDeal.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span>{selectedDeal.lastActivity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Close</span>
                  <span>{selectedDeal.expectedClose}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Client Detail View
  if (selectedClient) {
    const clientDeals = deals.filter(d => d.companyId === selectedClient.id || d.companyName === selectedClient.name);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedClient(null)} className="border-2 border-transparent hover:border-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarFallback className="text-xl">{selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-muted-foreground">{selectedClient.id}</span>
                <Badge className={selectedClient.status === "active" ? "bg-chart-2 text-background" : "bg-muted"}>{selectedClient.status}</Badge>
              </div>
              <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
              <p className="text-muted-foreground">{selectedClient.industry}</p>
            </div>
          </div>
          <Button variant="outline" className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteClient(selectedClient.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Client
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold font-mono">${selectedClient.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Active Deals</div>
              <div className="text-2xl font-bold">{clientDeals.filter(d => !["won", "lost"].includes(d.stage)).length}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Client Since</div>
              <div className="text-2xl font-bold">{selectedClient.createdAt}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Deals</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {clientDeals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No deals with this client</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 hover:bg-transparent">
                        <TableHead className="font-bold uppercase text-xs">Deal</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-right">Value</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Stage</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Expected Close</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientDeals.map(deal => (
                        <TableRow key={deal.id} className="border-b-2 cursor-pointer hover:bg-accent/50" onClick={() => { setSelectedClient(null); setSelectedDeal(deal); }}>
                          <TableCell className="font-medium">{deal.title}</TableCell>
                          <TableCell className="text-right font-mono">${deal.value.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={getStageColor(deal.stage)}>{pipelineStages.find(s => s.id === deal.stage)?.name}</Badge>
                          </TableCell>
                          <TableCell>{deal.expectedClose}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="font-medium">{selectedClient.contactName}</div>
                <div className="text-sm text-muted-foreground">Primary Contact</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {selectedClient.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {selectedClient.contactPhone}
              </div>
              {selectedClient.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  {selectedClient.address}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main CRM View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Manage your sales pipeline, clients, and deals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                <Target className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeDeals.length}</div>
                <div className="text-sm text-muted-foreground">Active Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${Math.round(totalPipeline / 1000)}k</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-3">
                <TrendingUp className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${Math.round(weightedPipeline / 1000)}k</div>
                <div className="text-sm text-muted-foreground">Weighted Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Handshake className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${Math.round(wonValue / 1000)}k</div>
                <div className="text-sm text-muted-foreground">Won This Period</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="border-2 border-border p-1 bg-background">
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Deals
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Tasks ({pendingTasks})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px] border-2" />
            </div>
            <Dialog open={isAddDealDialogOpen} onOpenChange={setIsAddDealDialogOpen}>
              <DialogTrigger asChild>
                <Button className="border-2"><Plus className="h-4 w-4 mr-2" />New Deal</Button>
              </DialogTrigger>
              <DialogContent className="border-2 sm:max-w-[500px]">
                <DialogHeader className="border-b-2 border-border pb-4">
                  <DialogTitle>Create New Deal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Deal Title *</Label>
                    <Input placeholder="Deal title" value={newDeal.title} onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })} className="border-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Company Name *</Label>
                      <Input placeholder="Company" value={newDeal.companyName} onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })} className="border-2" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Deal Value ($) *</Label>
                      <Input type="number" placeholder="50000" value={newDeal.value} onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })} className="border-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input placeholder="Contact name" value={newDeal.contactName} onChange={(e) => setNewDeal({ ...newDeal, contactName: e.target.value })} className="border-2" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email</Label>
                      <Input type="email" placeholder="email@company.com" value={newDeal.contactEmail} onChange={(e) => setNewDeal({ ...newDeal, contactEmail: e.target.value })} className="border-2" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Expected Close Date</Label>
                    <Input type="date" value={newDeal.expectedClose} onChange={(e) => setNewDeal({ ...newDeal, expectedClose: e.target.value })} className="border-2" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea placeholder="Additional notes..." value={newDeal.notes} onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })} className="border-2" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                  <Button variant="outline" onClick={() => setIsAddDealDialogOpen(false)} className="border-2">Cancel</Button>
                  <Button onClick={handleAddDeal} className="border-2">Create Deal</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-6 gap-4 overflow-x-auto">
            {pipelineStages.map(stage => {
              const stageDeals = getDealsByStage(stage.id);
              const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
              return (
                <div key={stage.id} className="min-w-[200px]">
                  <div className={`p-3 border-2 border-border mb-3 ${stage.color}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${stage.textDark ? "text-white" : "text-black"}`}>{stage.name}</span>
                      <Badge variant="secondary" className={stage.textDark ? "bg-white/20 text-white" : "bg-black/10 text-black"}>{stageDeals.length}</Badge>
                    </div>
                    <div className={`text-sm font-mono mt-1 ${stage.textDark ? "text-white/80" : "text-black/60"}`}>
                      ${stageValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.map(deal => (
                      <Card
                        key={deal.id}
                        className="border-2 border-border cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <CardContent className="p-3">
                          <div className="font-medium text-sm mb-1 line-clamp-1">{deal.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">{deal.companyName}</div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm">${deal.value.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="border-2 border-dashed border-border p-4 text-center text-muted-foreground text-sm">
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* All Deals */}
        <TabsContent value="deals" className="space-y-4">
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Deal</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Company</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Value</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Stage</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Probability</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Expected Close</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map(deal => (
                    <TableRow key={deal.id} className="border-b-2 cursor-pointer hover:bg-accent/50" onClick={() => setSelectedDeal(deal)}>
                      <TableCell>
                        <div className="font-medium">{deal.title}</div>
                        <div className="text-xs text-muted-foreground">{deal.id}</div>
                      </TableCell>
                      <TableCell>{deal.companyName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${deal.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>{pipelineStages.find(s => s.id === deal.stage)?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={deal.probability} className="w-16 h-2" />
                          <span className="text-sm font-mono">{deal.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{deal.expectedClose}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); }}>
                              <Pencil className="h-4 w-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {pipelineStages.filter(s => s.id !== deal.stage).slice(0, 3).map(stage => (
                              <DropdownMenuItem key={stage.id} onClick={(e) => { e.stopPropagation(); moveDealToStage(deal.id, stage.id); }}>
                                <ArrowRight className="h-4 w-4 mr-2" />Move to {stage.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteDeal(deal.id); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="border-2"><Plus className="h-4 w-4 mr-2" />Add Client</Button>
              </DialogTrigger>
              <DialogContent className="border-2 sm:max-w-[500px]">
                <DialogHeader className="border-b-2 border-border pb-4">
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Company Name *</Label>
                    <Input placeholder="Company name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="border-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input placeholder="Primary contact" value={newClient.contactName} onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })} className="border-2" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email *</Label>
                      <Input type="email" placeholder="email@company.com" value={newClient.contactEmail} onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })} className="border-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input placeholder="+1 555-0100" value={newClient.contactPhone} onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })} className="border-2" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Industry</Label>
                      <Select value={newClient.industry} onValueChange={(v) => setNewClient({ ...newClient, industry: v })}>
                        <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-2">
                          {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Input placeholder="Full address" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="border-2" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                  <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)} className="border-2">Cancel</Button>
                  <Button onClick={handleAddClient} className="border-2">Add Client</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-2 border-border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Company</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Contact</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Industry</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Revenue</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id} className="border-b-2 cursor-pointer hover:bg-accent/50" onClick={() => setSelectedClient(client)}>
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.id}</div>
                      </TableCell>
                      <TableCell>
                        <div>{client.contactName}</div>
                        <div className="text-xs text-muted-foreground">{client.contactEmail}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="border-2 border-border">{client.industry}</Badge></TableCell>
                      <TableCell className="text-right font-mono font-bold">${client.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={client.status === "active" ? "bg-chart-2 text-background" : "bg-muted"}>{client.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}>
                              <Pencil className="h-4 w-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {tasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(task => {
                  const deal = deals.find(d => d.id === task.dealId);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 border-2 border-border cursor-pointer hover:bg-accent/50 ${task.completed ? "opacity-60" : ""}`}
                      onClick={() => toggleTaskComplete(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-chart-2 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</div>
                        <div className="text-xs text-muted-foreground">{deal?.title} - {deal?.companyName}</div>
                      </div>
                      <Badge className={getPriorityStyle(task.priority)} variant="secondary">{task.priority}</Badge>
                      <span className="text-sm text-muted-foreground shrink-0">{task.dueDate}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
