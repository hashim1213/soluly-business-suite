import { useState, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InvoicePDF, InvoiceData } from "@/components/invoice/InvoicePDF";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import {
  useAllProjectInvoices,
  useCreateProjectInvoice,
  useUpdateProjectInvoice,
  useDeleteProjectInvoice,
  ProjectInvoice,
  INVOICE_STATUSES,
} from "@/hooks/useProjectInvoices";
import { useInvoiceLineItems, useSaveInvoiceLineItems, InvoiceLineItemInput } from "@/hooks/useInvoiceLineItems";
import { useProjects } from "@/hooks/useProjects";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  Plus,
  FileText,
  Loader2,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  Trash2,
  Pencil,
  FolderKanban,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = date.includes("T") ? new Date(date) : new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

interface InvoiceFormData {
  project_id: string;
  description: string;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  invoice_number: string;
  notes: string;
  tax_rate: string;
  tax_amount_override: string;
  client_name: string;
  client_address: string;
  client_city: string;
  client_state: string;
  client_postal_code: string;
  client_email: string;
}

const emptyForm: InvoiceFormData = {
  project_id: "",
  description: "",
  status: "draft",
  due_date: "",
  invoice_number: "",
  notes: "",
  tax_rate: "0",
  tax_amount_override: "",
  client_name: "",
  client_address: "",
  client_city: "",
  client_state: "",
  client_postal_code: "",
  client_email: "",
};

const emptyLineItem = (): InvoiceLineItemInput => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

