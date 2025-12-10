import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, ArrowUpRight, DollarSign, Check, X, FolderPlus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const initialQuotes = [
  {
    id: "QTE-001",
    title: "Enterprise Package Quote",
    description: "Full enterprise implementation with custom integrations and dedicated support",
    project: "TechStart Inc",
    value: "$45,000",
    status: "sent",
    stage: 60,
    contact: "sarah@techstart.io",
    validUntil: "Dec 31, 2024",
    created: "Dec 8, 2024",
  },
  {
    id: "QTE-002",
    title: "Annual Contract Renewal",
    description: "Renewal of annual support and maintenance contract with expanded scope",
    project: "DataFlow Ltd",
    value: "$28,000",
    status: "negotiating",
    stage: 75,
    contact: "david@dataflow.io",
    validUntil: "Jan 15, 2025",
    created: "Dec 6, 2024",
  },
  {
    id: "QTE-003",
    title: "Extended Support Package",
    description: "24/7 premium support with guaranteed 1-hour response time",
    project: "Acme Corp",
    value: "$18,500",
    status: "draft",
    stage: 25,
    contact: "john@acmecorp.com",
    validUntil: "Dec 20, 2024",
    created: "Dec 3, 2024",
  },
  {
    id: "QTE-005",
    title: "Custom Integration Development",
    description: "API development and third-party system integrations",
    project: "CloudNine Systems",
    value: "$35,000",
    status: "sent",
    stage: 50,
    contact: "lisa@cloudnine.io",
    validUntil: "Jan 5, 2025",
    created: "Dec 1, 2024",
  },
];

const initialRejectedQuotes = [
  {
    id: "QTE-004",
    title: "Cloud Migration Project",
    description: "Complete migration of on-premise infrastructure to cloud with training",
    project: "Global Solutions",
    value: "$72,000",
    status: "rejected",
    stage: 0,
    contact: "emma@globalsol.com",
    validUntil: "Nov 30, 2024",
    created: "Nov 15, 2024",
    rejectedDate: "Dec 1, 2024",
    rejectionReason: "Budget constraints - postponed to next fiscal year",
  },
  {
    id: "QTE-006",
    title: "Mobile App Development",
    description: "Native iOS and Android app development with backend integration",
    project: "StartupXYZ",
    value: "$55,000",
    status: "rejected",
    stage: 0,
    contact: "mike@startupxyz.com",
    validUntil: "Oct 15, 2024",
    created: "Sep 20, 2024",
    rejectedDate: "Nov 5, 2024",
    rejectionReason: "Went with competitor offering",
  },
];

