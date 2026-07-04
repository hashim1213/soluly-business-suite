import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse a date string as local time. Date-only strings (YYYY-MM-DD) are
 * interpreted as UTC by the Date constructor, which causes off-by-one day
 * errors in negative-UTC timezones. This appends T00:00:00 to force local
 * interpretation. Full ISO timestamps (containing "T") are passed through.
 */
export function parseLocalDate(date: string): Date {
  if (date.includes("T")) return new Date(date);
  return new Date(date + "T00:00:00");
}
