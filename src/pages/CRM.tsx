import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Plus,
  Search,
  DollarSign,
  MoreVertical,
  Trash2,
  ArrowRight,
  Target,
  Handshake,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";
import { useQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, useCreateActivity, Quote } from "@/hooks/useQuotes";
import { useCrmClients } from "@/hooks/useCRM";
import { Database } from "@/integrations/supabase/types";

type QuoteStatus = Database["public"]["Enums"]["quote_status"];
type ActivityType = Database["public"]["Enums"]["activity_type"];

// Pipeline stages - maps to quote statuses
const pipelineStages = [
  { id: "draft", name: "Lead", color: "bg-slate-200", textDark: false },
  { id: "sent", name: "Proposal", color: "bg-blue-500", textDark: true },
  { id: "negotiating", name: "Negotiation", color: "bg-purple-500", textDark: true },
  { id: "accepted", name: "Won", color: "bg-green-500", textDark: true },
  { id: "rejected", name: "Lost", color: "bg-red-500", textDark: true },
];

export default function CRM() {
  const navigate = useNavigate();
  const { data: quotes, isLoading, error } = useQuotes();
  const { data: clients } = useCrmClients();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const createActivity = useCreateActivity();

  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    company_name: "",
    contact_name: "",
    contact_email: "",
    value: "",
    valid_until: "",
    notes: "",
  });
  const [newActivity, setNewActivity] = useState({
    type: "call" as ActivityType,
    description: "",
    duration: "",
  });

  // Filter quotes by search
  const filteredQuotes = quotes?.filter((quote) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quote.title.toLowerCase().includes(query) ||
      quote.company_name.toLowerCase().includes(query) ||
      quote.contact_name?.toLowerCase().includes(query)
    );
  }) || [];

  // Group deals by stage
  const dealsByStage = pipelineStages.map((stage) => ({
    ...stage,
    deals: filteredQuotes.filter((q) => q.status === stage.id),
    totalValue: filteredQuotes
      .filter((q) => q.status === stage.id)
      .reduce((sum, q) => sum + q.value, 0),
  }));

  // Calculate pipeline stats
  const totalPipelineValue = filteredQuotes
    .filter((q) => q.status !== "rejected" && q.status !== "accepted")
    .reduce((sum, q) => sum + q.value, 0);
  const wonValue = filteredQuotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.value, 0);
  const activeDeals = filteredQuotes.filter(
    (q) => q.status !== "rejected" && q.status !== "accepted"
  ).length;

  const handleCreateDeal = async () => {
    if (!newDeal.title || !newDeal.company_name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await createQuote.mutateAsync({
        title: newDeal.title,
        description: newDeal.description || null,
        company_name: newDeal.company_name,
        contact_name: newDeal.contact_name || null,
        contact_email: newDeal.contact_email || null,
        value: parseFloat(newDeal.value) || 0,
        valid_until: newDeal.valid_until || null,
        notes: newDeal.notes || null,
        status: "draft",
        stage: 10,
      });

      setNewDeal({
        title: "",
        description: "",
        company_name: "",
        contact_name: "",
        contact_email: "",
        value: "",
        valid_until: "",
        notes: "",
      });
      setIsNewDealOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleMoveStage = (quoteId: string, newStatus: QuoteStatus) => {
    const stageProgress: Record<QuoteStatus, number> = {
      draft: 10,
      sent: 50,
      negotiating: 75,
      accepted: 100,
      rejected: 0,
    };
    updateQuote.mutate({
      id: quoteId,
      status: newStatus,
      stage: stageProgress[newStatus],
    });
  };

  const handleLogActivity = async () => {
    if (!selectedQuoteId || !newActivity.description) {
      toast.error("Please fill in the activity description");
      return;
    }

    try {
      await createActivity.mutateAsync({
        quote_id: selectedQuoteId,
        type: newActivity.type,
        description: newActivity.description,
        duration: newActivity.duration || null,
      });

      setNewActivity({ type: "call", description: "", duration: "" });
      setIsActivityDialogOpen(false);
      setSelectedQuoteId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load CRM data</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Pipeline</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and deals</p>
        </div>
        <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[500px]">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Deal Title *</Label>
                <Input
                  placeholder="e.g., Enterprise Package Quote"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the deal..."
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="Company name"
                    value={newDeal.company_name}
                    onChange={(e) => setNewDeal({ ...newDeal, company_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deal Value ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="Contact name"
                    value={newDeal.contact_name}
                    onChange={(e) => setNewDeal({ ...newDeal, contact_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    value={newDeal.contact_email}
                    onChange={(e) => setNewDeal({ ...newDeal, contact_email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={newDeal.valid_until}
                  onChange={(e) => setNewDeal({ ...newDeal, valid_until: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Internal notes..."
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsNewDealOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateDeal} className="border-2" disabled={createQuote.isPending}>
                {createQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                <Target className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{formatValue(totalPipelineValue)}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
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
                <div className="text-2xl font-bold font-mono">{formatValue(wonValue)}</div>
                <div className="text-sm text-muted-foreground">Won Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeDeals}</div>
                <div className="text-sm text-muted-foreground">Active Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{clients?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-2"
        />
      </div>

      {/* Pipeline View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {dealsByStage.map((stage) => (
          <Card key={stage.id} className="border-2 border-border shadow-sm">
            <CardHeader className={`py-3 px-4 ${stage.color} ${stage.textDark ? "text-white" : ""}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">{stage.name}</CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-current border-0">
                  {stage.deals.length}
                </Badge>
              </div>
              <div className={`text-xs ${stage.textDark ? "text-white/80" : "text-muted-foreground"}`}>
                {formatValue(stage.totalValue)}
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-2 min-h-[200px]">
              {stage.deals.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No deals
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/quotes/${deal.display_id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{deal.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {deal.company_name}
                          </p>
                          <p className="text-sm font-mono font-bold mt-1">
                            {formatValue(deal.value)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-2">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuoteId(deal.id);
                              setIsActivityDialogOpen(true);
                            }}>
                              <Phone className="h-4 w-4 mr-2" />
                              Log Activity
                            </DropdownMenuItem>
                            {stage.id !== "sent" && stage.id !== "negotiating" && stage.id !== "accepted" && stage.id !== "rejected" && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStage(deal.id, "sent");
                              }}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Move to Proposal
                              </DropdownMenuItem>
                            )}
                            {stage.id !== "negotiating" && stage.id !== "accepted" && stage.id !== "rejected" && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStage(deal.id, "negotiating");
                              }}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Move to Negotiation
                              </DropdownMenuItem>
                            )}
                            {stage.id !== "accepted" && stage.id !== "rejected" && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal.id, "accepted");
                                }} className="text-green-600">
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                  Mark as Won
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal.id, "rejected");
                                }} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Mark as Lost
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuote.mutate(deal.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Deal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Progress value={deal.stage} className="h-1 mt-2" />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[400px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Activity Type</Label>
              <Select value={newActivity.type} onValueChange={(value: ActivityType) => setNewActivity({ ...newActivity, type: value })}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Call
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" /> Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="note">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Note
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the activity..."
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="border-2"
              />
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <Input
                placeholder="e.g., 30 min"
                value={newActivity.duration}
                onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                className="border-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleLogActivity} className="border-2" disabled={createActivity.isPending}>
              {createActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Log Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