const initialConvertedProjects = [
  {
    id: "PRJ-FROM-QTE-007",
    quoteId: "QTE-007",
    title: "E-commerce Platform Upgrade",
    project: "RetailMax",
    value: "$42,000",
    convertedDate: "Dec 5, 2024",
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

const statusStyles = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-chart-1 text-background",
  negotiating: "bg-chart-4 text-foreground",
  accepted: "bg-chart-2 text-background",
  rejected: "bg-destructive text-destructive-foreground",
};

const stageLabels = {
  draft: "Preparing",
  sent: "Awaiting Response",
  negotiating: "In Negotiation",
  accepted: "Won",
  rejected: "Lost",
};

export default function CustomerQuotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [rejectedQuotes, setRejectedQuotes] = useState(initialRejectedQuotes);
  const [convertedProjects, setConvertedProjects] = useState(initialConvertedProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [quoteToReject, setQuoteToReject] = useState<typeof initialQuotes[0] | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newQuote, setNewQuote] = useState({
    title: "",
    description: "",
    project: "",
    value: "",
    contact: "",
    validUntil: "",
  });

  const totalValue = quotes.reduce((sum, q) => sum + parseInt(q.value.replace(/[$,]/g, '')), 0);
  const convertedValue = convertedProjects.reduce((sum, p) => sum + parseInt(p.value.replace(/[$,]/g, '')), 0);
  const rejectedValue = rejectedQuotes.reduce((sum, q) => sum + parseInt(q.value.replace(/[$,]/g, '')), 0);

  const handleAcceptQuote = (quote: typeof initialQuotes[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Remove from quotes
    setQuotes(quotes.filter(q => q.id !== quote.id));

    // Add to converted projects
    const newProject = {
      id: `PRJ-FROM-${quote.id}`,
      quoteId: quote.id,
      title: quote.title,
      project: quote.project,
      value: quote.value,
      convertedDate: today,
    };
    setConvertedProjects([newProject, ...convertedProjects]);

    toast.success(`Quote accepted! Project "${quote.title}" has been created.`);
  };

  const openRejectDialog = (quote: typeof initialQuotes[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setQuoteToReject(quote);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectQuote = () => {
    if (!quoteToReject) return;

    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Remove from quotes
    setQuotes(quotes.filter(q => q.id !== quoteToReject.id));

    // Add to rejected quotes
    const rejectedQuote = {
      ...quoteToReject,
      status: "rejected",
      stage: 0,
      rejectedDate: today,
      rejectionReason: rejectionReason || "No reason provided",
    };
    setRejectedQuotes([rejectedQuote, ...rejectedQuotes]);

    setIsRejectDialogOpen(false);
    setQuoteToReject(null);
    setRejectionReason("");
    toast.info(`Quote "${quoteToReject.title}" has been marked as rejected.`);
  };

  const handleCreateQuote = () => {
    if (!newQuote.title || !newQuote.project || !newQuote.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quoteId = `QTE-${String(quotes.length + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const quote = {
      id: quoteId,
      title: newQuote.title,
      description: newQuote.description,
      project: newQuote.project,
      value: `$${newQuote.value.replace(/[$,]/g, "")}`,
      status: "draft",
      stage: 10,
      contact: newQuote.contact,
      validUntil: newQuote.validUntil || "TBD",
      created: today,
    };

    setQuotes([quote, ...quotes]);
    setNewQuote({
      title: "",
      description: "",
      project: "",
      value: "",
      contact: "",
      validUntil: "",
    });
    setIsDialogOpen(false);
    toast.success("Quote created successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Quotes</h1>
          <p className="text-muted-foreground">Manage quotes from initial contact to contract signing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create New Quote</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Quote Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quote title"
                  value={newQuote.title}
                  onChange={(e) => setNewQuote({ ...newQuote, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the quote"
                  value={newQuote.description}
                  onChange={(e) => setNewQuote({ ...newQuote, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project">Client *</Label>
                  <Select
                    value={newQuote.project}
                    onValueChange={(value) => setNewQuote({ ...newQuote, project: value })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select client" />
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
                <div className="grid gap-2">
                  <Label htmlFor="value">Quote Value ($) *</Label>
                  <Input
                    id="value"
                    placeholder="0"
                    value={newQuote.value}
                    onChange={(e) => setNewQuote({ ...newQuote, value: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contact Email</Label>
                  <Input
                    id="contact"
                    type="email"
                    placeholder="client@example.com"
                    value={newQuote.contact}
                    onChange={(e) => setNewQuote({ ...newQuote, contact: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateQuote} className="border-2">
                Create Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[400px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Reject Quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject "{quoteToReject?.title}"?
            </p>
            <div className="grid gap-2">
              <Label htmlFor="reason">Rejection Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="border-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectQuote} className="border-2">
              Reject Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{quotes.length}</div>
                <div className="text-sm text-muted-foreground">Active Quotes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${totalValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <FolderPlus className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${convertedValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Converted to Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-destructive">
                <Archive className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${rejectedValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Rejected Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="border-2 border-border bg-secondary p-1">
          <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Active Quotes ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="converted" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Converted to Projects ({convertedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Rejected ({rejectedQuotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {quotes.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Active Quotes</h3>
                <p className="text-muted-foreground mb-4">Create a new quote to get started.</p>
                <Button onClick={() => setIsDialogOpen(true)} className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  New Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            quotes.map((quote) => (
              <Card
                key={quote.id}
                className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/quotes/${quote.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 border-2 border-border flex items-center justify-center bg-secondary shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{quote.id}</span>
                            <Badge className={statusStyles[quote.status as keyof typeof statusStyles]}>
                              {stageLabels[quote.status as keyof typeof stageLabels]}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{quote.title}</h3>
                          <p className="text-muted-foreground mt-1">{quote.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right border-2 border-border px-3 py-2 bg-secondary">
                            <div className="text-2xl font-bold font-mono">{quote.value}</div>
                            <div className="text-xs text-muted-foreground">Quote Value</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Deal Progress</span>
                          <span className="font-mono font-medium">{quote.stage}%</span>
                        </div>
                        <Progress value={quote.stage} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span><strong className="text-foreground">Client:</strong> {quote.project}</span>
                          <span><strong className="text-foreground">Contact:</strong> {quote.contact}</span>
                          <span><strong className="text-foreground">Valid until:</strong> {quote.validUntil}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-chart-2 text-chart-2 hover:bg-chart-2 hover:text-background"
                            onClick={(e) => handleAcceptQuote(quote, e)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => openRejectDialog(quote, e)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border-2 border-transparent hover:border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotes/${quote.id}`);
                            }}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="converted" className="space-y-4">
          {convertedProjects.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-8 text-center">
                <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Converted Projects Yet</h3>
                <p className="text-muted-foreground">Accept quotes to convert them into projects.</p>
              </CardContent>
            </Card>
          ) : (
            convertedProjects.map((project) => (
              <Card
                key={project.id}
                className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 border-2 border-chart-2 flex items-center justify-center bg-chart-2 shrink-0">
                      <FolderPlus className="h-6 w-6 text-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{project.quoteId}</span>
                        <Badge className="bg-chart-2 text-background">Converted to Project</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-muted-foreground">Client: {project.project}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right border-2 border-border px-3 py-2 bg-secondary">
                        <div className="text-2xl font-bold font-mono">{project.value}</div>
                        <div className="text-xs text-muted-foreground">Project Value</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Converted</div>
                        <div className="text-xs text-muted-foreground">{project.convertedDate}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="border-2 border-transparent hover:border-border"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedQuotes.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-8 text-center">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Rejected Quotes</h3>
                <p className="text-muted-foreground">Rejected quotes will appear here for record keeping.</p>
              </CardContent>
            </Card>
          ) : (
            rejectedQuotes.map((quote) => (
              <Card
                key={quote.id}
                className="border-2 border-border shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 border-2 border-destructive flex items-center justify-center bg-destructive shrink-0">
                      <X className="h-6 w-6 text-destructive-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{quote.id}</span>
                            <Badge className={statusStyles.rejected}>
                              Lost
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{quote.title}</h3>
                          <p className="text-muted-foreground mt-1">{quote.description}</p>
                        </div>

                        <div className="text-right border-2 border-border px-3 py-2 bg-secondary shrink-0">
                          <div className="text-2xl font-bold font-mono line-through text-muted-foreground">{quote.value}</div>
                          <div className="text-xs text-muted-foreground">Lost Value</div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-destructive/10 border-2 border-destructive/20">
                        <div className="text-sm">
                          <strong>Rejection Reason:</strong> {quote.rejectionReason}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Rejected on {quote.rejectedDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">Client:</strong> {quote.project}</span>
                        <span><strong className="text-foreground">Contact:</strong> {quote.contact}</span>
                        <span><strong className="text-foreground">Originally valid until:</strong> {quote.validUntil}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
