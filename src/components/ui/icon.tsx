import { useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

import "@ui5/webcomponents-icons/dist/AllIcons.js";

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  className?: string;
}

export const Icon = forwardRef<HTMLElement, IconProps>(
  ({ name, className, ...props }, ref) => {
    const iconRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const el = (ref as React.RefObject<HTMLElement>)?.current || iconRef.current;
      if (el) {
        el.setAttribute("name", name);
      }
    }, [name, ref]);

    return (
      <ui5-icon
        ref={ref || iconRef}
        name={name}
        class={cn("inline-flex shrink-0", className)}
        {...props}
      />
    );
  }
);
Icon.displayName = "Icon";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ui5-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { name?: string; class?: string },
        HTMLElement
      >;
    }
  }
}

const ICON_MAP: Record<string, string> = {
  Activity: "activity-2",
  AlertCircle: "alert",
  AlertTriangle: "warning",
  Archive: "folder",
  ArrowDown: "arrow-bottom",
  ArrowLeft: "arrow-left",
  ArrowRight: "arrow-right",
  ArrowUp: "arrow-top",
  ArrowUpDown: "sort",
  BarChart3: "bar-chart",
  Bell: "bell",
  BookOpen: "open-folder",
  Bug: "wrench",
  Building: "factory",
  Building2: "building",
  Briefcase: "business-objects-experience",
  Calendar: "date-time",
  CalendarIcon: "date-time",
  Check: "accept",
  CheckCircle: "sys-enter-2",
  CheckCircle2: "sys-enter-2",
  CheckSquare: "complete",
  ChevronDown: "navigation-down-arrow",
  ChevronLeft: "navigation-left-arrow",
  ChevronRight: "navigation-right-arrow",
  ChevronsUpDown: "unfavorite",
  ChevronUp: "navigation-up-arrow",
  Circle: "circle-task-2",
  CircleDot: "circle-task",
  Clock: "history",
  ClipboardList: "list",
  Contact: "contacts",
  Copy: "copy",
  Diamond: "rhombus-milestone-2",
  DollarSign: "money-bills",
  Dot: "circle-task-2",
  Download: "download",
  Edit: "edit",
  Edit2: "edit",
  ExternalLink: "action",
  Eye: "show",
  EyeOff: "hide",
  FileSignature: "signature",
  FileText: "document-text",
  Filter: "filter",
  Flag: "flag",
  FolderKanban: "folder-blank",
  FolderOpen: "open-folder",
  FolderPlus: "add-folder",
  GripVertical: "overflow",
  HeadphonesIcon: "headset",
  Home: "home",
  Inbox: "inbox",
  Layers: "database",
  LayoutDashboard: "home",
  LayoutGrid: "grid",
  Lightbulb: "lightbulb",
  List: "list",
  Loader2: "synchronize",
  Lock: "locked",
  LogOut: "log",
  Mail: "email",
  MapPin: "map",
  Meh: "away",
  MessageCircle: "discussion-2",
  MessageSquare: "discussion",
  MoreHorizontal: "overflow",
  MoreVertical: "overflow",
  PanelLeft: "menu2",
  Pause: "pause",
  Pencil: "edit",
  Phone: "call",
  Play: "media-play",
  Plus: "add",
  PlusCircle: "add",
  Printer: "print",
  Receipt: "receipt",
  RefreshCw: "refresh",
  Repeat: "restart",
  RotateCcw: "undo",
  Save: "save",
  Search: "search",
  Send: "paper-plane",
  Settings: "action-settings",
  Settings2: "action-settings",
  Shield: "shield",
  ShieldOff: "unlocked",
  Square: "border",
  Tag: "tag",
  Tags: "tags",
  ThumbsDown: "thumb-down",
  ThumbsUp: "thumb-up",
  Ticket: "task",
  Trash2: "delete",
  TrendingUp: "trend-up",
  Upload: "upload",
  User: "employee",
  UserPlus: "add-employee",
  Users: "group",
  Wallet: "wallet",
  Wrench: "wrench",
  X: "decline",
  XCircle: "sys-cancel-2",
  Zap: "status-critical",
};

type IconComponentProps = {
  className?: string;
  [key: string]: unknown;
};

function createIconComponent(lucideName: string, sapName: string) {
  const Comp = forwardRef<HTMLElement, IconComponentProps>(
    ({ className, ...props }, ref) => (
      <ui5-icon
        ref={ref}
        name={sapName}
        class={cn("inline-flex shrink-0", className)}
        {...(props as Record<string, unknown>)}
      />
    )
  );
  Comp.displayName = lucideName;
  return Comp;
}

