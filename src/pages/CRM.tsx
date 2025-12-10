import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Mock clients data
const initialClients = [
  {
    id: "CLT-001",
    name: "Acme Corporation",
    type: "client",
    contactName: "John Smith",
    contactEmail: "john@acmecorp.com",
    contactPhone: "+1 555-0111",
    industry: "Technology",
    address: "100 Tech Drive, San Jose, CA",
    totalRevenue: 45000,
    activeProjects: 2,
    status: "active",
    createdAt: "Jan 15, 2023",
    notes: "Enterprise client, looking to expand scope",
  },
  {
    id: "CLT-002",
    name: "TechStart Inc",
    type: "client",
    contactName: "Sarah Wilson",
    contactEmail: "sarah@techstart.io",
    contactPhone: "+1 555-0112",
    industry: "Startup",
    address: "200 Innovation Ave, Palo Alto, CA",
    totalRevenue: 28000,
    activeProjects: 1,
    status: "active",
    createdAt: "Mar 10, 2023",
    notes: "Fast-growing startup, potential for long-term partnership",
  },
  {
    id: "CLT-003",
    name: "Global Solutions Ltd",
    type: "client",
    contactName: "Michael Brown",
    contactEmail: "m.brown@globalsol.com",
    contactPhone: "+1 555-0113",
    industry: "Consulting",
    address: "50 Business Park, Chicago, IL",
    totalRevenue: 72000,
    activeProjects: 3,
    status: "active",
    createdAt: "Jun 5, 2022",
    notes: "Long-term client, reliable payments",
  },
  {
    id: "CLT-004",
    name: "DataFlow Ltd",
    type: "client",
    contactName: "Emily Davis",
    contactEmail: "emily@dataflow.co",
    contactPhone: "+1 555-0114",
    industry: "Data Analytics",
    address: "75 Data Center Rd, Austin, TX",
    totalRevenue: 35000,
    activeProjects: 1,
    status: "inactive",
    createdAt: "Sep 20, 2023",
    notes: "Project on hold, will resume Q2",
  },
];

const initialLeads = [
  {
    id: "LEAD-001",
    name: "NextGen Robotics",
    type: "lead",
    contactName: "Robert Chen",
    contactEmail: "rchen@nextgenrobotics.com",
    contactPhone: "+1 555-0121",
    industry: "Robotics",
    address: "300 Automation Way, Boston, MA",
    estimatedValue: 50000,
    probability: 70,
    status: "warm",
    source: "Referral",
    createdAt: "Nov 15, 2024",
    notes: "Interested in automation dashboard, follow up scheduled",
  },
  {
    id: "LEAD-002",
    name: "HealthTech Solutions",
    type: "lead",
    contactName: "Dr. Amanda Lee",
    contactEmail: "alee@healthtech.com",
    contactPhone: "+1 555-0122",
    industry: "Healthcare",
    address: "500 Medical Plaza, Seattle, WA",
    estimatedValue: 85000,
    probability: 45,
    status: "cold",
    source: "Website",
    createdAt: "Oct 28, 2024",
    notes: "Initial inquiry, needs budget approval",
  },
  {
    id: "LEAD-003",
    name: "EcoEnergy Corp",
    type: "lead",
    contactName: "James Green",
    contactEmail: "jgreen@ecoenergy.com",
    contactPhone: "+1 555-0123",
    industry: "Energy",
    address: "120 Renewable Lane, Denver, CO",
    estimatedValue: 120000,
    probability: 85,
    status: "hot",
    source: "Conference",
    createdAt: "Dec 1, 2024",
    notes: "Very interested, contract review in progress",
  },
];

const industries = ["Technology", "Startup", "Consulting", "Data Analytics", "Healthcare", "Energy", "Robotics", "Finance", "Retail", "Other"];
const leadSources = ["Referral", "Website", "Conference", "Cold Outreach", "Social Media", "Partner", "Other"];

