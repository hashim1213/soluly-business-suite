import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Edit, FileText, Send, MoreVertical, Clock, DollarSign, Mail, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data - in a real app this would come from API/state management
const quotesData: Record<string, {
  id: string;
  title: string;
  description: string;
  project: string;
  projectId: string;
  value: string;
  status: string;
  stage: number;
  contact: string;
  contactName: string;
  company: string;
  validUntil: string;
  created: string;
  updated: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  notes: string;
  terms: string;
}> = {
  "QTE-001": {
    id: "QTE-001",
    title: "Enterprise Package Quote",
    description: "Full enterprise implementation with custom integrations and dedicated support",
    project: "TechStart Inc",
    projectId: "PRJ-002",
    value: "$45,000",
    status: "sent",
    stage: 60,
    contact: "sarah@techstart.io",
    contactName: "Sarah Johnson",
    company: "TechStart Inc",
    validUntil: "Dec 31, 2024",
    created: "Dec 8, 2024",
    updated: "Dec 9, 2024",
    lineItems: [
      { description: "Enterprise License (Annual)", quantity: 1, unitPrice: 25000, total: 25000 },
      { description: "Custom Integration Development", quantity: 40, unitPrice: 200, total: 8000 },
      { description: "Dedicated Support (6 months)", quantity: 6, unitPrice: 1500, total: 9000 },
      { description: "Training Sessions", quantity: 3, unitPrice: 1000, total: 3000 },
    ],
    notes: "Client has requested a 10% discount for annual payment. Pending approval from management.",
    terms: "Payment terms: 50% upfront, 50% on completion. Support begins after implementation.",
  },
  "QTE-002": {
    id: "QTE-002",
    title: "Annual Contract Renewal",
    description: "Renewal of annual support and maintenance contract with expanded scope",
    project: "DataFlow Ltd",
    projectId: "PRJ-004",
    value: "$28,000",
    status: "negotiating",
    stage: 75,
    contact: "david@dataflow.io",
    contactName: "David Miller",
    company: "DataFlow Ltd",
    validUntil: "Jan 15, 2025",
    created: "Dec 6, 2024",
    updated: "Dec 8, 2024",
    lineItems: [
      { description: "Support & Maintenance (Annual)", quantity: 1, unitPrice: 18000, total: 18000 },
      { description: "Additional User Licenses", quantity: 20, unitPrice: 300, total: 6000 },
      { description: "Priority Support Upgrade", quantity: 1, unitPrice: 4000, total: 4000 },
    ],
    notes: "Client wants to add priority support this year. Previous contract was $22,000.",
    terms: "Payment due within 30 days of contract signing.",
  },
  "QTE-003": {
    id: "QTE-003",
    title: "Extended Support Package",
    description: "24/7 premium support with guaranteed 1-hour response time",
    project: "Acme Corp",
    projectId: "PRJ-001",
    value: "$18,500",
    status: "draft",
    stage: 25,
    contact: "john@acmecorp.com",
    contactName: "John Smith",
    company: "Acme Corp",
    validUntil: "Dec 20, 2024",
    created: "Dec 3, 2024",
    updated: "Dec 5, 2024",
    lineItems: [
      { description: "24/7 Premium Support (Annual)", quantity: 1, unitPrice: 15000, total: 15000 },
      { description: "Emergency Response Credits", quantity: 10, unitPrice: 350, total: 3500 },
    ],
    notes: "Draft - needs review before sending to client.",
    terms: "Standard terms apply.",
  },
  "QTE-004": {
    id: "QTE-004",
    title: "Cloud Migration Project",
    description: "Complete migration of on-premise infrastructure to cloud with training",
    project: "Global Solutions",
    projectId: "PRJ-003",
    value: "$72,000",
    status: "accepted",
    stage: 100,
    contact: "emma@globalsol.com",
    contactName: "Emma Williams",
    company: "Global Solutions",
    validUntil: "Nov 30, 2024",
    created: "Nov 15, 2024",
    updated: "Nov 25, 2024",
    lineItems: [
      { description: "Cloud Infrastructure Setup", quantity: 1, unitPrice: 20000, total: 20000 },
      { description: "Data Migration Services", quantity: 1, unitPrice: 25000, total: 25000 },
      { description: "Application Modernization", quantity: 1, unitPrice: 18000, total: 18000 },
      { description: "Staff Training", quantity: 5, unitPrice: 1800, total: 9000 },
    ],
    notes: "Contract signed on Nov 25. Implementation begins Dec 1.",
    terms: "Payment terms: 30% upfront, 40% mid-project, 30% on completion.",
  },
  "QTE-005": {
    id: "QTE-005",
    title: "Custom Integration Development",
    description: "API development and third-party system integrations",
    project: "CloudNine Systems",
    projectId: "PRJ-005",
    value: "$35,000",
    status: "sent",
    stage: 50,
    contact: "lisa@cloudnine.io",
    contactName: "Lisa Chen",
    company: "CloudNine Systems",
    validUntil: "Jan 5, 2025",
    created: "Dec 1, 2024",
    updated: "Dec 2, 2024",
    lineItems: [
      { description: "API Development", quantity: 80, unitPrice: 250, total: 20000 },
      { description: "Third-party Integrations", quantity: 3, unitPrice: 4000, total: 12000 },
      { description: "Documentation & Testing", quantity: 1, unitPrice: 3000, total: 3000 },
    ],
    notes: "Awaiting client feedback on scope of integrations.",
    terms: "Payment terms: 50% upfront, 50% on delivery.",
  },
};

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

