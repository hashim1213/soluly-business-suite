import { useMemo, useState } from "react";
import { addDays, endOfMonth, format, parseISO } from "date-fns";
import { FileText, Loader2, Plus, Repeat, Trash2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { InvoicePDF, InvoiceData } from "@/components/invoice/InvoicePDF";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { Project } from "@/hooks/useProjects";
import {
  RecurringCharge,
  RecurringChargeCategory,
  RecurringChargeFrequency,
  chargesDueInMonth,
  isChargeDueInMonth,
  useCreateRecurringCharge,
  useDeleteRecurringCharge,
  useRecurringCharges,
  useUpdateRecurringCharge,
} from "@/hooks/useRecurringCharges";
import { useCreateProjectInvoice } from "@/hooks/useProjectInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORIES: { value: RecurringChargeCategory; label: string }[] = [
  { value: "hosting", label: "Hosting" },
  { value: "database", label: "Database" },
  { value: "subscription", label: "Subscription" },
  { value: "domain", label: "Domain" },
  { value: "license", label: "License" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const FREQUENCIES: { value: RecurringChargeFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCY_LABEL: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const CATEGORY_STYLES: Record<string, string> = {
  hosting: "bg-chart-1 text-background",
  database: "bg-chart-2 text-background",
  subscription: "bg-chart-4 text-foreground",
  domain: "bg-chart-3 text-background",
  license: "bg-chart-5 text-background",
  maintenance: "bg-chart-2 text-background",
  other: "bg-muted text-muted-foreground",
};

type LineItem = {
  id: string;
  label: string;
  amount: number;
};

const emptyChargeForm = () => ({
  name: "",
  category: "hosting" as RecurringChargeCategory,
  amount: "",
  frequency: "monthly" as RecurringChargeFrequency,
  start_date: format(new Date(), "yyyy-MM-dd"),
  end_date: "",
  description: "",
});

export function RecurringChargesCard({ project }: { project: Project }) {
  const canViewAmounts = useCanViewAmounts();
  const { organization } = useAuth();
  const { data: orgDetails } = useCurrentOrganization();
  const { data: charges, isLoading } = useRecurringCharges(project.id);
  const createCharge = useCreateRecurringCharge();
  const updateCharge = useUpdateRecurringCharge();
  const deleteCharge = useDeleteRecurringCharge();
  const createInvoice = useCreateProjectInvoice();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState(emptyChargeForm());

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [billingMonth, setBillingMonth] = useState(format(new Date(), "yyyy-MM"));
  const [uncheckedIds, setUncheckedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const money = (v: number) =>
    canViewAmounts
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(v)
      : "••••••";

  const monthDate = useMemo(() => {
    const d = parseISO(`${billingMonth}-01`);
    return isNaN(d.getTime()) ? null : d;
  }, [billingMonth]);

  const hasMaintenanceCharge = (charges || []).some((c) => c.category === "maintenance");

  // Line items due in the selected month: the project's maintenance fee (if it
  // lands on a billing-cycle month and no dedicated maintenance charge exists)
  // plus every recurring charge due that month.
  const lineItems = useMemo<LineItem[]>(() => {
    if (!monthDate) return [];
    const items: LineItem[] = [];

    if (!hasMaintenanceCharge && project.has_maintenance && (project.maintenance_amount || 0) > 0) {
      const maintenanceAsCharge = {
        active: true,
        frequency: project.maintenance_frequency || "monthly",
        start_date: project.maintenance_start_date || format(monthDate, "yyyy-MM-dd"),
        end_date: project.maintenance_end_date,
      } as RecurringCharge;
      if (isChargeDueInMonth(maintenanceAsCharge, monthDate)) {
        items.push({
          id: "maintenance",
          label: `Maintenance — ${FREQUENCY_LABEL[project.maintenance_frequency] || "Monthly"} fee`,
          amount: project.maintenance_amount,
        });
      }
    }

    for (const charge of chargesDueInMonth(charges || [], monthDate)) {
      items.push({
        id: charge.id,
        label: `${charge.name} (${charge.category})`,
        amount: charge.amount,
      });
    }

    return items;
  }, [monthDate, project, charges, hasMaintenanceCharge]);

  const checkedItems = lineItems.filter((item) => !uncheckedIds.has(item.id));
  const total = checkedItems.reduce((sum, item) => sum + item.amount, 0);

  const toggleItem = (id: string, checked: boolean) => {
    setUncheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openInvoiceDialog = (open: boolean) => {
    setIsInvoiceOpen(open);
    if (open) {
      setBillingMonth(format(new Date(), "yyyy-MM"));
      setUncheckedIds(new Set());
    }
  };

  const handleAddCharge = async () => {
    if (!chargeForm.name.trim() || !chargeForm.amount) {
      toast.error("Please fill in name and amount");
      return;
    }
    const amount = parseFloat(chargeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await createCharge.mutateAsync({
        project_id: project.id,
        name: chargeForm.name.trim(),
        description: chargeForm.description.trim() || null,
        category: chargeForm.category,
        amount,
        frequency: chargeForm.frequency,
        start_date: chargeForm.start_date,
        end_date: chargeForm.end_date || null,
        active: true,
      });
      setIsAddOpen(false);
      setChargeForm(emptyChargeForm());
    } catch {
      // Error handled by hook
    }
  };

  const handleGenerateInvoice = async () => {
    if (!monthDate || checkedItems.length === 0) return;

    setIsGenerating(true);
    try {
      const monthLabel = format(monthDate, "MMMM yyyy");
      const dueDate = format(addDays(endOfMonth(monthDate), 14), "yyyy-MM-dd");
      const notes = checkedItems.map((item) => item.label).join(", ");

      // 1. Create the invoice record
      const invoice = await createInvoice.mutateAsync({
        project_id: project.id,
        description: `Recurring charges — ${monthLabel}`,
        amount: total,
        status: "draft",
        due_date: dueDate,
        notes,
      });

      // 2. Build invoice data from organization billing settings (same source
      // as QuoteDetail) and download the PDF. The PDF always carries real
      // amounts — a masked invoice is meaningless.
      const org = orgDetails as any;
      const invoiceData: InvoiceData = {
        invoiceNumber:
          (invoice as any)?.display_id || `INV-${format(monthDate, "yyyyMM")}`,
        invoiceDate: new Date().toISOString(),
        dueDate,

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

        clientName: project.client_name,
        contactEmail: project.client_email || undefined,

        lineItems: checkedItems.map((item) => ({
          description: item.label,
          quantity: 1,
          unit_price: item.amount,
        })),

        subtotal: total,
        total,
        balanceDue: total,

        notes: org?.default_invoice_notes || undefined,
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

      toast.success(`Invoice for ${monthLabel} created and PDF downloaded`);
      setIsInvoiceOpen(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-chart-1" />
            <CardTitle>Recurring Charges</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isInvoiceOpen} onOpenChange={openInvoiceDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border border-chart-2 text-chart-2 hover:bg-chart-2 hover:text-background"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[520px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Generate Recurring Invoice</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="billing-month">Billing Month</Label>
                    <Input
                      id="billing-month"
                      type="month"
                      value={billingMonth}
                      onChange={(e) => {
                        setBillingMonth(e.target.value);
                        setUncheckedIds(new Set());
                      }}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Line Items</Label>
                    {lineItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground border border-dashed border-border p-4 text-center">
                        Nothing is due in{" "}
                        {monthDate ? format(monthDate, "MMMM yyyy") : "the selected month"}.
                      </p>
                    ) : (
                      <div className="border border-border divide-y divide-border">
                        {lineItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3">
                            <Checkbox
                              id={`li-${item.id}`}
                              checked={!uncheckedIds.has(item.id)}
                              onCheckedChange={(checked) =>
                                toggleItem(item.id, checked === true)
                              }
                            />
                            <label
                              htmlFor={`li-${item.id}`}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              {item.label}
                            </label>
                            <span className="text-sm font-mono">{money(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-3 bg-secondary">
                          <span className="text-sm font-medium">Total</span>
                          <span className="text-sm font-semibold font-mono">{money(total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsInvoiceOpen(false)}
                    className="border"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={checkedItems.length === 0 || isGenerating}
                    className="border"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Create Invoice & Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[500px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Add Recurring Charge</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="charge-name">Name *</Label>
                    <Input
                      id="charge-name"
                      placeholder="e.g., Vercel hosting"
                      value={chargeForm.name}
                      onChange={(e) => setChargeForm({ ...chargeForm, name: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="charge-category">Category</Label>
                      <Select
                        value={chargeForm.category}
                        onValueChange={(value: RecurringChargeCategory) =>
                          setChargeForm({ ...chargeForm, category: value })
                        }
                      >
                        <SelectTrigger id="charge-category" className="border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border">
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="charge-amount">Amount ($) *</Label>
                      <Input
                        id="charge-amount"
                        type="number"
                        placeholder="0"
                        value={chargeForm.amount}
                        onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="charge-frequency">Frequency</Label>
                      <Select
                        value={chargeForm.frequency}
                        onValueChange={(value: RecurringChargeFrequency) =>
                          setChargeForm({ ...chargeForm, frequency: value })
                        }
                      >
                        <SelectTrigger id="charge-frequency" className="border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border">
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="charge-start">Start Date</Label>
                      <Input
                        id="charge-start"
                        type="date"
                        value={chargeForm.start_date}
                        onChange={(e) =>
                          setChargeForm({ ...chargeForm, start_date: e.target.value })
                        }
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="charge-end">End Date (optional)</Label>
                    <Input
                      id="charge-end"
                      type="date"
                      value={chargeForm.end_date}
                      onChange={(e) => setChargeForm({ ...chargeForm, end_date: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="charge-description">Description</Label>
                    <Textarea
                      id="charge-description"
                      placeholder="Additional details..."
                      value={chargeForm.description}
                      onChange={(e) =>
                        setChargeForm({ ...chargeForm, description: e.target.value })
                      }
                      className="border"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)} className="border">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCharge}
                    disabled={createCharge.isPending}
                    className="border"
                  >
                    {createCharge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Charge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !charges || charges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recurring charges yet. Add hosting, database, or subscription costs you bill the
            client for.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="w-[70px]">Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => (
                <TableRow key={charge.id} className={`${charge.active ? "" : "opacity-60"} ${charge.category === "maintenance" ? "bg-chart-2/5" : ""}`}>
                  <TableCell>
                    <div className="font-medium">{charge.name}</div>
                    {charge.description && (
                      <div className="text-xs text-muted-foreground">{charge.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_STYLES[charge.category] || CATEGORY_STYLES.other}>
                      {charge.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{money(charge.amount)}</TableCell>
                  <TableCell className="capitalize">{charge.frequency}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(charge.start_date + "T00:00:00"), "MMM d, yyyy")}
                    {" – "}
                    {charge.end_date ? format(parseISO(charge.end_date + "T00:00:00"), "MMM d, yyyy") : "Ongoing"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={charge.active}
                      onCheckedChange={(checked) =>
                        updateCharge.mutate({ id: charge.id, active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete recurring charge "${charge.name}"?`)) {
                          deleteCharge.mutate(charge.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
