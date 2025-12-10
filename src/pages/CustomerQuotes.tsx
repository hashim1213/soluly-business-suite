import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, ArrowUpRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    id: "QTE-004",
    title: "Cloud Migration Project",
    description: "Complete migration of on-premise infrastructure to cloud with training",
    project: "Global Solutions",
    value: "$72,000",
    status: "accepted",
    stage: 100,
    contact: "emma@globalsol.com",
    validUntil: "Nov 30, 2024",
    created: "Nov 15, 2024",
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({
    title: "",
    description: "",
    project: "",
    value: "",
    contact: "",
    validUntil: "",
  });

  const totalValue = quotes.reduce((sum, q) => sum + parseInt(q.value.replace(/[$,]/g, '')), 0);
  const acceptedValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + parseInt(q.value.replace(/[$,]/g, '')), 0);

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
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={newQuote.project}
                    onValueChange={(value) => setNewQuote({ ...newQuote, project: value })}
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

      <div className="grid gap-4 md:grid-cols-3">
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
                <div className="text-sm text-muted-foreground">Total Pipeline</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <DollarSign className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${acceptedValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Won Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {quotes.map((quote) => (
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

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Deal Progress</span>
                      <span className="font-mono font-medium">{quote.stage}%</span>
                    </div>
                    <Progress value={quote.stage} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Project:</strong> {quote.project}</span>
                    <span><strong className="text-foreground">Contact:</strong> {quote.contact}</span>
                    <span><strong className="text-foreground">Valid until:</strong> {quote.validUntil}</span>
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
