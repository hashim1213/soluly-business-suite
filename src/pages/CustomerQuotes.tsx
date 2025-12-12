import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Plus, FileText, ArrowUpRight, DollarSign, Check, X, FolderPlus, Archive, Loader2, Ticket, Building } from "lucide-react";
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
import { toast } from "sonner";
import { useQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, Quote } from "@/hooks/useQuotes";
import { useTickets, useDeleteTicket } from "@/hooks/useTickets";
import { useContacts } from "@/hooks/useContacts";
import { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuoteStatus = Database["public"]["Enums"]["quote_status"];

const statusStyles: Record<string, string> = {
  draft: "bg-slate-400 text-black",
  sent: "bg-blue-600 text-white",
  negotiating: "bg-amber-500 text-black",
  accepted: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
  // Ticket statuses
  open: "bg-blue-600 text-white",
  "in-progress": "bg-amber-500 text-black",
  pending: "bg-slate-400 text-black",
  closed: "bg-slate-600 text-white",
};

const stageLabels: Record<string, string> = {
  draft: "Preparing",
  sent: "Awaiting Response",
  negotiating: "In Negotiation",
  accepted: "Won",
  rejected: "Lost",
  // Ticket statuses
  open: "Open",
  "in-progress": "In Progress",
  pending: "Pending",
  closed: "Closed",
};

// Unified type for quotes and quote tickets
type UnifiedQuote = {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  source: "quote" | "ticket";
  status: string;
  stage: number;
  value: number;
  company_name: string;
  contact_email: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function CustomerQuotes() {
  const { navigateOrg } = useOrgNavigation();
  const { data: quotes, isLoading: quotesLoading, error } = useQuotes();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: contacts } = useContacts();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteTicket = useDeleteTicket();

  const [activeTab, setActiveTab] = useState("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [quoteToReject, setQuoteToReject] = useState<UnifiedQuote | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newQuote, setNewQuote] = useState({
    title: "",
    description: "",
    company_name: "",
    value: "",
    contact_email: "",
    contact_name: "",
    contact_id: "",
    valid_until: "",
  });

  const isLoading = quotesLoading || ticketsLoading;

  // Get quote tickets
  const quoteTickets = useMemo(() => {
    return tickets?.filter(t => t.category === "quote") || [];
  }, [tickets]);

  // Unify quotes and tickets
  const unifiedQuotes: UnifiedQuote[] = useMemo(() => {
    const items: UnifiedQuote[] = [];

    // Add quotes
    quotes?.forEach((quote) => {
      items.push({
        id: quote.id,
        display_id: quote.display_id,
        title: quote.title,
        description: quote.description,
        source: "quote",
        status: quote.status,
        stage: quote.stage,
        value: quote.value,
        company_name: quote.company_name,
        contact_email: quote.contact_email,
        valid_until: quote.valid_until,
        notes: quote.notes,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
      });
    });

    // Add tickets with category="quote"
    quoteTickets.forEach((ticket) => {
      items.push({
        id: ticket.id,
        display_id: ticket.display_id,
        title: ticket.title,
        description: ticket.description,
        source: "ticket",
        status: ticket.status,
        stage: ticket.status === "closed" ? 100 : ticket.status === "in-progress" ? 50 : 10,
        value: 0, // Tickets don't have value
        company_name: ticket.project?.name || "Unknown",
        contact_email: null,
        valid_until: null,
        notes: null,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      });
    });

    // Sort by created_at descending
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [quotes, quoteTickets]);

  // Filter quotes by status
  const activeQuotes = unifiedQuotes.filter(q => q.status !== "rejected" && q.status !== "accepted" && q.status !== "closed");
  const acceptedQuotes = unifiedQuotes.filter(q => q.status === "accepted" || q.status === "closed");
  const rejectedQuotes = unifiedQuotes.filter(q => q.status === "rejected");

  // Separate native quotes and tickets for counting
  const nativeQuotesCount = quotes?.length || 0;
  const ticketsCount = quoteTickets.length;

  // Calculate totals (only from native quotes since tickets don't have value)
  const totalValue = quotes?.filter(q => q.status !== "rejected" && q.status !== "accepted")
    .reduce((sum, q) => sum + (q.value || 0), 0) || 0;
  const convertedValue = quotes?.filter(q => q.status === "accepted")
    .reduce((sum, q) => sum + (q.value || 0), 0) || 0;
  const rejectedValue = quotes?.filter(q => q.status === "rejected")
    .reduce((sum, q) => sum + (q.value || 0), 0) || 0;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAcceptQuote = async (quote: UnifiedQuote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quote.source !== "quote") {
      toast.error("Cannot accept a ticket. Go to ticket details to manage.");
      return;
    }
    try {
      await updateQuote.mutateAsync({
        id: quote.id,
        status: "accepted",
        stage: 100,
      });
      toast.success(`Quote accepted! "${quote.title}" has been marked as won.`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openRejectDialog = (quote: UnifiedQuote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quote.source !== "quote") {
      toast.error("Cannot reject a ticket. Go to ticket details to manage.");
      return;
    }
    setQuoteToReject(quote);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectQuote = async () => {
    if (!quoteToReject || quoteToReject.source !== "quote") return;

    try {
      await updateQuote.mutateAsync({
        id: quoteToReject.id,
        status: "rejected",
        stage: 0,
        notes: rejectionReason ? `Rejection reason: ${rejectionReason}` : quoteToReject.notes,
      });

      setIsRejectDialogOpen(false);
      setQuoteToReject(null);
      setRejectionReason("");
      toast.info(`Quote "${quoteToReject.title}" has been marked as rejected.`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateQuote = async () => {
    if (!newQuote.title || !newQuote.company_name || !newQuote.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createQuote.mutateAsync({
        title: newQuote.title,
        description: newQuote.description || null,
        company_name: newQuote.company_name,
        contact_email: newQuote.contact_email || null,
        value: parseFloat(newQuote.value.replace(/[$,]/g, "")) || 0,
        valid_until: newQuote.valid_until || null,
        status: "draft",
        stage: 10,
      });

      setNewQuote({
        title: "",
        description: "",
        company_name: "",
        value: "",
        contact_email: "",
        valid_until: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = (quote: UnifiedQuote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quote.source === "ticket") {
      deleteTicket.mutate(quote.id);
    }
    // For native quotes, use deleteQuote if needed
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
        <p className="text-destructive">Failed to load quotes</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

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
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
              <div className="grid gap-2">
                <Label>Select Contact</Label>
                <Select
                  value={newQuote.contact_id}
                  onValueChange={(contactId) => {
                    if (contactId === "manual") {
                      setNewQuote({
                        ...newQuote,
                        contact_id: "",
                        contact_name: "",
                        contact_email: "",
                        company_name: "",
                      });
                    } else {
                      const selectedContact = contacts?.find((c) => c.id === contactId);
                      if (selectedContact) {
                        setNewQuote({
                          ...newQuote,
                          contact_id: contactId,
                          contact_name: selectedContact.name,
                          contact_email: selectedContact.email || "",
                          company_name: selectedContact.company?.name || "",
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select from contacts or enter manually" />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="manual">Enter manually</SelectItem>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                        {contact.company?.name && (
                          <span className="text-muted-foreground"> - {contact.company.name}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    placeholder="Company name"
                    value={newQuote.company_name}
                    onChange={(e) => setNewQuote({ ...newQuote, company_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Quote Value ($) *</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0"
                    value={newQuote.value}
                    onChange={(e) => setNewQuote({ ...newQuote, value: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    placeholder="Contact name"
                    value={newQuote.contact_name}
                    onChange={(e) => setNewQuote({ ...newQuote, contact_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="client@example.com"
                    value={newQuote.contact_email}
                    onChange={(e) => setNewQuote({ ...newQuote, contact_email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={newQuote.valid_until}
                  onChange={(e) => setNewQuote({ ...newQuote, valid_until: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleCreateQuote} className="border-2" disabled={createQuote.isPending}>
                {createQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
            <Button variant="destructive" onClick={handleRejectQuote} className="border-2" disabled={updateQuote.isPending}>
              {updateQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
                <div className="text-2xl font-bold">{activeQuotes.length}</div>
                <div className="text-sm text-muted-foreground">Active ({nativeQuotesCount} quotes, {ticketsCount} tickets)</div>
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
                <div className="text-2xl font-bold font-mono">{formatValue(totalValue)}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-emerald-600">
                <FolderPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{formatValue(convertedValue)}</div>
                <div className="text-sm text-muted-foreground">Won Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-red-600">
                <Archive className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{formatValue(rejectedValue)}</div>
                <div className="text-sm text-muted-foreground">Lost Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="border-2 border-border bg-secondary p-1">
          <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Active ({activeQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="converted" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Won ({acceptedQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Lost ({rejectedQuotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeQuotes.length === 0 ? (
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
            activeQuotes.map((quote) => (
              <Card
                key={`${quote.source}-${quote.id}`}
                className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (quote.source === "ticket") {
                    navigateOrg(`/tickets/${quote.display_id}`);
                  } else {
                    navigateOrg(`/quotes/${quote.display_id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 border-2 border-border flex items-center justify-center shrink-0 ${quote.source === "ticket" ? "bg-blue-600" : "bg-secondary"}`}>
                      {quote.source === "ticket" ? (
                        <Ticket className="h-6 w-6 text-white" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{quote.display_id}</span>
                            {quote.source === "ticket" && (
                              <Badge variant="outline" className="border-2 text-xs">
                                <Ticket className="h-3 w-3 mr-1" />
                                Ticket
                              </Badge>
                            )}
                            <Badge className={statusStyles[quote.status] || statusStyles.draft}>
                              {stageLabels[quote.status] || quote.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{quote.title}</h3>
                          <p className="text-muted-foreground mt-1">{quote.description || "No description"}</p>
                        </div>

                        {quote.source === "quote" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right border-2 border-border px-3 py-2 bg-secondary">
                              <div className="text-2xl font-bold font-mono">{formatValue(quote.value)}</div>
                              <div className="text-xs text-muted-foreground">Quote Value</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {quote.source === "quote" && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Deal Progress</span>
                            <span className="font-mono font-medium">{quote.stage}%</span>
                          </div>
                          <Progress value={quote.stage} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {quote.company_name}
                          </span>
                          {quote.contact_email && <span>Contact: {quote.contact_email}</span>}
                          {quote.valid_until && <span>Valid until: {formatDate(quote.valid_until)}</span>}
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {quote.source === "quote" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                onClick={(e) => handleAcceptQuote(quote, e)}
                                disabled={updateQuote.isPending}
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
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border-2 border-transparent hover:border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (quote.source === "ticket") {
                                navigateOrg(`/tickets/${quote.display_id}`);
                              } else {
                                navigateOrg(`/quotes/${quote.display_id}`);
                              }
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
          {acceptedQuotes.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-8 text-center">
                <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Won Deals Yet</h3>
                <p className="text-muted-foreground">Accept quotes to mark them as won.</p>
              </CardContent>
            </Card>
          ) : (
            acceptedQuotes.map((quote) => (
              <Card
                key={`${quote.source}-${quote.id}`}
                className="border-2 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (quote.source === "ticket") {
                    navigateOrg(`/tickets/${quote.display_id}`);
                  } else {
                    navigateOrg(`/quotes/${quote.display_id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 border-2 flex items-center justify-center shrink-0 ${quote.source === "ticket" ? "border-blue-600 bg-blue-600" : "border-emerald-600 bg-emerald-600"}`}>
                      {quote.source === "ticket" ? (
                        <Ticket className="h-6 w-6 text-white" />
                      ) : (
                        <FolderPlus className="h-6 w-6 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{quote.display_id}</span>
                        {quote.source === "ticket" && (
                          <Badge variant="outline" className="border-2 text-xs">
                            <Ticket className="h-3 w-3 mr-1" />
                            Ticket
                          </Badge>
                        )}
                        <Badge className="bg-emerald-600 text-white">Won</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{quote.title}</h3>
                      <p className="text-muted-foreground">Client: {quote.company_name}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {quote.source === "quote" && (
                        <div className="text-right border-2 border-border px-3 py-2 bg-secondary">
                          <div className="text-2xl font-bold font-mono">{formatValue(quote.value)}</div>
                          <div className="text-xs text-muted-foreground">Deal Value</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-sm font-medium">Won</div>
                        <div className="text-xs text-muted-foreground">{formatDate(quote.updated_at)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="border-2 border-transparent hover:border-border"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quote.source === "ticket") {
                            navigateOrg(`/tickets/${quote.display_id}`);
                          } else {
                            navigateOrg(`/quotes/${quote.display_id}`);
                          }
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
                <h3 className="font-semibold mb-2">No Lost Quotes</h3>
                <p className="text-muted-foreground">Rejected quotes will appear here for record keeping.</p>
              </CardContent>
            </Card>
          ) : (
            rejectedQuotes.map((quote) => (
              <Card
                key={`${quote.source}-${quote.id}`}
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
                            <span className="font-mono text-xs text-muted-foreground">{quote.display_id}</span>
                            <Badge className={statusStyles.rejected}>
                              Lost
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{quote.title}</h3>
                          <p className="text-muted-foreground mt-1">{quote.description || "No description"}</p>
                        </div>

                        {quote.source === "quote" && (
                          <div className="text-right border-2 border-border px-3 py-2 bg-secondary shrink-0">
                            <div className="text-2xl font-bold font-mono line-through text-muted-foreground">{formatValue(quote.value)}</div>
                            <div className="text-xs text-muted-foreground">Lost Value</div>
                          </div>
                        )}
                      </div>

                      {quote.notes && quote.notes.includes("Rejection reason:") && (
                        <div className="mt-4 p-3 bg-destructive/10 border-2 border-destructive/20">
                          <div className="text-sm">
                            <strong>Rejection Reason:</strong> {quote.notes.replace("Rejection reason: ", "")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Rejected on {formatDate(quote.updated_at)}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">Client:</strong> {quote.company_name}</span>
                        {quote.contact_email && <span><strong className="text-foreground">Contact:</strong> {quote.contact_email}</span>}
                        {quote.valid_until && <span><strong className="text-foreground">Originally valid until:</strong> {formatDate(quote.valid_until)}</span>}
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