// Export all mapped icons as named components matching lucide-react API
export const SapActivity = createIconComponent("Activity", ICON_MAP.Activity);
export const SapAlertCircle = createIconComponent("AlertCircle", ICON_MAP.AlertCircle);
export const SapAlertTriangle = createIconComponent("AlertTriangle", ICON_MAP.AlertTriangle);
export const SapArchive = createIconComponent("Archive", ICON_MAP.Archive);
export const SapArrowDown = createIconComponent("ArrowDown", ICON_MAP.ArrowDown);
export const SapArrowLeft = createIconComponent("ArrowLeft", ICON_MAP.ArrowLeft);
export const SapArrowRight = createIconComponent("ArrowRight", ICON_MAP.ArrowRight);
export const SapArrowUp = createIconComponent("ArrowUp", ICON_MAP.ArrowUp);
export const SapArrowUpDown = createIconComponent("ArrowUpDown", ICON_MAP.ArrowUpDown);
export const SapBarChart3 = createIconComponent("BarChart3", ICON_MAP.BarChart3);
export const SapBell = createIconComponent("Bell", ICON_MAP.Bell);
export const SapBookOpen = createIconComponent("BookOpen", ICON_MAP.BookOpen);
export const SapBug = createIconComponent("Bug", ICON_MAP.Bug);
export const SapBuilding = createIconComponent("Building", ICON_MAP.Building);
export const SapBuilding2 = createIconComponent("Building2", ICON_MAP.Building2);
export const SapBriefcase = createIconComponent("Briefcase", ICON_MAP.Briefcase);
export const SapCalendar = createIconComponent("Calendar", ICON_MAP.Calendar);
export const SapCheck = createIconComponent("Check", ICON_MAP.Check);
export const SapCheckCircle = createIconComponent("CheckCircle", ICON_MAP.CheckCircle);
export const SapCheckSquare = createIconComponent("CheckSquare", ICON_MAP.CheckSquare);
export const SapChevronDown = createIconComponent("ChevronDown", ICON_MAP.ChevronDown);
export const SapChevronLeft = createIconComponent("ChevronLeft", ICON_MAP.ChevronLeft);
export const SapChevronRight = createIconComponent("ChevronRight", ICON_MAP.ChevronRight);
export const SapChevronUp = createIconComponent("ChevronUp", ICON_MAP.ChevronUp);
export const SapCircle = createIconComponent("Circle", ICON_MAP.Circle);
export const SapCircleDot = createIconComponent("CircleDot", ICON_MAP.CircleDot);
export const SapClock = createIconComponent("Clock", ICON_MAP.Clock);
export const SapCopy = createIconComponent("Copy", ICON_MAP.Copy);
export const SapDollarSign = createIconComponent("DollarSign", ICON_MAP.DollarSign);
export const SapDownload = createIconComponent("Download", ICON_MAP.Download);
export const SapEdit = createIconComponent("Edit", ICON_MAP.Edit);
export const SapEye = createIconComponent("Eye", ICON_MAP.Eye);
export const SapEyeOff = createIconComponent("EyeOff", ICON_MAP.EyeOff);
export const SapFileText = createIconComponent("FileText", ICON_MAP.FileText);
export const SapFilter = createIconComponent("Filter", ICON_MAP.Filter);
export const SapFlag = createIconComponent("Flag", ICON_MAP.Flag);
export const SapFolderKanban = createIconComponent("FolderKanban", ICON_MAP.FolderKanban);
export const SapFolderOpen = createIconComponent("FolderOpen", ICON_MAP.FolderOpen);
export const SapHome = createIconComponent("Home", ICON_MAP.Home);
export const SapInbox = createIconComponent("Inbox", ICON_MAP.Inbox);
export const SapLayers = createIconComponent("Layers", ICON_MAP.Layers);
export const SapLayoutGrid = createIconComponent("LayoutGrid", ICON_MAP.LayoutGrid);
export const SapLightbulb = createIconComponent("Lightbulb", ICON_MAP.Lightbulb);
export const SapList = createIconComponent("List", ICON_MAP.List);
export const SapLoader2 = createIconComponent("Loader2", ICON_MAP.Loader2);
export const SapLock = createIconComponent("Lock", ICON_MAP.Lock);
export const SapLogOut = createIconComponent("LogOut", ICON_MAP.LogOut);
export const SapMail = createIconComponent("Mail", ICON_MAP.Mail);
export const SapMessageSquare = createIconComponent("MessageSquare", ICON_MAP.MessageSquare);
export const SapMoreVertical = createIconComponent("MoreVertical", ICON_MAP.MoreVertical);
export const SapPencil = createIconComponent("Pencil", ICON_MAP.Pencil);
export const SapPlay = createIconComponent("Play", ICON_MAP.Play);
export const SapPlus = createIconComponent("Plus", ICON_MAP.Plus);
export const SapReceipt = createIconComponent("Receipt", ICON_MAP.Receipt);
export const SapRefreshCw = createIconComponent("RefreshCw", ICON_MAP.RefreshCw);
export const SapSave = createIconComponent("Save", ICON_MAP.Save);
export const SapSearch = createIconComponent("Search", ICON_MAP.Search);
export const SapSend = createIconComponent("Send", ICON_MAP.Send);
export const SapSettings = createIconComponent("Settings", ICON_MAP.Settings);
export const SapShield = createIconComponent("Shield", ICON_MAP.Shield);
export const SapTag = createIconComponent("Tag", ICON_MAP.Tag);
export const SapTicket = createIconComponent("Ticket", ICON_MAP.Ticket);
export const SapTrash2 = createIconComponent("Trash2", ICON_MAP.Trash2);
export const SapTrendingUp = createIconComponent("TrendingUp", ICON_MAP.TrendingUp);
export const SapUpload = createIconComponent("Upload", ICON_MAP.Upload);
export const SapUser = createIconComponent("User", ICON_MAP.User);
export const SapUserPlus = createIconComponent("UserPlus", ICON_MAP.UserPlus);
export const SapUsers = createIconComponent("Users", ICON_MAP.Users);
export const SapWrench = createIconComponent("Wrench", ICON_MAP.Wrench);
export const SapX = createIconComponent("X", ICON_MAP.X);
export const SapXCircle = createIconComponent("XCircle", ICON_MAP.XCircle);
export const SapZap = createIconComponent("Zap", ICON_MAP.Zap);

export { ICON_MAP };
