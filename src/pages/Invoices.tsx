import { useState } from "react";
import { useAllProjectInvoices, useCreateProjectInvoice, useUpdateProjectInvoice, useDeleteProjectInvoice, ProjectInvoice, INVOICE_STATUSES } from "@/hooks/useProjectInvoices";
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
  return new Date(date).toLocaleDateString("en-US", {
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
  amount: string;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  invoice_number: string;
  notes: string;
}

const emptyForm: InvoiceFormData = {
  project_id: "",
  description: "",
  amount: "",
  status: "draft",
  due_date: "",
  invoice_number: "",
  notes: "",
};

export default function Invoices() {
  const { navigateOrg } = useOrgNavigation();
  const { data: invoices, isLoading: invoicesLoading } = useAllProjectInvoices();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createInvoice = useCreateProjectInvoice();
  const updateInvoice = useUpdateProjectInvoice();
  const deleteInvoice = useDeleteProjectInvoice();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<ProjectInvoice | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const isLoading = invoicesLoading || projectsLoading;

  const projectMap = new Map(projects?.map((p) => [p.id, p]) ?? []);

  const filteredInvoices = (invoices ?? []).filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (projectFilter !== "all" && inv.project_id !== projectFilter) return false;
    return true;
  });

  // Group invoices by project
  const invoicesByProject = new Map<string, ProjectInvoice[]>();
  for (const inv of filteredInvoices) {
    const list = invoicesByProject.get(inv.project_id) || [];
    list.push(inv);
    invoicesByProject.set(inv.project_id, list);
  }

  // Summary stats
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = filteredInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = filteredInvoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0);
  const totalDraft = filteredInvoices.filter((inv) => inv.status === "draft").reduce((sum, inv) => sum + inv.amount, 0);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingInvoice(null);
    setIsCreateOpen(true);
  };

  const openEdit = (invoice: ProjectInvoice) => {
    setEditingInvoice(invoice);
    setForm({
      project_id: invoice.project_id,
      description: invoice.description,
      amount: invoice.amount.toString(),
      status: invoice.status,
      due_date: invoice.due_date?.split("T")[0] ?? "",
      invoice_number: invoice.invoice_number ?? "",
      notes: invoice.notes ?? "",
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.project_id || !form.description || isNaN(amount) || amount <= 0) return;

    if (editingInvoice) {
      await updateInvoice.mutateAsync({
        id: editingInvoice.id,
        description: form.description,
        amount,
        status: form.status,
        due_date: form.due_date || undefined,
        invoice_number: form.invoice_number || undefined,
        notes: form.notes || undefined,
        paid_date: form.status === "paid" && !editingInvoice.paid_date ? new Date().toISOString() : undefined,
      });
    } else {
      await createInvoice.mutateAsync({
        project_id: form.project_id,
        description: form.description,
        amount,
        status: form.status,
        due_date: form.due_date || undefined,
        invoice_number: form.invoice_number || undefined,
        notes: form.notes || undefined,
      });
    }

    setIsCreateOpen(false);
    setEditingInvoice(null);
    setForm(emptyForm);
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

  const renderInvoiceRow = (invoice: ProjectInvoice) => {
    const project = projectMap.get(invoice.project_id);
    return (
      <TableRow key={invoice.id}>
        <TableCell className="font-medium">{invoice.display_id}</TableCell>
        <TableCell>{invoice.invoice_number || "—"}</TableCell>
        <TableCell className="max-w-[200px] truncate">{invoice.description}</TableCell>
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
        <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
        <TableCell>{renderStatusBadge(invoice.status)}</TableCell>
        <TableCell>{formatDate(invoice.due_date)}</TableCell>
        <TableCell>{formatDate(invoice.paid_date)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
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
                  <TableHead className="w-[80px]">Actions</TableHead>
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
                  filteredInvoices.map(renderInvoiceRow)
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
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.display_id}</TableCell>
                          <TableCell>{invoice.invoice_number || "—"}</TableCell>
                          <TableCell className="max-w-[250px] truncate">{invoice.description}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{renderStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>{formatDate(invoice.paid_date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
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
                                      Are you sure you want to delete {invoice.display_id}?
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
                      ))}
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
        <DialogContent className="border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? "Update invoice details below."
                : "Create a new invoice for a project. Fill in the details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={form.project_id}
                onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="border"
                  required
                />
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
                  placeholder="e.g., INV-2026-001"
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or details..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="border"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending || updateInvoice.isPending}
                className="border"
              >
                {(createInvoice.isPending || updateInvoice.isPending) && (
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