export default function CRM() {
  const [clients, setClients] = useState(initialClients);
  const [leads, setLeads] = useState(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    industry: "Technology",
    address: "",
    notes: "",
  });
  const [newLead, setNewLead] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    industry: "Technology",
    address: "",
    estimatedValue: "",
    probability: "50",
    source: "Website",
    notes: "",
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === "all" || client.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === "all" || lead.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const hotLeads = leads.filter(l => l.status === "hot").length;
  const pipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue * l.probability / 100), 0);

  const handleAddClient = () => {
    if (!newClient.name || !newClient.contactEmail) {
      toast.error("Please fill in required fields");
      return;
    }
    const client = {
      id: `CLT-${String(clients.length + 1).padStart(3, "0")}`,
      ...newClient,
      type: "client",
      totalRevenue: 0,
      activeProjects: 0,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setClients([...clients, client]);
    setNewClient({ name: "", contactName: "", contactEmail: "", contactPhone: "", industry: "Technology", address: "", notes: "" });
    setIsAddClientDialogOpen(false);
    toast.success("Client added successfully");
  };

  const handleAddLead = () => {
    if (!newLead.name || !newLead.contactEmail) {
      toast.error("Please fill in required fields");
      return;
    }
    const lead = {
      id: `LEAD-${String(leads.length + 1).padStart(3, "0")}`,
      ...newLead,
      type: "lead",
      estimatedValue: parseInt(newLead.estimatedValue) || 0,
      probability: parseInt(newLead.probability) || 50,
      status: "warm",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setLeads([...leads, lead]);
    setNewLead({ name: "", contactName: "", contactEmail: "", contactPhone: "", industry: "Technology", address: "", estimatedValue: "", probability: "50", source: "Website", notes: "" });
    setIsAddLeadDialogOpen(false);
    toast.success("Lead added successfully");
  };

  const convertToClient = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const client = {
      id: `CLT-${String(clients.length + 1).padStart(3, "0")}`,
      name: lead.name,
      type: "client",
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      industry: lead.industry,
      address: lead.address,
      totalRevenue: 0,
      activeProjects: 0,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      notes: lead.notes,
    };

    setClients([...clients, client]);
    setLeads(leads.filter(l => l.id !== leadId));
    toast.success(`${lead.name} converted to client`);
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast.success("Client removed");
  };

  const deleteLead = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
    toast.success("Lead removed");
  };

  const getLeadStatusStyle = (status: string) => {
    switch (status) {
      case "hot": return "bg-destructive text-destructive-foreground";
      case "warm": return "bg-chart-4 text-foreground";
      case "cold": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Manage clients and potential leads</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Building className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeClients}</div>
                <div className="text-sm text-muted-foreground">Active Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                <DollarSign className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-destructive">
                <Star className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{hotLeads}</div>
                <div className="text-sm text-muted-foreground">Hot Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${Math.round(pipelineValue).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="border-2 border-border p-1 bg-background">
            <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building className="h-4 w-4 mr-2" />
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="h-4 w-4 mr-2" />
              Leads ({leads.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[200px] border-2"
              />
            </div>
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-full sm:w-[150px] border-2">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent className="border-2">
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 sm:max-w-[500px]">
                <DialogHeader className="border-b-2 border-border pb-4">
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input
                        placeholder="Primary contact"
                        value={newClient.contactName}
                        onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email *</Label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={newClient.contactEmail}
                        onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 555-0100"
                        value={newClient.contactPhone}
                        onChange={(e) => setNewClient({ ...newClient, contactPhone: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Industry</Label>
                      <Select value={newClient.industry} onValueChange={(v) => setNewClient({ ...newClient, industry: v })}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2">
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Full address"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newClient.notes}
                      onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                      className="border-2"
                    />
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
                    <TableHead className="font-bold uppercase text-xs">Projects</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="border-b-2">
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.id}</div>
                      </TableCell>
                      <TableCell>
                        <div>{client.contactName}</div>
                        <div className="text-xs text-muted-foreground">{client.contactEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-2 border-border">{client.industry}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">${client.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-2">{client.activeProjects} active</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={client.status === "active" ? "bg-chart-2 text-background" : "bg-muted text-muted-foreground"}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteClient(client.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredClients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No clients found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 sm:max-w-[500px]">
                <DialogHeader className="border-b-2 border-border pb-4">
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="border-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input
                        placeholder="Primary contact"
                        value={newLead.contactName}
                        onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email *</Label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={newLead.contactEmail}
                        onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Estimated Value ($)</Label>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={newLead.estimatedValue}
                        onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                        className="border-2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Probability (%)</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={newLead.probability}
                        onChange={(e) => setNewLead({ ...newLead, probability: e.target.value })}
                        className="border-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Industry</Label>
                      <Select value={newLead.industry} onValueChange={(v) => setNewLead({ ...newLead, industry: v })}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2">
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Source</Label>
                      <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2">
                          {leadSources.map((src) => (
                            <SelectItem key={src} value={src}>{src}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newLead.notes}
                      onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                      className="border-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
                  <Button variant="outline" onClick={() => setIsAddLeadDialogOpen(false)} className="border-2">Cancel</Button>
                  <Button onClick={handleAddLead} className="border-2">Add Lead</Button>
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
                    <TableHead className="font-bold uppercase text-xs">Source</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Est. Value</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Probability</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-b-2">
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.industry}</div>
                      </TableCell>
                      <TableCell>
                        <div>{lead.contactName}</div>
                        <div className="text-xs text-muted-foreground">{lead.contactEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-2">{lead.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">${lead.estimatedValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-chart-2" style={{ width: `${lead.probability}%` }} />
                          </div>
                          <span className="text-sm font-mono">{lead.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeadStatusStyle(lead.status)}>{lead.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-border">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem onClick={() => convertToClient(lead.id)}>
                              <Building className="h-4 w-4 mr-2" />
                              Convert to Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteLead(lead.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No leads found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