export default function QuoteDetail() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [note, setNote] = useState("");

  const quote = quotesData[quoteId || ""];

  // Initialize status from quote data
  if (quote && !status) {
    setStatus(quote.status);
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/tickets/quotes")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground">The quote you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = quote.lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/tickets/quotes")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{quote.id}</span>
            <Badge className={statusStyles[quote.status as keyof typeof statusStyles]}>
              {stageLabels[quote.status as keyof typeof stageLabels]}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{quote.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{quote.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-2">
            <Send className="h-4 w-4 mr-2" />
            Send to Client
          </Button>
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
              <DropdownMenuItem>Duplicate Quote</DropdownMenuItem>
              <DropdownMenuItem>Download PDF</DropdownMenuItem>
              <DropdownMenuItem>Create Invoice</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Quote</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{quote.value}</div>
                <div className="text-sm text-muted-foreground">Quote Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold truncate">{quote.company}</div>
                <div className="text-sm text-muted-foreground">Company</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold">{quote.validUntil}</div>
                <div className="text-sm text-muted-foreground">Valid Until</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <FileText className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{quote.stage}%</div>
                <div className="text-sm text-muted-foreground">Deal Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Qty</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Unit Price</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.lineItems.map((item, index) => (
                    <TableRow key={index} className="border-b-2">
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono">${item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-4 border-border bg-secondary/50">
                    <TableCell colSpan={3} className="text-right font-bold uppercase">Subtotal</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg">${subtotal.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Internal Notes</div>
                <p className="text-muted-foreground">{quote.notes}</p>
              </div>
              <div className="border-t-2 border-border pt-4">
                <div className="text-sm font-medium mb-2">Terms & Conditions</div>
                <p className="text-muted-foreground">{quote.terms}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                placeholder="Add an internal note about this quote..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border-2 min-h-[100px] mb-3"
              />
              <div className="flex justify-end">
                <Button disabled={!note.trim()} className="border-2">
                  <Send className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Quote Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status</div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-2">Deal Progress</div>
                <Progress value={quote.stage} className="h-3" />
                <div className="text-right font-mono text-sm mt-1">{quote.stage}%</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarFallback className="bg-secondary">
                    {quote.contactName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{quote.contactName}</div>
                  <div className="text-sm text-muted-foreground">{quote.company}</div>
                </div>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${quote.contact}`} className="text-primary hover:underline">
                    {quote.contact}
                  </a>
                </div>
              </div>

              <div className="border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground mb-1">Project</div>
                <span
                  className="font-medium hover:text-primary cursor-pointer"
                  onClick={() => navigate(`/projects/${quote.projectId}`)}
                >
                  {quote.project}
                </span>
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
                <span className="font-medium">{quote.created}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{quote.updated}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Valid Until:</span>
                <span className="font-medium">{quote.validUntil}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
