import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit, FileText, Send, MoreVertical, Clock, DollarSign, Mail, Calendar, Building, Plus, Trash2, Save, X, Loader2, Download, Receipt } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF, InvoiceData } from "@/components/invoice/InvoicePDF";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useQuoteByDisplayId,
  useUpdateQuote,
  useDeleteQuote,
  useQuoteLineItems,
  useBulkUpdateQuoteLineItems,
  QuoteLineItem,
} from "@/hooks/useQuotes";

// Local state type for editing line items
type EditableLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  isNew?: boolean;
};

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-chart-1 text-background",
  negotiating: "bg-chart-4 text-foreground",
  accepted: "bg-chart-2 text-background",
  rejected: "bg-destructive text-destructive-foreground",
};

const stageLabels: Record<string, string> = {
  draft: "Preparing",
  sent: "Awaiting Response",
  negotiating: "In Negotiation",
  accepted: "Won",
  rejected: "Lost",
};

const stageValues: Record<string, number> = {
  draft: 10,
  sent: 40,
  negotiating: 70,
  accepted: 100,
  rejected: 0,
};

export default function QuoteDetail() {
  const { quoteId } = useParams();
  const { navigateOrg } = useOrgNavigation();
  const canViewAmounts = useCanViewAmounts();
  const { organization } = useAuth();
  const { data: orgDetails } = useCurrentOrganization();
  const { data: quote, isLoading, error } = useQuoteByDisplayId(quoteId);
  const { data: dbLineItems, isLoading: lineItemsLoading } = useQuoteLineItems(quote?.id);
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const bulkUpdateLineItems = useBulkUpdateQuoteLineItems();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    company_name: string;
    contact_name: string;
    contact_email: string;
    value: number;
    valid_until: string;
    notes: string;
    billing_address: string;
    terms: string;
    tax_rate: number;
    po_number: string;
  } | null>(null);

  const [editLineItems, setEditLineItems] = useState<EditableLineItem[]>([]);
  const [isEditingLineItems, setIsEditingLineItems] = useState(false);

  // Initialize edit line items from database
  useEffect(() => {
    if (dbLineItems && !isEditingLineItems) {
      setEditLineItems(
        dbLineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
    }
  }, [dbLineItems, isEditingLineItems]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    if (!canViewAmounts) return "••••••";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!quote) return;
    try {
      await updateQuote.mutateAsync({
        id: quote.id,
        status: newStatus as "draft" | "sent" | "negotiating" | "accepted" | "rejected",
        stage: stageValues[newStatus] || 10,
      });
      toast.success(`Quote status updated to ${stageLabels[newStatus]}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleStartEdit = () => {
    if (!quote) return;
    setEditData({
      title: quote.title,
      description: quote.description || "",
      company_name: quote.company_name,
      contact_name: quote.contact_name || "",
      contact_email: quote.contact_email || "",
      value: quote.value,
      valid_until: quote.valid_until ? quote.valid_until.split("T")[0] : "",
      notes: quote.notes || "",
      billing_address: (quote as any).billing_address || "",
      terms: (quote as any).terms || (orgDetails as any)?.default_invoice_terms || "",
      tax_rate: (quote as any).tax_rate || 0,
      po_number: (quote as any).po_number || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!quote || !editData) return;

    try {
      await updateQuote.mutateAsync({
        id: quote.id,
        title: editData.title,
        description: editData.description || null,
        company_name: editData.company_name,
        contact_name: editData.contact_name || null,
        contact_email: editData.contact_email || null,
        value: editData.value,
        valid_until: editData.valid_until || null,
        notes: editData.notes || null,
        billing_address: editData.billing_address || null,
        terms: editData.terms || null,
        tax_rate: editData.tax_rate || null,
        po_number: editData.po_number || null,
      } as any);
      toast.success("Quote updated successfully");
      setIsEditing(false);
      setEditData(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm("Are you sure you want to delete this quote?")) return;

    try {
      await deleteQuote.mutateAsync(quote.id);
      toast.success("Quote deleted");
      navigateOrg("/tickets/quotes");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Generate invoice number if not exists
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const quoteNum = quote?.display_id?.replace("QTE-", "") || "001";
    return `INV-${year}${month}-${quoteNum}`;
  };

  // Create invoice from quote
  const handleCreateInvoice = async () => {
    if (!quote) return;

    const invoiceNumber = (quote as any).invoice_number || generateInvoiceNumber();
    const invoiceDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    try {
      await updateQuote.mutateAsync({
        id: quote.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        terms: (quote as any).terms || (orgDetails as any)?.default_invoice_terms || "Payment is due within 30 days.",
        invoice_notes: (quote as any).invoice_notes || (orgDetails as any)?.default_invoice_notes || null,
      } as any);
      toast.success(`Invoice ${invoiceNumber} created successfully`);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Download PDF invoice
  const handleDownloadPdf = async () => {
    if (!quote || !dbLineItems) return;

    setIsGeneratingPdf(true);

    try {
      const org = orgDetails as any;
      const q = quote as any;

      // Calculate totals
      const subtotal = dbLineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxRate = q.tax_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const amountPaid = q.amount_paid || 0;
      const balanceDue = total - amountPaid;

      // Build invoice data
      const invoiceData: InvoiceData = {
        // Invoice details
        invoiceNumber: q.invoice_number || quote.display_id,
        invoiceDate: q.invoice_date || new Date().toISOString(),
        dueDate: q.due_date || undefined,
        poNumber: q.po_number || undefined,

        // Company info from organization
        companyName: org?.billing_name || organization?.name || "Your Company",
        companyAddress: org?.billing_address || undefined,
        companyCity: org?.billing_city || undefined,
        companyState: org?.billing_state || undefined,
        companyPostalCode: org?.billing_postal_code || undefined,
        companyCountry: org?.billing_country || undefined,
        companyPhone: org?.billing_phone || undefined,
        companyEmail: org?.billing_email || undefined,
        companyLogo: organization?.logo_url || undefined,
        taxNumber: org?.tax_number || undefined,

        // Client info
        clientName: quote.company_name,
        clientAddress: q.billing_address || undefined,
        contactName: quote.contact_name || undefined,
        contactEmail: quote.contact_email || undefined,

        // Line items
        lineItems: dbLineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),

        // Totals
        subtotal,
        taxRate: taxRate > 0 ? taxRate : undefined,
        taxAmount: taxAmount > 0 ? taxAmount : undefined,
        total,
        amountPaid: amountPaid > 0 ? amountPaid : undefined,
        balanceDue,

        // Footer
        notes: q.invoice_notes || org?.default_invoice_notes || undefined,
        terms: q.terms || org?.default_invoice_terms || undefined,
      };

      // Generate PDF
      const blob = await pdf(<InvoicePDF data={invoiceData} />).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Invoice PDF downloaded");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Line item functions
  const addLineItem = () => {
    const newItem: EditableLineItem = {
      id: `new-${Date.now()}`,
      description: "",
      quantity: 1,
      unit_price: 0,
      isNew: true,
    };
    setEditLineItems([...editLineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof EditableLineItem, value: string | number) => {
    setEditLineItems(editLineItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setEditLineItems(editLineItems.filter(item => item.id !== id));
  };

  const saveLineItems = async () => {
    if (!quote) return;

    try {
      await bulkUpdateLineItems.mutateAsync({
        quoteId: quote.id,
        lineItems: editLineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      setIsEditingLineItems(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const cancelEditLineItems = () => {
    // Reset to database values
    if (dbLineItems) {
      setEditLineItems(
        dbLineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
    }
    setIsEditingLineItems(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets/quotes")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground">The quote "{quoteId}" doesn't exist or was deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals from line items
  const lineItems = isEditingLineItems ? editLineItems : (dbLineItems || []);
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = 'quantity' in item ? item.quantity : 0;
    const price = 'unit_price' in item ? item.unit_price : 0;
    return sum + (qty * price);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigateOrg("/tickets/quotes")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-muted-foreground">{quote.display_id}</span>
            <Badge className={statusStyles[quote.status] || statusStyles.draft}>
              {stageLabels[quote.status] || quote.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{quote.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{quote.description || "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-2">
            <Send className="h-4 w-4 mr-2" />
            Send to Client
          </Button>
          <Button variant="outline" className="border-2" onClick={handleStartEdit}>
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
              <DropdownMenuItem onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateInvoice}>
                <Receipt className="h-4 w-4 mr-2" />
                {(quote as any)?.invoice_number ? "Update Invoice" : "Create Invoice"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Quote
              </DropdownMenuItem>
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
                <div className="text-2xl font-bold font-mono">{formatCurrency(quote.value)}</div>
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
                <div className="text-lg font-bold truncate">{quote.company_name}</div>
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
                <div className="text-lg font-bold">{formatDate(quote.valid_until)}</div>
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
            <CardHeader className="border-b-2 border-border flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              {!isEditingLineItems ? (
                <Button variant="outline" size="sm" className="border-2" onClick={() => setIsEditingLineItems(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Items
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-2" onClick={cancelEditLineItems}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" className="border-2" onClick={saveLineItems} disabled={bulkUpdateLineItems.isPending}>
                    {bulkUpdateLineItems.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {lineItemsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : lineItems.length === 0 && !isEditingLineItems ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Line Items</h3>
                  <p className="text-muted-foreground mb-4">Add line items to break down the quote.</p>
                  <Button variant="outline" onClick={() => { setIsEditingLineItems(true); addLineItem(); }} className="border-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 hover:bg-transparent">
                        <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-right w-20">Qty</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-right w-32">Unit Price</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-right w-32">Total</TableHead>
                        {isEditingLineItems && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isEditingLineItems ? editLineItems : (dbLineItems || [])).map((item) => {
                        const qty = 'quantity' in item ? item.quantity : 0;
                        const price = 'unit_price' in item ? item.unit_price : 0;
                        const total = qty * price;

                        return (
                          <TableRow key={item.id} className="border-b-2">
                            <TableCell>
                              {isEditingLineItems ? (
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                                  placeholder="Item description"
                                  className="border-2"
                                />
                              ) : (
                                <span className="font-medium">{item.description || "Unnamed item"}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditingLineItems ? (
                                <Input
                                  type="number"
                                  value={qty}
                                  onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                  className="border-2 w-20 text-right"
                                />
                              ) : (
                                <span className="font-mono">{qty}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditingLineItems ? (
                                <Input
                                  type="number"
                                  value={price}
                                  onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                                  className="border-2 w-32 text-right"
                                />
                              ) : (
                                <span className="font-mono">{formatCurrency(price)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatCurrency(total)}
                            </TableCell>
                            {isEditingLineItems && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeLineItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      {isEditingLineItems && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Button variant="outline" size="sm" onClick={addLineItem} className="border-2 w-full border-dashed">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Line Item
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                      {lineItems.length > 0 && (
                        <TableRow className="border-t-4 border-border bg-secondary/50">
                          <TableCell colSpan={isEditingLineItems ? 4 : 3} className="text-right font-bold uppercase">Subtotal</TableCell>
                          <TableCell className="text-right font-mono font-bold text-lg">{formatCurrency(subtotal)}</TableCell>
                          {isEditingLineItems && <TableCell></TableCell>}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-muted-foreground">{quote.notes || "No notes added."}</p>
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
                <Select value={quote.status} onValueChange={handleStatusChange} disabled={updateQuote.isPending}>
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
                    {(quote.contact_name || quote.company_name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{quote.contact_name || "No contact name"}</div>
                  <div className="text-sm text-muted-foreground">{quote.company_name}</div>
                </div>
              </div>

              {quote.contact_email && (
                <div className="border-t-2 border-border pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${quote.contact_email}`} className="text-primary hover:underline">
                      {quote.contact_email}
                    </a>
                  </div>
                </div>
              )}
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
                <span className="font-medium">{formatDate(quote.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{formatDate(quote.updated_at)}</span>
              </div>
              {quote.valid_until && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span className="font-medium">{formatDate(quote.valid_until)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Quote Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="border-2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Quote</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Quote Title *</Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-company">Company Name *</Label>
                  <Input
                    id="edit-company"
                    value={editData.company_name}
                    onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Quote Value ($)</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={editData.value}
                    onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) || 0 })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact-name">Contact Name</Label>
                  <Input
                    id="edit-contact-name"
                    value={editData.contact_name}
                    onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact-email">Contact Email</Label>
                  <Input
                    id="edit-contact-email"
                    type="email"
                    value={editData.contact_email}
                    onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-valid-until">Valid Until</Label>
                  <Input
                    id="edit-valid-until"
                    type="date"
                    value={editData.valid_until}
                    onChange={(e) => setEditData({ ...editData, valid_until: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-po-number">PO Number</Label>
                  <Input
                    id="edit-po-number"
                    value={editData.po_number}
                    onChange={(e) => setEditData({ ...editData, po_number: e.target.value })}
                    placeholder="Client PO number"
                    className="border-2"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-billing-address">Client Billing Address</Label>
                <Textarea
                  id="edit-billing-address"
                  value={editData.billing_address}
                  onChange={(e) => setEditData({ ...editData, billing_address: e.target.value })}
                  placeholder="Full billing address for the invoice"
                  className="border-2"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tax-rate">Tax Rate (%)</Label>
                <Input
                  id="edit-tax-rate"
                  type="number"
                  step="0.01"
                  value={editData.tax_rate}
                  onChange={(e) => setEditData({ ...editData, tax_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="border-2 w-32"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="border-2"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-terms">Invoice Terms</Label>
                <Textarea
                  id="edit-terms"
                  value={editData.terms}
                  onChange={(e) => setEditData({ ...editData, terms: e.target.value })}
                  placeholder="Payment terms for this invoice"
                  className="border-2"
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="border-2" disabled={updateQuote.isPending}>
              {updateQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