export default function Invoices() {
  const { navigateOrg } = useOrgNavigation();
  const { organization } = useAuth();
  const { data: orgDetails } = useCurrentOrganization();
  const { data: invoices, isLoading: invoicesLoading } = useAllProjectInvoices();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createInvoice = useCreateProjectInvoice();
  const updateInvoice = useUpdateProjectInvoice();
  const deleteInvoice = useDeleteProjectInvoice();
  const saveLineItems = useSaveInvoiceLineItems();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<ProjectInvoice | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(emptyForm);
  const [lineItems, setLineItems] = useState<InvoiceLineItemInput[]>([emptyLineItem()]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: editLineItems } = useInvoiceLineItems(editingInvoice?.id);

  const isLoading = invoicesLoading || projectsLoading;

  const projectMap = new Map(projects?.map((p) => [p.id, p]) ?? []);

  const filteredInvoices = (invoices ?? []).filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (projectFilter !== "all" && inv.project_id !== projectFilter) return false;
    return true;
  });

  const invoicesByProject = new Map<string, ProjectInvoice[]>();
  for (const inv of filteredInvoices) {
    const list = invoicesByProject.get(inv.project_id) || [];
    list.push(inv);
    invoicesByProject.set(inv.project_id, list);
  }

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = filteredInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = filteredInvoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0);
  const totalDraft = filteredInvoices.filter((inv) => inv.status === "draft").reduce((sum, inv) => sum + inv.amount, 0);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [lineItems]
  );
  const taxRate = parseFloat(form.tax_rate) || 0;
  const taxAmountOverride = parseFloat(form.tax_amount_override);
  const taxAmount = !isNaN(taxAmountOverride) && form.tax_amount_override !== "" ? taxAmountOverride : subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const openCreate = () => {
    setForm(emptyForm);
    setEditingInvoice(null);
    setLineItems([emptyLineItem()]);
    setIsCreateOpen(true);
  };

  const fillClientFromProject = (projectId: string): Partial<InvoiceFormData> => {
    const project = projectMap.get(projectId);
    if (!project) return {};
    return {
      client_name: project.client_name || "",
      client_email: project.client_email || "",
      client_address: "",
      client_city: "",
      client_state: "",
      client_postal_code: "",
    };
  };

  const fillClientAsync = async (projectId: string) => {
    const project = projectMap.get(projectId) as any;
    if (!project?.client_id) return;
    const { data: client } = await supabase
      .from("crm_clients")
      .select("name, address, contact_name, contact_email, contact_phone")
      .eq("id", project.client_id)
      .single();
    if (client) {
      setForm((f) => ({
        ...f,
        client_name: client.name || f.client_name,
        client_email: client.contact_email || f.client_email,
        client_address: client.address || f.client_address,
      }));
    }
  };

  const openEdit = (invoice: ProjectInvoice) => {
    setEditingInvoice(invoice);
    const project = projectMap.get(invoice.project_id);
    setForm({
      project_id: invoice.project_id,
      description: invoice.description,
      status: invoice.status,
      due_date: invoice.due_date?.split("T")[0] ?? "",
      invoice_number: invoice.invoice_number ?? "",
      notes: invoice.notes ?? "",
      tax_rate: (invoice.tax_rate ?? 0).toString(),
      tax_amount_override: invoice.tax_amount && invoice.tax_amount > 0 ? invoice.tax_amount.toString() : "",
      client_name: invoice.client_name || project?.client_name || "",
      client_email: invoice.client_email || project?.client_email || "",
      client_address: invoice.client_address || "",
      client_city: invoice.client_city || "",
      client_state: invoice.client_state || "",
      client_postal_code: invoice.client_postal_code || "",
    });
    if (editLineItems && editLineItems.length > 0) {
      setLineItems(
        editLineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
        }))
      );
    } else if (invoice.amount > 0) {
      setLineItems([
        { description: invoice.description, quantity: 1, unit_price: invoice.amount },
      ]);
    } else {
      setLineItems([emptyLineItem()]);
    }
    setIsCreateOpen(true);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, emptyLineItem()]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItemInput, value: string | number) => {
    setLineItems(
      lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.description) return;

    const validItems = lineItems.filter((li) => li.description.trim() && li.unit_price > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one line item with a description and price");
      return;
    }

    const invoiceSubtotal = validItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
    const overrideAmt = parseFloat(form.tax_amount_override);
    const invoiceTaxAmount = !isNaN(overrideAmt) && form.tax_amount_override !== "" ? overrideAmt : invoiceSubtotal * (taxRate / 100);
    const invoiceTotal = invoiceSubtotal + invoiceTaxAmount;

    const billingFields = {
      client_name: form.client_name || undefined,
      client_email: form.client_email || undefined,
      client_address: form.client_address || undefined,
      client_city: form.client_city || undefined,
      client_state: form.client_state || undefined,
      client_postal_code: form.client_postal_code || undefined,
    };

    try {
      if (editingInvoice) {
        await updateInvoice.mutateAsync({
          id: editingInvoice.id,
          description: form.description,
          amount: invoiceTotal,
          status: form.status,
          due_date: form.due_date || undefined,
          invoice_number: form.invoice_number || undefined,
          notes: form.notes || undefined,
          tax_rate: taxRate,
          tax_amount: invoiceTaxAmount,
          subtotal: invoiceSubtotal,
          paid_date: form.status === "paid" && !editingInvoice.paid_date ? new Date().toISOString() : undefined,
          ...billingFields,
        });
        await saveLineItems.mutateAsync({ invoiceId: editingInvoice.id, lineItems: validItems });
      } else {
        const invoice = await createInvoice.mutateAsync({
          project_id: form.project_id,
          description: form.description,
          amount: invoiceTotal,
          status: form.status,
          due_date: form.due_date || undefined,
          invoice_number: form.invoice_number || undefined,
          notes: form.notes || undefined,
          tax_rate: taxRate,
          tax_amount: invoiceTaxAmount,
          subtotal: invoiceSubtotal,
          ...billingFields,
        });
        if (invoice?.id) {
          await saveLineItems.mutateAsync({ invoiceId: invoice.id, lineItems: validItems });
        }
      }

      setIsCreateOpen(false);
      setEditingInvoice(null);
      setForm(emptyForm);
      setLineItems([emptyLineItem()]);
    } catch {
      // Errors handled by hooks
    }
  };

  const handleDownloadPdf = async (invoice: ProjectInvoice) => {
    setDownloadingId(invoice.id);
    try {
      const { data: items } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order", { ascending: true });

      const project = projectMap.get(invoice.project_id);
      const org = orgDetails as any;

      const pdfLineItems =
        items && items.length > 0
          ? items.map((li: any) => ({
              description: li.description,
              quantity: li.quantity,
              unit_price: li.unit_price,
            }))
          : [{ description: invoice.description, quantity: 1, unit_price: invoice.amount }];

      const pdfSubtotal = pdfLineItems.reduce(
        (sum: number, li: any) => sum + li.quantity * li.unit_price,
        0
      );
      const pdfTaxRate = invoice.tax_rate ?? 0;
      const pdfTaxAmount = invoice.tax_amount ?? pdfSubtotal * (pdfTaxRate / 100);
      const pdfTotal = pdfSubtotal + pdfTaxAmount;

      const invoiceData: InvoiceData = {
        invoiceNumber: invoice.invoice_number || invoice.display_id,
        invoiceDate: invoice.created_at,
        dueDate: invoice.due_date || undefined,

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

        clientName: invoice.client_name || project?.client_name || "Client",
        clientAddress: invoice.client_address || undefined,
        clientCity: invoice.client_city || undefined,
        clientState: invoice.client_state || undefined,
        clientPostalCode: invoice.client_postal_code || undefined,
        contactEmail: invoice.client_email || project?.client_email || undefined,

        lineItems: pdfLineItems,

        subtotal: pdfSubtotal,
        taxRate: pdfTaxRate > 0 ? pdfTaxRate : undefined,
        taxAmount: pdfTaxAmount > 0 ? pdfTaxAmount : undefined,
        total: pdfTotal,
        balanceDue: invoice.status === "paid" ? 0 : pdfTotal,

        notes: invoice.notes || org?.default_invoice_notes || undefined,
        terms: org?.default_invoice_terms || undefined,
      };

      const blob = await pdf(<InvoicePDF data={invoiceData} />).toBlob();
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
      setDownloadingId(null);
    }
  };

  const renderStatusBadge = (status: ProjectInvoice["status"]) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} border-0 gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const renderInvoiceRow = (invoice: ProjectInvoice, showProject = true) => {
    const project = projectMap.get(invoice.project_id);
    return (
      <TableRow key={invoice.id}>
        <TableCell className="font-medium">{invoice.display_id}</TableCell>
        <TableCell>{invoice.invoice_number || "—"}</TableCell>
        <TableCell className="max-w-[200px] truncate">{invoice.description}</TableCell>
        {showProject && (
          <TableCell>
            {project ? (
              <button
                onClick={() => navigateOrg(`/projects/${project.id}`)}
                className="text-sm text-primary hover:underline"
              >
                {project.name}
              </button>
            ) : (
              "—"
            )}
          </TableCell>
        )}
        <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
        <TableCell>{renderStatusBadge(invoice.status)}</TableCell>
        <TableCell>{formatDate(invoice.due_date)}</TableCell>
        <TableCell>{formatDate(invoice.paid_date)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDownloadPdf(invoice)}
              disabled={downloadingId === invoice.id}
            >
              {downloadingId === invoice.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(invoice)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {invoice.display_id}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteInvoice.mutate(invoice.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all invoices across projects
          </p>
        </div>
        <Button onClick={openCreate} className="border">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(totalDraft)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border">
            <SelectItem value="all">All Statuses</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px] border">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="border">
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || projectFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter("all"); setProjectFilter("all"); }}
          >
            Clear filters
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabs: All vs By Project */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border">
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-2" />
            All Invoices
          </TabsTrigger>
          <TabsTrigger value="by-project">
            <FolderKanban className="h-4 w-4 mr-2" />
            By Project
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card className="border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No invoices found. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => renderInvoiceRow(inv, true))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="by-project" className="mt-4 space-y-6">
          {invoicesByProject.size === 0 ? (
            <Card className="border">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No invoices found.
              </CardContent>
            </Card>
          ) : (
            Array.from(invoicesByProject.entries()).map(([projectId, projectInvoices]) => {
              const project = projectMap.get(projectId);
              const projectTotal = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
              const projectPaid = projectInvoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

              return (
                <Card key={projectId} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                        {project?.name ?? "Unknown Project"}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Total: <span className="font-semibold text-foreground">{formatCurrency(projectTotal)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Paid: <span className="font-semibold text-green-600">{formatCurrency(projectPaid)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {projectInvoices.length} invoice{projectInvoices.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectInvoices.map((inv) => renderInvoiceRow(inv, false))}
                    </TableBody>
                  </Table>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? "Update invoice details and line items below."
                : "Create a new invoice with line items. Fill in the details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, project_id: v, ...fillClientFromProject(v) }));
                    fillClientAsync(v);
                  }}
                  disabled={!!editingInvoice}
                >
                  <SelectTrigger className="border">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as InvoiceFormData["status"] }))}
                >
                  <SelectTrigger className="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border">
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="e.g., Development work - January 2026"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  placeholder="Auto-generated (INV-001)"
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                  className="border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="border"
                />
              </div>
            </div>

            {/* Bill To */}
            <div className="space-y-3 border rounded-md p-4 bg-muted/20">
              <Label className="text-base font-semibold">Bill To</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-xs text-muted-foreground">Client Name</Label>
                  <Input
                    id="client_name"
                    placeholder="Client or company name"
                    value={form.client_name}
                    onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                    className="border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="client@example.com"
                    value={form.client_email}
                    onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                    className="border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_address" className="text-xs text-muted-foreground">Street Address</Label>
                <Input
                  id="client_address"
                  placeholder="123 Main Street"
                  value={form.client_address}
                  onChange={(e) => setForm((f) => ({ ...f, client_address: e.target.value }))}
                  className="border"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_city" className="text-xs text-muted-foreground">City</Label>
                  <Input
                    id="client_city"
                    placeholder="City"
                    value={form.client_city}
                    onChange={(e) => setForm((f) => ({ ...f, client_city: e.target.value }))}
                    className="border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_state" className="text-xs text-muted-foreground">State / Province</Label>
                  <Input
                    id="client_state"
                    placeholder="State"
                    value={form.client_state}
                    onChange={(e) => setForm((f) => ({ ...f, client_state: e.target.value }))}
                    className="border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_postal_code" className="text-xs text-muted-foreground">Postal Code</Label>
                  <Input
                    id="client_postal_code"
                    placeholder="A1A 1A1"
                    value={form.client_postal_code}
                    onChange={(e) => setForm((f) => ({ ...f, client_postal_code: e.target.value }))}
                    className="border"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="border">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Description</TableHead>
                      <TableHead className="w-[12%]">Qty</TableHead>
                      <TableHead className="w-[18%]">Unit Price</TableHead>
                      <TableHead className="w-[18%] text-right">Amount</TableHead>
                      <TableHead className="w-[7%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-1.5">
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            className="border h-9"
                          />
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                            className="border h-9"
                          />
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price || ""}
                            onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                            className="border h-9"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="p-1.5 text-right font-mono text-sm">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2 border rounded-md p-4 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Tax Rate (%)</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.tax_rate}
                    onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value, tax_amount_override: "" }))}
                    className="border h-8 w-20 text-right"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Tax Amount ($)</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.tax_amount_override}
                    onChange={(e) => setForm((f) => ({ ...f, tax_amount_override: e.target.value, tax_rate: "0" }))}
                    className="border h-8 w-24 text-right"
                    placeholder="Auto"
                  />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-mono">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold border-t pt-2">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or payment terms..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="border"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending || updateInvoice.isPending || saveLineItems.isPending}
                className="border"
              >
                {(createInvoice.isPending || updateInvoice.isPending || saveLineItems.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingInvoice ? "Save Changes" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
