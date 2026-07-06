import { forwardRef } from "react";
import { cn } from "@/lib/utils";

import "@ui5/webcomponents-icons/dist/AllIcons.js";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ui5-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { name?: string; class?: string },
        HTMLElement
      >;
    }
  }
}

type IconComponentProps = {
  className?: string;
  [key: string]: unknown;
};

function icon(sapName: string, displayName: string) {
  const Comp = forwardRef<HTMLElement, IconComponentProps>(
    ({ className, ...props }, _ref) => (
      <ui5-icon
        name={sapName}
        class={cn("inline-flex shrink-0 [&]:w-[1em] [&]:h-[1em]", className)}
        {...(props as Record<string, unknown>)}
      />
    )
  );
  Comp.displayName = displayName;
  return Comp;
}

// Navigation & Arrows
export const ArrowLeft = icon("navigation-left-arrow", "ArrowLeft");
export const ArrowRight = icon("navigation-right-arrow", "ArrowRight");
export const ArrowUp = icon("arrow-top", "ArrowUp");
export const ArrowDown = icon("arrow-bottom", "ArrowDown");
export const ArrowUpDown = icon("sort", "ArrowUpDown");
export const ChevronDown = icon("slim-arrow-down", "ChevronDown");
export const ChevronUp = icon("slim-arrow-up", "ChevronUp");
export const ChevronLeft = icon("slim-arrow-left", "ChevronLeft");
export const ChevronRight = icon("slim-arrow-right", "ChevronRight");
export const ChevronsUpDown = icon("unfavorite", "ChevronsUpDown");
export const PanelLeft = icon("menu2", "PanelLeft");
export const ExternalLink = icon("action", "ExternalLink");

// Actions
export const Plus = icon("add", "Plus");
export const PlusCircle = icon("add", "PlusCircle");
export const Edit = icon("edit", "Edit");
export const Edit2 = icon("edit", "Edit2");
export const Pencil = icon("edit", "Pencil");
export const Trash2 = icon("delete", "Trash2");
export const Save = icon("save", "Save");
export const Copy = icon("copy", "Copy");
export const Download = icon("download", "Download");
export const Upload = icon("upload", "Upload");
export const Search = icon("search", "Search");
export const Filter = icon("filter", "Filter");
export const RefreshCw = icon("refresh", "RefreshCw");
export const RotateCcw = icon("undo", "RotateCcw");
export const Send = icon("paper-plane", "Send");
export const Printer = icon("print", "Printer");
export const GripVertical = icon("overflow", "GripVertical");
export const Repeat = icon("restart", "Repeat");
export const X = icon("decline", "X");

// Status & Feedback
export const Check = icon("accept", "Check");
export const CheckCircle = icon("sys-enter-2", "CheckCircle");
export const CheckCircle2 = icon("sys-enter-2", "CheckCircle2");
export const CheckSquare = icon("complete", "CheckSquare");
export const AlertCircle = icon("alert", "AlertCircle");
export const AlertTriangle = icon("warning", "AlertTriangle");
export const XCircle = icon("error", "XCircle");
export const Bell = icon("bell", "Bell");
export const Flag = icon("flag", "Flag");
export const ThumbsUp = icon("thumb-up", "ThumbsUp");
export const ThumbsDown = icon("thumb-down", "ThumbsDown");
export const Meh = icon("away", "Meh");

// Objects
export const FileText = icon("document-text", "FileText");
export const FileSignature = icon("signature", "FileSignature");
export const FolderKanban = icon("folder-blank", "FolderKanban");
export const FolderOpen = icon("open-folder", "FolderOpen");
export const FolderPlus = icon("add-folder", "FolderPlus");
export const Inbox = icon("inbox", "Inbox");
export const Mail = icon("email", "Mail");
export const Tag = icon("tag", "Tag");
export const Tags = icon("tags", "Tags");
export const Ticket = icon("task", "Ticket");
export const Receipt = icon("receipt", "Receipt");
export const ClipboardList = icon("list", "ClipboardList");

// People
export const User = icon("employee", "User");
export const UserPlus = icon("add-employee", "UserPlus");
export const Users = icon("group", "Users");
export const Contact = icon("contacts", "Contact");

// Business
export const Building = icon("factory", "Building");
export const Building2 = icon("building", "Building2");
export const Briefcase = icon("business-objects-experience", "Briefcase");
export const DollarSign = icon("money-bills", "DollarSign");
export const Wallet = icon("wallet", "Wallet");
export const TrendingUp = icon("trend-up", "TrendingUp");
export const BarChart3 = icon("horizontal-bar-chart", "BarChart3");

