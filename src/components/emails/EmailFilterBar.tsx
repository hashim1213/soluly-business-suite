import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { format, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { EmailFilters } from "@/hooks/useEmails";
import { Database } from "@/integrations/supabase/types";

type EmailCategory = Database["public"]["Enums"]["email_category"];
type EmailStatus = Database["public"]["Enums"]["email_status"];

interface EmailFilterBarProps {
  filters: EmailFilters;
  onFiltersChange: (filters: EmailFilters) => void;
}

const categoryOptions: { value: EmailCategory | ""; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "ticket", label: "Tickets" },
  { value: "feature_request", label: "Feature Requests" },
  { value: "customer_quote", label: "Customer Quotes" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

const statusOptions: { value: EmailStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
];

const reviewStatusOptions: { value: "pending" | "approved" | "dismissed" | ""; label: string }[] = [
  { value: "", label: "All Review Status" },
  { value: "pending", label: "Needs Review" },
  { value: "approved", label: "Approved" },
  { value: "dismissed", label: "Dismissed" },
];

export function EmailFilterBar({ filters, onFiltersChange }: EmailFilterBarProps) {
  const { data: accounts } = useEmailAccounts();
  const [search, setSearch] = useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search });
  };

  const clearFilters = () => {
    setSearch("");
    onFiltersChange({
      fromDate: subYears(new Date(), 1),
      toDate: new Date(),
    });
  };

  const hasActiveFilters =
    filters.emailAccountId ||
    filters.category ||
    filters.status ||
    filters.reviewStatus ||
    filters.search;

  return (
    <div className="space-y-4 p-4 border-2 rounded-lg bg-card">
      <div className="flex flex-wrap gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] border-2", !filters.fromDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.fromDate ? format(filters.fromDate, "MMM d, yy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-2" align="start">
              <Calendar
                mode="single"
                selected={filters.fromDate}
                onSelect={(date) => onFiltersChange({ ...filters, fromDate: date || undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] border-2", !filters.toDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.toDate ? format(filters.toDate, "MMM d, yy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-2" align="start">
              <Calendar
                mode="single"
                selected={filters.toDate}
                onSelect={(date) => onFiltersChange({ ...filters, toDate: date || undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Account Filter */}
        {accounts && accounts.length > 0 && (
          <Select
            value={filters.emailAccountId || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, emailAccountId: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="w-[180px] border-2">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category Filter */}
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value === "all" ? undefined : value as EmailCategory })}
        >
          <SelectTrigger className="w-[160px] border-2">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value || "all"} value={option.value || "all"}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? undefined : value as EmailStatus })}
        >
          <SelectTrigger className="w-[140px] border-2">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value || "all"} value={option.value || "all"}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Review Status Filter */}
        <Select
          value={filters.reviewStatus || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, reviewStatus: value === "all" ? undefined : value as "pending" | "approved" | "dismissed" })}
        >
          <SelectTrigger className="w-[160px] border-2">
            <SelectValue placeholder="All Review Status" />
          </SelectTrigger>
          <SelectContent>
            {reviewStatusOptions.map((option) => (
              <SelectItem key={option.value || "all"} value={option.value || "all"}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-2"
          />
        </div>
        <Button type="submit" variant="secondary" className="border-2">
          Search
        </Button>
      </form>
    </div>
  );
}
