import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BusinessCost {
  id: string;
  organization_id: string;
  display_id: string;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number;
  date: string;
  vendor: string | null;
  reference: string | null;
  payment_method: string | null;
  recurring: boolean;
  recurring_frequency: string | null;
  tax_deductible: boolean;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessCostInput {
  description: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  vendor?: string;
  reference?: string;
  payment_method?: string;
  recurring?: boolean;
  recurring_frequency?: string;
  tax_deductible?: boolean;
  notes?: string;
  attachment_url?: string;
}

export interface UpdateBusinessCostInput extends Partial<CreateBusinessCostInput> {
  id: string;
}

// Comprehensive business cost categories
export const BUSINESS_COST_CATEGORIES = {
  software: {
    label: "Software & SaaS",
    subcategories: ["Development Tools", "Design Tools", "Project Management", "Communication", "Cloud Services", "Security", "Analytics", "CRM", "Accounting Software", "Other Software"]
  },
  legal: {
    label: "Legal",
    subcategories: ["Attorney Fees", "Contract Review", "Trademark/Patent", "Business Formation", "Compliance", "Litigation", "Other Legal"]
  },
  accounting: {
    label: "Accounting & Finance",
    subcategories: ["Bookkeeping", "Tax Preparation", "Audit", "Financial Advisory", "Payroll Services", "Other Accounting"]
  },
  taxes: {
    label: "Taxes & Government",
    subcategories: ["Income Tax", "Sales Tax", "Payroll Tax", "Property Tax", "Business License", "Permits", "Other Taxes"]
  },
  insurance: {
    label: "Insurance",
    subcategories: ["General Liability", "Professional Liability", "Health Insurance", "Workers Comp", "Property Insurance", "Cyber Insurance", "Other Insurance"]
  },
  marketing: {
    label: "Marketing & Advertising",
    subcategories: ["Digital Ads", "Print Ads", "Social Media", "SEO/SEM", "Content Marketing", "Events", "Sponsorships", "PR", "Branding", "Other Marketing"]
  },
  office: {
    label: "Office & Facilities",
    subcategories: ["Rent/Lease", "Coworking", "Office Supplies", "Furniture", "Cleaning", "Maintenance", "Security", "Other Office"]
  },
  utilities: {
    label: "Utilities",
    subcategories: ["Electricity", "Internet", "Phone", "Water", "Gas", "Other Utilities"]
  },
  travel: {
    label: "Travel & Entertainment",
    subcategories: ["Flights", "Hotels", "Ground Transport", "Meals", "Client Entertainment", "Conferences", "Other Travel"]
  },
  equipment: {
    label: "Equipment & Hardware",
    subcategories: ["Computers", "Monitors", "Peripherals", "Servers", "Networking", "Mobile Devices", "Other Equipment"]
  },
  professional: {
    label: "Professional Services",
    subcategories: ["Consulting", "Contractors", "Recruiting", "HR Services", "IT Support", "Other Professional"]
  },
  subscriptions: {
    label: "Subscriptions & Memberships",
    subcategories: ["Industry Associations", "Publications", "Online Services", "Memberships", "Other Subscriptions"]
  },
  banking: {
    label: "Banking & Financial",
    subcategories: ["Bank Fees", "Credit Card Fees", "Payment Processing", "Wire Fees", "Interest", "Other Banking"]
  },
  training: {
    label: "Training & Development",
    subcategories: ["Courses", "Certifications", "Books", "Conferences", "Workshops", "Other Training"]
  },
  other: {
    label: "Other",
    subcategories: ["Miscellaneous", "Uncategorized"]
  }
} as const;

export const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire Transfer" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
] as const;

export const RECURRING_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
] as const;

/**
 * Calculate the number of periods that have passed for a recurring expense
 */
export function calculateRecurringPeriods(startDate: string, frequency: string | null): number {
  if (!frequency) return 1;

  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 0; // Future date

  switch (frequency) {
    case "weekly":
      return Math.floor(diffDays / 7) + 1;
    case "biweekly":
      return Math.floor(diffDays / 14) + 1;
    case "monthly":
      // Calculate months difference
      const monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return Math.max(1, monthsDiff + 1);
    case "quarterly":
      const quartersDiff = Math.floor(((now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())) / 3);
      return Math.max(1, quartersDiff + 1);
    case "annually":
      return Math.max(1, now.getFullYear() - start.getFullYear() + 1);
    default:
      return 1;
  }
}

/**
 * Calculate the total accumulated amount for a recurring expense
 */
export function calculateRecurringTotal(amount: number, startDate: string, frequency: string | null, recurring: boolean): number {
  if (!recurring) return amount;
  const periods = calculateRecurringPeriods(startDate, frequency);
  return amount * periods;
}

/**
 * Get the frequency label for display (e.g., "/month", "/week")
 */
