/**
 * Shared style definitions for badges, status indicators, and pills
 * All colors are designed for high contrast and accessibility
 */

// Project status styles - using high contrast colors
export const projectStatusStyles = {
  active: "bg-emerald-600 text-white",
  pending: "bg-amber-500 text-black",
  completed: "bg-slate-800 text-white",
  on_hold: "bg-slate-400 text-black",
} as const;

// Ticket status styles
export const ticketStatusStyles = {
  open: "bg-blue-600 text-white",
  "in-progress": "bg-amber-500 text-black",
  in_progress: "bg-amber-500 text-black",
  pending: "bg-slate-400 text-black",
  resolved: "bg-emerald-600 text-white",
  closed: "bg-slate-600 text-white",
} as const;

// Ticket priority styles
export const ticketPriorityStyles = {
  high: "bg-red-600 text-white",
  medium: "bg-amber-500 text-black",
  low: "bg-slate-300 text-black border border-slate-400",
} as const;

// Quote status styles
export const quoteStatusStyles = {
  draft: "bg-slate-400 text-black",
  sent: "bg-blue-600 text-white",
  accepted: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
  expired: "bg-slate-600 text-white",
} as const;

// Feature request status styles
export const featureStatusStyles = {
  submitted: "bg-blue-600 text-white",
  under_review: "bg-amber-500 text-black",
  planned: "bg-purple-600 text-white",
  in_progress: "bg-cyan-600 text-white",
  completed: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
} as const;

// Feedback status styles
export const feedbackStatusStyles = {
  acknowledged: "bg-slate-400 text-black",
  "under-review": "bg-amber-500 text-black",
  investigating: "bg-blue-600 text-white",
  "in-progress": "bg-cyan-600 text-white",
  resolved: "bg-emerald-600 text-white",
} as const;

// Feedback sentiment styles
export const feedbackSentimentStyles = {
  positive: "bg-emerald-600 text-white",
  negative: "bg-red-600 text-white",
  neutral: "bg-slate-400 text-black",
} as const;

// Email category styles
export const emailCategoryStyles = {
  feature_request: "bg-amber-500 text-black",
  customer_quote: "bg-blue-600 text-white",
  feedback: "bg-emerald-600 text-white",
  other: "bg-slate-400 text-black",
} as const;

// Team member status styles
export const teamMemberStatusStyles = {
  active: "bg-emerald-600 text-white",
  inactive: "bg-slate-400 text-black",
  on_leave: "bg-amber-500 text-black",
} as const;

// CRM lead status styles
export const leadStatusStyles = {
  new: "bg-blue-600 text-white",
  contacted: "bg-amber-500 text-black",
  qualified: "bg-purple-600 text-white",
  proposal: "bg-cyan-600 text-white",
  negotiation: "bg-orange-600 text-white",
  won: "bg-emerald-600 text-white",
  lost: "bg-red-600 text-white",
} as const;

// Contract/agreement type styles (for team member contracts)
export const contractTypeStyles = {
  hourly: "bg-blue-600 text-white",
  fixed: "bg-purple-600 text-white",
  retainer: "bg-cyan-600 text-white",
  milestone: "bg-amber-500 text-black",
  "Full-time": "bg-emerald-600 text-white",
  Contractor: "bg-amber-500 text-black",
  "Part-time": "bg-cyan-600 text-white",
} as const;

// Document/contract type styles (for project contracts)
export const documentTypeStyles = {
  nda: "bg-blue-600 text-white",
  service: "bg-emerald-600 text-white",
  employee: "bg-purple-600 text-white",
  contractor: "bg-amber-500 text-black",
} as const;

// Document/contract status styles
export const documentStatusStyles = {
  signed: "bg-emerald-600 text-white",
  active: "bg-blue-600 text-white",
  pending: "bg-amber-500 text-black",
  expired: "bg-slate-600 text-white",
} as const;

// Invoice status styles
export const invoiceStatusStyles = {
  draft: "bg-slate-400 text-black",
  sent: "bg-blue-600 text-white",
  paid: "bg-emerald-600 text-white",
  overdue: "bg-red-600 text-white",
} as const;

// Form status styles
export const formStatusStyles = {
  draft: "bg-slate-400 text-black",
  published: "bg-emerald-600 text-white",
  closed: "bg-slate-600 text-white",
  archived: "bg-slate-800 text-white",
} as const;

// Cost category styles
export const costCategoryStyles = {
  labor: "bg-blue-600 text-white",
  infrastructure: "bg-orange-600 text-white",
  software: "bg-purple-600 text-white",
  external: "bg-amber-500 text-black",
  other: "bg-slate-400 text-black",
} as const;

// Project category styles
export const projectCategoryStyles = {
  development: "bg-blue-600 text-white",
  design: "bg-purple-600 text-white",
  consulting: "bg-cyan-600 text-white",
  infrastructure: "bg-orange-600 text-white",
  maintenance: "bg-slate-600 text-white",
  other: "bg-slate-400 text-black",
} as const;

// Timeline/milestone status styles
export const milestoneStatusStyles = {
  pending: "bg-slate-400 text-black",
  in_progress: "bg-amber-500 text-black",
  completed: "bg-emerald-600 text-white",
  overdue: "bg-red-600 text-white",
} as const;

// Profit indicator styles (positive/negative)
export const profitStyles = {
  positive: "text-emerald-600",
  negative: "text-red-600",
  neutral: "text-slate-500",
} as const;

// Category card background styles (for clickable cards)
export const categoryCardStyles = {
  all: "bg-slate-800",
  uncategorized: "bg-slate-500",
  feature: "bg-amber-500",
  quote: "bg-blue-600",
  feedback: "bg-emerald-600",
} as const;

// Contact activity type styles
export const activityTypeStyles = {
  call: "bg-blue-600 text-white",
  email: "bg-purple-600 text-white",
  meeting: "bg-emerald-600 text-white",
  note: "bg-amber-500 text-black",
  task: "bg-cyan-600 text-white",
} as const;

// Call outcome styles
export const callOutcomeStyles = {
  answered: "bg-emerald-600 text-white",
  no_answer: "bg-slate-400 text-black",
  voicemail: "bg-amber-500 text-black",
  busy: "bg-red-600 text-white",
  callback_scheduled: "bg-blue-600 text-white",
} as const;

// Task status styles (for contact activities)
export const taskStatusStyles = {
  pending: "bg-slate-400 text-black",
  in_progress: "bg-amber-500 text-black",
  completed: "bg-emerald-600 text-white",
  cancelled: "bg-slate-600 text-white",
} as const;

// Task priority styles (for contact activities)
export const taskPriorityStyles = {
  low: "bg-slate-300 text-black border border-slate-400",
  medium: "bg-amber-500 text-black",
  high: "bg-red-600 text-white",
} as const;

// Email direction styles
export const emailDirectionStyles = {
  sent: "bg-blue-600 text-white",
  received: "bg-emerald-600 text-white",
} as const;

// Helper function to get style with fallback
export function getStatusStyle<T extends Record<string, string>>(
  styles: T,
  status: string,
  fallback?: string
): string {
  return styles[status as keyof T] || fallback || "bg-slate-400 text-black";
}