// Layout & View
export const LayoutDashboard = icon("home", "LayoutDashboard");
export const LayoutGrid = icon("grid", "LayoutGrid");
export const List = icon("list", "List");
export const Home = icon("home", "Home");
export const Settings = icon("action-settings", "Settings");
export const Settings2 = icon("action-settings", "Settings2");

// Time
export const Clock = icon("history", "Clock");
export const Calendar = icon("date-time", "Calendar");
export const CalendarIcon = icon("date-time", "CalendarIcon");
export const Play = icon("media-play", "Play");
export const Pause = icon("pause", "Pause");

// Security
export const Lock = icon("locked", "Lock");
export const Shield = icon("shield", "Shield");
export const ShieldOff = icon("unlocked", "ShieldOff");
export const Eye = icon("show", "Eye");
export const EyeOff = icon("hide", "EyeOff");
export const LogOut = icon("log", "LogOut");

// Communication
export const MessageSquare = icon("discussion", "MessageSquare");
export const MessageCircle = icon("discussion-2", "MessageCircle");
export const Phone = icon("call", "Phone");
export const HeadphonesIcon = icon("headset", "HeadphonesIcon");

// Misc
export const Lightbulb = icon("lightbulb", "Lightbulb");
export const Wrench = icon("wrench", "Wrench");
export const Bug = icon("inspect", "Bug");
export const Zap = icon("status-critical", "Zap");
export const BookOpen = icon("course-book", "BookOpen");
export const CircleDot = icon("circle-task", "CircleDot");
export const Circle = icon("circle-task-2", "Circle");
export const Layers = icon("header", "Layers");
export const Diamond = icon("rhombus-milestone-2", "Diamond");
export const Square = icon("border", "Square");
export const Dot = icon("circle-task-2", "Dot");
export const Activity = icon("activity-2", "Activity");
export const Archive = icon("folder", "Archive");
export const MapPin = icon("map", "MapPin");
export const MoreVertical = icon("overflow", "MoreVertical");
export const MoreHorizontal = icon("overflow", "MoreHorizontal");

// Extended icons
export const UserCircle = icon("customer", "UserCircle");
export const UserCheck = icon("employee-approvals", "UserCheck");
export const UserMinus = icon("less", "UserMinus");
export const Quote = icon("request", "Quote");
export const Sparkles = icon("lightbulb", "Sparkles");
export const Mountain = icon("overview-chart", "Mountain");
export const Timer = icon("fob-watch", "Timer");
export const Apple = icon("meal", "Apple");
export const Monitor = icon("sys-monitor", "Monitor");
export const Database = icon("database", "Database");
export const Image = icon("picture", "Image");
export const Crown = icon("competitor", "Crown");
export const Unlock = icon("unlocked", "Unlock");
export const ShieldCheck = icon("shield", "ShieldCheck");
export const ShieldAlert = icon("warning2", "ShieldAlert");
export const TrendingDown = icon("trend-down", "TrendingDown");
export const Star = icon("favorite", "Star");
export const Globe = icon("world", "Globe");
export const Link = icon("chain-link", "Link");
export const Key = icon("key", "Key");
export const Hash = icon("number-sign", "Hash");
export const Percent = icon("sales-order", "Percent");
export const Calculator = icon("calculator", "Calculator");
export const CreditCard = icon("credit-card", "CreditCard");
export const PieChart = icon("pie-chart", "PieChart");
export const Target = icon("target-group", "Target");
export const Trophy = icon("competitor", "Trophy");
export const Milestone = icon("milestone", "Milestone");
export const Bookmark = icon("bookmark", "Bookmark");
export const Flame = icon("heating-cooling", "Flame");
export const Handshake = icon("handshake", "Handshake");
export const ListChecks = icon("checklist-item", "ListChecks");
export const FileCheck = icon("document", "FileCheck");
export const Sliders = icon("action-settings", "Sliders");
export const AlignLeft = icon("text-align-left", "AlignLeft");
export const Type = icon("text", "Type");
export const Palette = icon("palette", "Palette");
export const ToggleLeft = icon("switch-classes", "ToggleLeft");
export const Smartphone = icon("iphone", "Smartphone");
export const Tablet = icon("ipad", "Tablet");
export const Sun = icon("light-mode", "Sun");
export const Moon = icon("dark-mode", "Moon");
export const ArrowUpRight = icon("arrow-top", "ArrowUpRight");
export const ArrowDownRight = icon("arrow-bottom", "ArrowDownRight");
export const PhoneCall = icon("outgoing-call", "PhoneCall");
export const Facebook = icon("marketing-campaign", "Facebook");
export const Twitter = icon("marketing-campaign", "Twitter");
export const Linkedin = icon("marketing-campaign", "Linkedin");

// Loader (special — keep as lucide for animation)
export { Loader2 } from "lucide-react";

// LucideIcon type alias for compatibility
export type { LucideIcon } from "lucide-react";