export function getFrequencyLabel(frequency: string | null): string {
  switch (frequency) {
    case "weekly": return "/week";
    case "biweekly": return "/2 weeks";
    case "monthly": return "/month";
    case "quarterly": return "/quarter";
    case "annually": return "/year";
    default: return "";
  }
}

/**
 * Generate next display ID for business costs (EXP-001, EXP-002, etc.)
 */
async function generateDisplayId(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("business_costs")
    .select("display_id")
    .eq("organization_id", organizationId)
    .order("display_id", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return "EXP-001";
  }

  const lastId = data[0].display_id;
  const match = lastId.match(/EXP-(\d+)/);
  if (!match) {
    return "EXP-001";
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `EXP-${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Hook to fetch all business costs
 */
export function useBusinessCosts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["business_costs", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("business_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as BusinessCost[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to fetch business costs by category
 */
export function useBusinessCostsByCategory(category: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["business_costs", organization?.id, "category", category],
    queryFn: async () => {
      if (!organization?.id || !category) return [];

      const { data, error } = await supabase
        .from("business_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("category", category)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as BusinessCost[];
    },
    enabled: !!organization?.id && !!category,
  });
}

/**
 * Hook to fetch recurring business costs
 */
export function useRecurringBusinessCosts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["business_costs", organization?.id, "recurring"],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("business_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("recurring", true)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as BusinessCost[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Hook to fetch business costs within a date range
 */
export function useBusinessCostsByDateRange(startDate: string | undefined, endDate: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["business_costs", organization?.id, "range", startDate, endDate],
    queryFn: async () => {
      if (!organization?.id || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from("business_costs")
        .select("*")
        .eq("organization_id", organization.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as BusinessCost[];
    },
    enabled: !!organization?.id && !!startDate && !!endDate,
  });
}

/**
 * Hook to create a new business cost
 */
export function useCreateBusinessCost() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBusinessCostInput) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const displayId = await generateDisplayId(organization.id);

      const { data, error } = await supabase
        .from("business_costs")
        .insert({
          organization_id: organization.id,
          display_id: displayId,
          description: input.description,
          category: input.category,
          subcategory: input.subcategory || null,
          amount: input.amount,
          date: input.date,
          vendor: input.vendor || null,
          reference: input.reference || null,
          payment_method: input.payment_method || null,
          recurring: input.recurring || false,
          recurring_frequency: input.recurring_frequency || null,
          tax_deductible: input.tax_deductible !== false, // Default true
          notes: input.notes || null,
          attachment_url: input.attachment_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BusinessCost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_costs"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Expense added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing business cost
 */
export function useUpdateBusinessCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBusinessCostInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("business_costs")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessCost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_costs"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Expense updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a business cost
 */
export function useDeleteBusinessCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_costs"] });
      queryClient.invalidateQueries({ queryKey: ["financials"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });
}

/**
 * Hook to get business costs summary by category
 * Calculates accumulated totals for recurring expenses
 */
export function useBusinessCostsSummary() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["business_costs", organization?.id, "summary"],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from("business_costs")
        .select("category, amount, recurring, recurring_frequency, tax_deductible, date")
        .eq("organization_id", organization.id);

      if (error) throw error;

      // Calculate totals by category with recurring accumulation
      const byCategory: Record<string, number> = {};
      let totalAmount = 0;
      let recurringMonthlyTotal = 0; // Monthly equivalent of all recurring costs
      let taxDeductibleTotal = 0;

      data?.forEach((cost) => {
        const baseAmount = Number(cost.amount);

        // Calculate accumulated amount for recurring expenses
        const accumulatedAmount = calculateRecurringTotal(
          baseAmount,
          cost.date,
          cost.recurring_frequency,
          cost.recurring
        );

        totalAmount += accumulatedAmount;
        byCategory[cost.category] = (byCategory[cost.category] || 0) + accumulatedAmount;

        // Calculate monthly equivalent for recurring costs
        if (cost.recurring) {
          switch (cost.recurring_frequency) {
            case "weekly":
              recurringMonthlyTotal += baseAmount * 4.33; // avg weeks per month
              break;
            case "biweekly":
              recurringMonthlyTotal += baseAmount * 2.17;
              break;
            case "monthly":
              recurringMonthlyTotal += baseAmount;
              break;
            case "quarterly":
              recurringMonthlyTotal += baseAmount / 3;
              break;
            case "annually":
              recurringMonthlyTotal += baseAmount / 12;
              break;
            default:
              recurringMonthlyTotal += baseAmount;
          }
        }

        if (cost.tax_deductible) taxDeductibleTotal += accumulatedAmount;
      });

      return {
        totalAmount,
        recurringMonthlyTotal: Math.round(recurringMonthlyTotal * 100) / 100,
        taxDeductibleTotal,
        byCategory,
        count: data?.length || 0,
      };
    },
    enabled: !!organization?.id,
  });
}
