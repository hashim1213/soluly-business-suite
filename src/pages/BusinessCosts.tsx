import { useState, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  useBusinessCosts,
  useCreateBusinessCost,
  useUpdateBusinessCost,
  useDeleteBusinessCost,
  useBusinessCostsSummary,
  BUSINESS_COST_CATEGORIES,
  PAYMENT_METHODS,
  RECURRING_FREQUENCIES,
  BusinessCost,
  calculateRecurringTotal,
  calculateRecurringPeriods,
  getFrequencyLabel,
} from "@/hooks/useBusinessCosts";
import { format } from "date-fns";
import {
  DollarSign,
  Plus,
  Loader2,
  Search,
  Filter,
  Trash2,
  Pencil,
  Receipt,
  RefreshCw,
  Building2,
  Calculator,
  TrendingUp,
  Calendar,
  CreditCard,
  FileText,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Category colors for badges
const categoryColors: Record<string, string> = {
  software: "bg-blue-500 text-white",
  legal: "bg-purple-500 text-white",
  accounting: "bg-green-500 text-white",
  taxes: "bg-red-500 text-white",
  insurance: "bg-orange-500 text-white",
  marketing: "bg-pink-500 text-white",
  office: "bg-yellow-500 text-black",
  utilities: "bg-cyan-500 text-white",
  travel: "bg-indigo-500 text-white",
  equipment: "bg-slate-500 text-white",
  professional: "bg-emerald-500 text-white",
  subscriptions: "bg-violet-500 text-white",
  banking: "bg-amber-500 text-black",
  training: "bg-teal-500 text-white",
  other: "bg-gray-500 text-white",
};

export default function BusinessCosts() {
  const { navigateOrg } = useOrgNavigation();
  const { data: costs, isLoading } = useBusinessCosts();
  const { data: summary } = useBusinessCostsSummary();
  const createCost = useCreateBusinessCost();
  const updateCost = useUpdateBusinessCost();
  const deleteCost = useDeleteBusinessCost();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<BusinessCost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [recurringFilter, setRecurringFilter] = useState<string>("all");

  const [newCost, setNewCost] = useState({
    description: "",
    category: "software",
    subcategory: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    reference: "",
    payment_method: "",
    recurring: false,
    recurring_frequency: "",
    tax_deductible: true,
    notes: "",
  });

  // Get subcategories for selected category
  const subcategories = useMemo(() => {
    const cat = newCost.category as keyof typeof BUSINESS_COST_CATEGORIES;
    return BUSINESS_COST_CATEGORIES[cat]?.subcategories || [];
  }, [newCost.category]);

  const editSubcategories = useMemo(() => {
    if (!editingCost) return [];
    const cat = editingCost.category as keyof typeof BUSINESS_COST_CATEGORIES;
    return BUSINESS_COST_CATEGORIES[cat]?.subcategories || [];
  }, [editingCost]);

  // Filter and search costs
  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter((cost) => {
      const matchesSearch =
        searchQuery === "" ||
        cost.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cost.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cost.display_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || cost.category === categoryFilter;
      const matchesRecurring =
        recurringFilter === "all" ||
        (recurringFilter === "recurring" && cost.recurring) ||
        (recurringFilter === "one-time" && !cost.recurring);
      return matchesSearch && matchesCategory && matchesRecurring;
    });
  }, [costs, searchQuery, categoryFilter, recurringFilter]);

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.amount) {
      toast.error("Please fill in description and amount");
      return;
    }

    try {
      await createCost.mutateAsync({
        description: newCost.description,
        category: newCost.category,
        subcategory: newCost.subcategory || undefined,
        amount: parseFloat(newCost.amount),
        date: newCost.date,
        vendor: newCost.vendor || undefined,
        reference: newCost.reference || undefined,
        payment_method: newCost.payment_method || undefined,
        recurring: newCost.recurring,
        recurring_frequency: newCost.recurring ? newCost.recurring_frequency || undefined : undefined,
        tax_deductible: newCost.tax_deductible,
        notes: newCost.notes || undefined,
      });

      setNewCost({
        description: "",
        category: "software",
        subcategory: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        reference: "",
        payment_method: "",
        recurring: false,
        recurring_frequency: "",
        tax_deductible: true,
        notes: "",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditCost = async () => {
    if (!editingCost) return;

    try {
      await updateCost.mutateAsync({
        id: editingCost.id,
        description: editingCost.description,
        category: editingCost.category,
        subcategory: editingCost.subcategory || undefined,
        amount: editingCost.amount,
        date: editingCost.date,
        vendor: editingCost.vendor || undefined,
        reference: editingCost.reference || undefined,
        payment_method: editingCost.payment_method || undefined,
        recurring: editingCost.recurring,
        recurring_frequency: editingCost.recurring ? editingCost.recurring_frequency || undefined : undefined,
        tax_deductible: editingCost.tax_deductible,
        notes: editingCost.notes || undefined,
      });

      setEditingCost(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteCost.mutateAsync(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditDialog = (cost: BusinessCost) => {
    setEditingCost({ ...cost });
    setIsEditDialogOpen(true);
  };

  // Calculate category breakdown for chart - must be before early returns
  const categoryBreakdown = useMemo(() => {
    if (!summary?.byCategory) return [];
    return Object.entries(summary.byCategory)
      .map(([category, amount]) => ({
        category,
        label: BUSINESS_COST_CATEGORIES[category as keyof typeof BUSINESS_COST_CATEGORIES]?.label || category,
        amount: amount as number,
        percentage: summary.totalAmount > 0 ? ((amount as number) / summary.totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary]);

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
          <h1 className="text-3xl font-bold tracking-tight">Business Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your business operating costs
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b-2 border-border pb-4">
              <DialogTitle>Add Business Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Monthly Slack subscription"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <Select
                    value={newCost.category}
                    onValueChange={(v) => setNewCost({ ...newCost, category: v, subcategory: "" })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {Object.entries(BUSINESS_COST_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={newCost.subcategory}
                    onValueChange={(v) => setNewCost({ ...newCost, subcategory: v })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      className="border-2 pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newCost.date}
                    onChange={(e) => setNewCost({ ...newCost, date: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g., Slack Technologies"
                    value={newCost.vendor}
                    onChange={(e) => setNewCost({ ...newCost, vendor: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference #</Label>
                  <Input
                    id="reference"
                    placeholder="Invoice or receipt number"
                    value={newCost.reference}
                    onChange={(e) => setNewCost({ ...newCost, reference: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select
                  value={newCost.payment_method}
                  onValueChange={(v) => setNewCost({ ...newCost, payment_method: v })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    {PAYMENT_METHODS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={newCost.recurring}
                    onCheckedChange={(checked) =>
                      setNewCost({ ...newCost, recurring: checked as boolean })
                    }
                  />
                  <Label htmlFor="recurring" className="cursor-pointer">
                    This is a recurring expense
                  </Label>
                </div>

                {newCost.recurring && (
                  <div className="grid gap-2 pl-6">
                    <Label>Frequency</Label>
                    <Select
                      value={newCost.recurring_frequency}
                      onValueChange={(v) => setNewCost({ ...newCost, recurring_frequency: v })}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select frequency..." />
                      </SelectTrigger>
                      <SelectContent className="border-2">
                        {RECURRING_FREQUENCIES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax_deductible"
                    checked={newCost.tax_deductible}
                    onCheckedChange={(checked) =>
                      setNewCost({ ...newCost, tax_deductible: checked as boolean })
                    }
                  />
                  <Label htmlFor="tax_deductible" className="cursor-pointer">
                    Tax deductible
                  </Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details..."
                  value={newCost.notes}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                  className="border-2"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-2">
                Cancel
              </Button>
              <Button onClick={handleAddCost} className="border-2" disabled={createCost.isPending}>
                {createCost.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(summary?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.count || 0} expenses tracked
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(summary?.recurringMonthlyTotal || 0)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly run rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-chart-2">
              {formatCurrency(summary?.taxDeductibleTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential tax savings
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {Object.keys(summary?.byCategory || {}).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="border-b-2 border-border">
            <CardTitle>Expense Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {categoryBreakdown.slice(0, 6).map(({ category, label, amount, percentage }) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[category] || "bg-gray-500 text-white"}>
                        {label}
                      </Badge>
                    </div>
                    <span className="font-mono font-medium">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Expenses</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] border-2"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] border-2">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(BUSINESS_COST_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={recurringFilter} onValueChange={setRecurringFilter}>
                <SelectTrigger className="w-[140px] border-2">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="border-2">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses found</p>
              <p className="text-sm">Add your first business expense to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 hover:bg-transparent">
                  <TableHead className="font-bold uppercase text-xs">ID</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Category</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Vendor</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                  <TableHead className="font-bold uppercase text-xs text-right">Total</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                  <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.map((cost) => (
                  <TableRow key={cost.id} className="border-b-2">
                    <TableCell className="font-mono text-sm">{cost.display_id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cost.description}</div>
                        {cost.subcategory && (
                          <div className="text-xs text-muted-foreground">{cost.subcategory}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[cost.category] || "bg-gray-500 text-white"}>
                        {BUSINESS_COST_CATEGORIES[cost.category as keyof typeof BUSINESS_COST_CATEGORIES]?.label || cost.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cost.vendor || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(cost.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      <div>
                        {formatCurrency(cost.amount)}
                        {cost.recurring && (
                          <span className="text-xs text-muted-foreground">
                            {getFrequencyLabel(cost.recurring_frequency)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {(() => {
                        const total = calculateRecurringTotal(
                          cost.amount,
                          cost.date,
                          cost.recurring_frequency,
                          cost.recurring
                        );
                        const periods = cost.recurring ? calculateRecurringPeriods(cost.date, cost.recurring_frequency) : 1;
                        return (
                          <div>
                            <div>{formatCurrency(total)}</div>
                            {cost.recurring && periods > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {periods} periods
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cost.recurring && (
                          <Badge variant="outline" className="border-2">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {cost.recurring_frequency || "Recurring"}
                          </Badge>
                        )}
                        {cost.tax_deductible && (
                          <Badge variant="secondary" className="border-2">
                            Tax
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-2">
                          <DropdownMenuItem onClick={() => openEditDialog(cost)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCost(cost.id)}
                            className="text-destructive"
                          >
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
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingCost && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={editingCost.description}
                  onChange={(e) => setEditingCost({ ...editingCost, description: e.target.value })}
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <Select
                    value={editingCost.category}
                    onValueChange={(v) => setEditingCost({ ...editingCost, category: v, subcategory: null })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {Object.entries(BUSINESS_COST_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={editingCost.subcategory || ""}
                    onValueChange={(v) => setEditingCost({ ...editingCost, subcategory: v })}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      {editSubcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      value={editingCost.amount}
                      onChange={(e) => setEditingCost({ ...editingCost, amount: parseFloat(e.target.value) || 0 })}
                      className="border-2 pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingCost.date}
                    onChange={(e) => setEditingCost({ ...editingCost, date: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-vendor">Vendor</Label>
                  <Input
                    id="edit-vendor"
                    value={editingCost.vendor || ""}
                    onChange={(e) => setEditingCost({ ...editingCost, vendor: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-reference">Reference #</Label>
                  <Input
                    id="edit-reference"
                    value={editingCost.reference || ""}
                    onChange={(e) => setEditingCost({ ...editingCost, reference: e.target.value })}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select
                  value={editingCost.payment_method || ""}
                  onValueChange={(v) => setEditingCost({ ...editingCost, payment_method: v })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    {PAYMENT_METHODS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t-2 border-border pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-recurring"
                    checked={editingCost.recurring}
                    onCheckedChange={(checked) =>
                      setEditingCost({ ...editingCost, recurring: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-recurring" className="cursor-pointer">
                    This is a recurring expense
                  </Label>
                </div>

                {editingCost.recurring && (
                  <div className="grid gap-2 pl-6">
                    <Label>Frequency</Label>
                    <Select
                      value={editingCost.recurring_frequency || ""}
                      onValueChange={(v) => setEditingCost({ ...editingCost, recurring_frequency: v })}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select frequency..." />
                      </SelectTrigger>
                      <SelectContent className="border-2">
                        {RECURRING_FREQUENCIES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-tax_deductible"
                    checked={editingCost.tax_deductible}
                    onCheckedChange={(checked) =>
                      setEditingCost({ ...editingCost, tax_deductible: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit-tax_deductible" className="cursor-pointer">
                    Tax deductible
                  </Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingCost.notes || ""}
                  onChange={(e) => setEditingCost({ ...editingCost, notes: e.target.value })}
                  className="border-2"
                  rows={2}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={handleEditCost} className="border-2" disabled={updateCost.isPending}>
              {updateCost.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
