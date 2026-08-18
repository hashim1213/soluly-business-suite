import { useState } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import {
  Building,
  Plus,
  Search,
  DollarSign,
  MoreVertical,
  Trash2,
  ArrowRight,
  Target,
  Handshake,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Users,
  UserPlus,
  CheckSquare,
  Calendar,
  Clock,
  Edit,
  User,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, useCreateActivity, useTasks, useCreateTask, useUpdateTask, Quote } from "@/hooks/useQuotes";
import { usePipelineStages, isWonStatus, isOpenStatus, stageTextColor, PipelineStage } from "@/hooks/usePipelineStages";
import { useDealGroups, useCreateDealGroup } from "@/hooks/useDealGroups";
import { useDropdownOptions, optionLabel, optionColor } from "@/hooks/useDropdownOptions";
import { useCrmClients, useCrmLeads, useCreateCrmClient, useCreateCrmLead, useDeleteCrmClient, useDeleteCrmLead, useConvertLeadToClient, useUpdateCrmLead, useUpdateCrmClient, CrmClient } from "@/hooks/useCRM";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, Contact } from "@/hooks/useContacts";
import { useBulkAddClientContacts } from "@/hooks/useClientContacts";
import { useTags } from "@/hooks/useTags";
import { useExportContacts, useImportContacts, parseCSV } from "@/hooks/useContactImportExport";
import { Database } from "@/integrations/supabase/types";
import { X, PlusCircle, Upload, Download, Tags, Filter, LayoutGrid, List, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type QuoteStatus = Database["public"]["Enums"]["quote_status"];
type ActivityType = Database["public"]["Enums"]["activity_type"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

// Generic client-side column sorting shared by the CRM tables
type SortState = { key: string; dir: "asc" | "desc" };

function sortRows<T>(
  list: T[],
  sort: SortState,
  getters: Record<string, (item: T) => string | number | null | undefined>
): T[] {
  const get = getters[sort.key];
  if (!get) return list;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function SortableTh({
  sort,
  onSort,
  id,
  label,
  className,
}: {
  sort: SortState;
  onSort: (id: string) => void;
  id: string;
  label: string;
  className?: string;
}) {
  const active = sort.key === id;
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(id)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  );
}

function ViewToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
}) {
  return (
    <div className="flex items-center rounded-sm border border-input overflow-hidden shrink-0">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(opt.value)}
          className={cn("rounded-none h-8 px-2.5", value === opt.value && "bg-accent text-accent-foreground")}
          aria-label={opt.label}
          title={opt.label}
        >
          <opt.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

function savedView(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export default function CRM() {
  const { navigateOrg } = useOrgNavigation();
  const canViewAmounts = useCanViewAmounts();
  const { data: quotes, isLoading: quotesLoading, error: quotesError } = useQuotes();
  const { data: clients, isLoading: clientsLoading } = useCrmClients();
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const createActivity = useCreateActivity();
  const createClient = useCreateCrmClient();
  const deleteClient = useDeleteCrmClient();
  const createLead = useCreateCrmLead();
  const deleteLead = useDeleteCrmLead();
  const updateLead = useUpdateCrmLead();
  const convertLead = useConvertLeadToClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const bulkAddClientContacts = useBulkAddClientContacts();
  const updateClient = useUpdateCrmClient();
  const { data: tags } = useTags();
  const exportContacts = useExportContacts();
  const importContacts = useImportContacts();
  const { data: pipelineStages = [] } = usePipelineStages();
  const { data: dealGroups } = useDealGroups();
  const createDealGroup = useCreateDealGroup();
  const { data: leadStatusOptions } = useDropdownOptions("lead_status");
  const { data: activityTypeOptions } = useDropdownOptions("crm_activity_type");

  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [dealGroupFilter, setDealGroupFilter] = useState<string>("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [dealsView, setDealsViewState] = useState<string>(() => savedView("soluly-crm-deals-view", "board"));
  const [leadsView, setLeadsViewState] = useState<string>(() => savedView("soluly-crm-leads-view", "table"));
  const [dealSort, setDealSort] = useState<SortState>({ key: "", dir: "asc" });
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [leadSort, setLeadSort] = useState<SortState>({ key: "", dir: "asc" });
  const [clientSort, setClientSort] = useState<SortState>({ key: "", dir: "asc" });
  const [contactSort, setContactSort] = useState<SortState>({ key: "", dir: "asc" });

  const setDealsView = (v: string) => {
    setDealsViewState(v);
    try { localStorage.setItem("soluly-crm-deals-view", v); } catch { /* ignore */ }
  };
  const setLeadsView = (v: string) => {
    setLeadsViewState(v);
    try { localStorage.setItem("soluly-crm-leads-view", v); } catch { /* ignore */ }
  };
  const makeSortToggle = (sort: SortState, set: (s: SortState) => void) => (key: string) =>
    set(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const toggleDealSort = makeSortToggle(dealSort, setDealSort);
  const toggleLeadSort = makeSortToggle(leadSort, setLeadSort);
  const toggleClientSort = makeSortToggle(clientSort, setClientSort);
  const toggleContactSort = makeSortToggle(contactSort, setContactSort);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    company_name: "",
    contact_name: "",
    contact_email: "",
    value: "",
    valid_until: "",
    notes: "",
    contact_id: "",
    deal_group_id: "",
  });
  const [newDealGroupName, setNewDealGroupName] = useState("");
  const [isCreatingDealGroupInline, setIsCreatingDealGroupInline] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "call" as ActivityType,
    description: "",
    duration: "",
  });
  const [newClient, setNewClient] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    industry: "",
  });
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [newLead, setNewLead] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    source: "",
    notes: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    quote_id: "",
  });
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    job_title: "",
    company_id: "",
    address: "",
    notes: "",
  });
  const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
  const [isCreatingCompanyInline, setIsCreatingCompanyInline] = useState(false);
  const [isCreatingCompanyInlineEdit, setIsCreatingCompanyInlineEdit] = useState(false);
  const [inlineCompanyName, setInlineCompanyName] = useState("");
  const [inlineCompanyNameEdit, setInlineCompanyNameEdit] = useState("");

  const isLoading = quotesLoading || clientsLoading || leadsLoading || tasksLoading || contactsLoading;

  // Filter quotes by search and deal group
  const filteredQuotes = quotes?.filter((quote) => {
    if (dealGroupFilter !== "all") {
      if (dealGroupFilter === "none") {
        if (quote.deal_group_id) return false;
      } else if (quote.deal_group_id !== dealGroupFilter) {
        return false;
      }
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quote.title.toLowerCase().includes(query) ||
      quote.company_name.toLowerCase().includes(query) ||
      quote.contact_name?.toLowerCase().includes(query) ||
      quote.deal_group?.name?.toLowerCase().includes(query)
    );
  }) || [];

  // Group deals by stage
  const dealsByStage = pipelineStages.map((stage) => ({
    ...stage,
    deals: filteredQuotes.filter((q) => q.status === stage.key),
    totalValue: filteredQuotes
      .filter((q) => q.status === stage.key)
      .reduce((sum, q) => sum + q.value, 0),
  }));

  // Calculate pipeline stats
  const totalPipelineValue = filteredQuotes
    .filter((q) => isOpenStatus(pipelineStages, q.status))
    .reduce((sum, q) => sum + q.value, 0);
  const wonValue = filteredQuotes
    .filter((q) => isWonStatus(pipelineStages, q.status))
    .reduce((sum, q) => sum + q.value, 0);
  const activeDeals = filteredQuotes.filter(
    (q) => isOpenStatus(pipelineStages, q.status)
  ).length;

  // Filter leads
  const filteredLeads = leads?.filter((lead) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.contact_name?.toLowerCase().includes(query) ||
      lead.contact_email?.toLowerCase().includes(query)
    );
  }) || [];

  // Filter clients
  const filteredClients = clients?.filter((client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.contact_name?.toLowerCase().includes(query) ||
      client.contact_email?.toLowerCase().includes(query)
    );
  }) || [];

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }) || [];

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Filter contacts
  const filteredContacts = contacts?.filter((contact) => {
    // Tag filter
    if (tagFilter !== "all") {
      const hasTag = contact.tags?.some((ct) => ct.tag_id === tagFilter);
      if (!hasTag) return false;
    }
    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.job_title?.toLowerCase().includes(query) ||
      contact.company?.name?.toLowerCase().includes(query)
    );
  }) || [];

  // Column-sorted lists for the table views
  const sortedDeals = sortRows(filteredQuotes, dealSort, {
    title: (q) => q.title,
    company_name: (q) => q.company_name,
    deal_group: (q) => q.deal_group?.name,
    status: (q) => pipelineStages.findIndex((s) => s.key === q.status),
    value: (q) => q.value,
    valid_until: (q) => q.valid_until,
    last_activity: (q) => q.last_activity,
  });
  const sortedLeads = sortRows(filteredLeads, leadSort, {
    name: (l) => l.name,
    status: (l) => l.status,
    contact_name: (l) => l.contact_name,
    contact_email: (l) => l.contact_email,
    source: (l) => l.source,
    created_at: (l) => l.created_at,
  });
  const sortedClients = sortRows(filteredClients, clientSort, {
    name: (c) => c.name,
    status: (c) => c.status,
    contact_name: (c) => c.contact_name,
    contact_email: (c) => c.contact_email,
    contact_phone: (c) => c.contact_phone,
    industry: (c) => c.industry,
    total_revenue: (c) => c.total_revenue,
  });
  const sortedContacts = sortRows(filteredContacts, contactSort, {
    name: (c) => c.name,
    job_title: (c) => c.job_title,
    company: (c) => c.company?.name,
    email: (c) => c.email,
    phone: (c) => c.phone,
    created_at: (c) => c.created_at,
  });

  const handleCreateDeal = async () => {
    if (!newDeal.title || !newDeal.company_name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      let dealGroupId = newDeal.deal_group_id || null;
      if (isCreatingDealGroupInline && newDealGroupName.trim()) {
        const group = await createDealGroup.mutateAsync({ name: newDealGroupName.trim() });
        dealGroupId = group.id;
      }

      // Manually entered contacts are saved to Contacts, unless one with
      // the same email (or name, when no email is given) already exists
      const contactName = newDeal.contact_name.trim();
      const contactEmail = newDeal.contact_email.trim();
      if (!newDeal.contact_id && contactName) {
        const existing = contacts?.find((c) =>
          contactEmail
            ? c.email?.toLowerCase() === contactEmail.toLowerCase()
            : c.name.toLowerCase() === contactName.toLowerCase()
        );
        if (!existing) {
          const matchedCompany = clients?.find(
            (c) => c.name.toLowerCase() === newDeal.company_name.trim().toLowerCase()
          );
          await createContact.mutateAsync({
            name: contactName,
            email: contactEmail || undefined,
            company_id: matchedCompany?.id,
          });
        }
      }

      const firstStage = pipelineStages[0];
      await createQuote.mutateAsync({
        title: newDeal.title,
        description: newDeal.description || null,
        company_name: newDeal.company_name,
        contact_name: newDeal.contact_name || null,
        contact_email: newDeal.contact_email || null,
        value: parseFloat(newDeal.value) || 0,
        valid_until: newDeal.valid_until || null,
        notes: newDeal.notes || null,
        deal_group_id: dealGroupId,
        status: firstStage?.key || "draft",
        stage: firstStage?.winProgress ?? 10,
      });

      setNewDeal({
        title: "",
        description: "",
        company_name: "",
        contact_name: "",
        contact_email: "",
        value: "",
        valid_until: "",
        notes: "",
        contact_id: "",
        deal_group_id: "",
      });
      setNewDealGroupName("");
      setIsCreatingDealGroupInline(false);
      setIsNewDealOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        name: newClient.name,
        contact_name: newClient.contact_name || null,
        contact_email: newClient.contact_email || null,
        contact_phone: newClient.contact_phone || null,
        industry: newClient.industry || null,
        status: "active",
      });

      // Link selected contacts to the client
      if (selectedContactIds.length > 0 && client.id) {
        await bulkAddClientContacts.mutateAsync({
          clientId: client.id,
          contactIds: selectedContactIds,
          primaryContactId: selectedContactIds[0], // First selected is primary
        });
      }

      setNewClient({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        industry: "",
      });
      setSelectedContactIds([]);
      setIsNewClientOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Helper to toggle contact selection
  const handleToggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      }
      return [...prev, contactId];
    });
  };

  // Auto-fill contact details when first contact is selected
  const handleSelectContact = (contactId: string) => {
    const contact = contacts?.find(c => c.id === contactId);
    if (!contact) return;

    handleToggleContactSelection(contactId);

    // Auto-fill only if this is the first contact being added
    if (!selectedContactIds.includes(contactId) && selectedContactIds.length === 0) {
      setNewClient(prev => ({
        ...prev,
        contact_name: contact.name || prev.contact_name,
        contact_email: contact.email || prev.contact_email,
        contact_phone: contact.phone || prev.contact_phone,
      }));
    }
  };

  // Handle inline company creation when adding a contact
  const handleCreateInlineCompany = async () => {
    if (!inlineCompanyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      const newCompany = await createClient.mutateAsync({
        name: inlineCompanyName.trim(),
        status: "active",
      });

      // Set the new company as the selected company for the contact
      setNewContact(prev => ({ ...prev, company_id: newCompany.id }));
      setInlineCompanyName("");
      setIsCreatingCompanyInline(false);
      toast.success("Company created successfully");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle inline company creation when editing a contact
  const handleCreateInlineCompanyEdit = async () => {
    if (!inlineCompanyNameEdit.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      const newCompany = await createClient.mutateAsync({
        name: inlineCompanyNameEdit.trim(),
        status: "active",
      });

      // Set the new company as the selected company for the editing contact
      if (editingContact) {
        setEditingContact({ ...editingContact, company_id: newCompany.id });
      }
      setInlineCompanyNameEdit("");
      setIsCreatingCompanyInlineEdit(false);
      toast.success("Company created successfully");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle updating a client
  const handleUpdateClient = async () => {
    if (!editingClient || !editingClient.name) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      await updateClient.mutateAsync({
        id: editingClient.id,
        name: editingClient.name,
        contact_name: editingClient.contact_name || null,
        contact_email: editingClient.contact_email || null,
        contact_phone: editingClient.contact_phone || null,
        industry: editingClient.industry || null,
      });

      setEditingClient(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      await createLead.mutateAsync({
        name: newLead.name,
        contact_name: newLead.contact_name || null,
        contact_email: newLead.contact_email || null,
        contact_phone: newLead.contact_phone || null,
        source: newLead.source || null,
        notes: newLead.notes || null,
        status: "new",
      });

      setNewLead({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        source: "",
        notes: "",
      });
      setIsNewLeadOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        quote_id: newTask.quote_id || null,
        completed: false,
      });

      setNewTask({
        title: "",
        description: "",
        due_date: "",
        quote_id: "",
      });
      setIsNewTaskOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name) {
      toast.error("Please enter a contact name");
      return;
    }

    try {
      await createContact.mutateAsync({
        name: newContact.name,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        job_title: newContact.job_title || undefined,
        company_id: newContact.company_id || undefined,
        address: newContact.address || undefined,
        notes: newContact.notes || undefined,
      });

      setNewContact({
        name: "",
        email: "",
        phone: "",
        job_title: "",
        company_id: "",
        address: "",
        notes: "",
      });
      setIsNewContactOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !editingContact.name) {
      toast.error("Please enter a contact name");
      return;
    }

    try {
      await updateContact.mutateAsync({
        id: editingContact.id,
        name: editingContact.name,
        email: editingContact.email || undefined,
        phone: editingContact.phone || undefined,
        job_title: editingContact.job_title || undefined,
        company_id: editingContact.company_id || undefined,
        notes: editingContact.notes || undefined,
      });

      setEditingContact(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleMoveStage = (quoteId: string, newStatus: QuoteStatus) => {
    const stage = pipelineStages.find((s) => s.key === newStatus);
    updateQuote.mutate({
      id: quoteId,
      status: newStatus,
      stage: stage?.winProgress ?? 10,
    });
  };

  const handleLogActivity = async () => {
    if (!selectedQuoteId || !newActivity.description) {
      toast.error("Please fill in the activity description");
      return;
    }

    try {
      await createActivity.mutateAsync({
        quote_id: selectedQuoteId,
        type: newActivity.type,
        description: newActivity.description,
        duration: newActivity.duration || null,
      });

      setNewActivity({ type: "call", description: "", duration: "" });
      setIsActivityDialogOpen(false);
      setSelectedQuoteId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({ id: taskId, completed });
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatValue = (value: number) => {
    if (!canViewAmounts) return "••••••";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const d = dateString.includes("T") ? new Date(dateString) : new Date(dateString + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (quotesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load CRM data</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <p className="text-sm text-muted-foreground">Manage your sales pipeline, leads, clients, and tasks</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-blue-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold font-mono">{formatValue(totalPipelineValue)}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-emerald-600">
                <Handshake className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold font-mono">{formatValue(wonValue)}</div>
                <div className="text-sm text-muted-foreground">Won Deals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{leads?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Active Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border border-border flex items-center justify-center bg-amber-500">
                <Building className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{clients?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deals, leads, clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="border border-border bg-secondary p-1 w-max sm:w-auto">
            <TabsTrigger value="pipeline" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Pipeline</span>
              <span className="sm:hidden">Pipe</span> ({activeDeals})
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Leads ({leads?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Clients ({clients?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Tasks ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Contacts</span>
              <span className="sm:hidden">Cont</span> ({contacts?.length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Select value={dealGroupFilter} onValueChange={setDealGroupFilter}>
              <SelectTrigger className="border h-9 w-[180px]">
                <SelectValue placeholder="All deal groups" />
              </SelectTrigger>
              <SelectContent className="border">
                <SelectItem value="all">All deal groups</SelectItem>
                <SelectItem value="none">Ungrouped</SelectItem>
                {dealGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ViewToggle
              value={dealsView}
              onChange={setDealsView}
              options={[
                { value: "board", icon: LayoutGrid, label: "Board view" },
                { value: "table", icon: List, label: "Table view" },
              ]}
            />
            <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
              <DialogTrigger asChild>
                <Button className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[500px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Create New Deal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label>Deal Title *</Label>
                    <Input
                      placeholder="e.g., Enterprise Package Quote"
                      value={newDeal.title}
                      onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deal Group</Label>
                    {isCreatingDealGroupInline ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., First Farms"
                          value={newDealGroupName}
                          onChange={(e) => setNewDealGroupName(e.target.value)}
                          className="border"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsCreatingDealGroupInline(false);
                            setNewDealGroupName("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={newDeal.deal_group_id || "none"}
                        onValueChange={(v) => {
                          if (v === "new") {
                            setIsCreatingDealGroupInline(true);
                            setNewDeal({ ...newDeal, deal_group_id: "" });
                          } else {
                            setNewDeal({ ...newDeal, deal_group_id: v === "none" ? "" : v });
                          }
                        }}
                      >
                        <SelectTrigger className="border">
                          <SelectValue placeholder="No deal group" />
                        </SelectTrigger>
                        <SelectContent className="border">
                          <SelectItem value="none">No deal group</SelectItem>
                          {dealGroups?.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="h-4 w-4" /> New deal group…
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Group multiple customers under one deal, e.g. "First Farms" or "University".
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the deal..."
                      value={newDeal.description}
                      onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Select Contact</Label>
                    <Select
                      value={newDeal.contact_id}
                      onValueChange={(contactId) => {
                        if (contactId === "manual") {
                          setNewDeal({
                            ...newDeal,
                            contact_id: "",
                            contact_name: "",
                            contact_email: "",
                            company_name: "",
                          });
                        } else {
                          const selectedContact = contacts?.find((c) => c.id === contactId);
                          if (selectedContact) {
                            setNewDeal({
                              ...newDeal,
                              contact_id: contactId,
                              contact_name: selectedContact.name,
                              contact_email: selectedContact.email || "",
                              company_name: selectedContact.company?.name || "",
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="border">
                        <SelectValue placeholder="Select from contacts or enter manually" />
                      </SelectTrigger>
                      <SelectContent className="border">
                        <SelectItem value="manual">Enter manually</SelectItem>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                            {contact.company?.name && (
                              <span className="text-muted-foreground"> - {contact.company.name}</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Company Name *</Label>
                      <Input
                        placeholder="Company name"
                        value={newDeal.company_name}
                        onChange={(e) => setNewDeal({ ...newDeal, company_name: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Deal Value ($)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newDeal.value}
                        onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input
                        placeholder="Contact name"
                        value={newDeal.contact_name}
                        onChange={(e) => setNewDeal({ ...newDeal, contact_name: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={newDeal.contact_email}
                        onChange={(e) => setNewDeal({ ...newDeal, contact_email: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={newDeal.valid_until}
                      onChange={(e) => setNewDeal({ ...newDeal, valid_until: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Internal notes..."
                      value={newDeal.notes}
                      onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                      className="border"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsNewDealOpen(false)} className="border">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDeal} className="border" disabled={createQuote.isPending}>
                    {createQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pipeline View */}
          {dealsView === "board" ? (
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
            pipelineStages.length <= 4 ? "xl:grid-cols-4" : "xl:grid-cols-5"
          )}>
            {dealsByStage.map((stage) => (
              <Card key={stage.key} className="border border-border shadow-sm">
                <CardHeader
                  className="py-3 px-4"
                  style={{ backgroundColor: stage.color, color: stageTextColor(stage.color) }}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{stage.name}</CardTitle>
                    <Badge variant="secondary" className="bg-white/20 text-current border-0">
                      {stage.deals.length}
                    </Badge>
                  </div>
                  <div className="text-xs opacity-80">
                    {formatValue(stage.totalValue)}
                  </div>
                </CardHeader>
                <CardContent
                  className={cn(
                    "p-2 space-y-2 min-h-[200px] transition-colors",
                    hoveredStage === stage.key && "ring-2 ring-primary/40 bg-accent/50"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredStage(stage.key);
                  }}
                  onDragLeave={() => setHoveredStage(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredStage(null);
                    const draggedId = e.dataTransfer.getData("text/plain");
                    if (!draggedId) return;
                    handleMoveStage(draggedId, stage.key as QuoteStatus);
                    toast.success(`Deal moved to ${stage.name}`);
                  }}
                >
                  {stage.deals.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No deals
                    </div>
                  ) : (
                    stage.deals.map((deal) => (
                      <Card
                        key={deal.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", deal.id)}
                        className="border border-border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                        onClick={() => navigateOrg(`/quotes/${deal.display_id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {deal.deal_group && (
                                <Badge
                                  variant="outline"
                                  className="mb-1 text-[10px] px-1.5 py-0 font-medium border"
                                  style={{ borderColor: deal.deal_group.color, color: deal.deal_group.color }}
                                >
                                  {deal.deal_group.name}
                                </Badge>
                              )}
                              <p className="font-medium text-sm truncate">{deal.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {deal.company_name}
                              </p>
                              <p className="text-sm font-mono font-semibold mt-1">
                                {formatValue(deal.value)}
                              </p>
                              {deal.valid_until && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Close {formatDate(deal.valid_until)}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuoteId(deal.id);
                                  setIsActivityDialogOpen(true);
                                }}>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Log Activity
                                </DropdownMenuItem>
                                {pipelineStages
                                  .filter((s) => s.key !== stage.key)
                                  .map((target) => (
                                    <DropdownMenuItem
                                      key={target.key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveStage(deal.id, target.key as QuoteStatus);
                                      }}
                                      className={cn(
                                        target.stageCategory === "won" && "text-green-600",
                                        target.stageCategory === "lost" && "text-destructive"
                                      )}
                                    >
                                      {target.stageCategory === "won" ? (
                                        <ChevronRight className="h-4 w-4 mr-2" />
                                      ) : (
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                      )}
                                      Move to {target.name}
                                    </DropdownMenuItem>
                                  ))}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteQuote.mutate(deal.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Deal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <Progress value={deal.stage} className="h-1 mt-2" />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          ) : (
            <Card className="border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="title" label="Deal" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="deal_group" label="Group" className="hidden sm:table-cell" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="company_name" label="Company" className="hidden md:table-cell" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="status" label="Stage" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="value" label="Value" className="text-right" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="valid_until" label="Close Date" className="hidden lg:table-cell" />
                    <SortableTh sort={dealSort} onSort={toggleDealSort} id="last_activity" label="Last Activity" className="hidden xl:table-cell" />
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDeals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No deals yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedDeals.map((deal) => (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer"
                        onClick={() => navigateOrg(`/quotes/${deal.display_id}`)}
                      >
                        <TableCell>
                          <div className="font-medium leading-tight">{deal.title}</div>
                          <div className="font-mono text-xs text-muted-foreground">{deal.display_id}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {deal.deal_group ? (
                            <Badge
                              variant="outline"
                              className="text-xs font-medium border"
                              style={{ borderColor: deal.deal_group.color, color: deal.deal_group.color }}
                            >
                              {deal.deal_group.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{deal.company_name}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={deal.status}
                            onValueChange={(v) => handleMoveStage(deal.id, v as QuoteStatus)}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pipelineStages.map((s) => (
                                <SelectItem key={s.key} value={s.key}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatValue(deal.value)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                          {formatDate(deal.valid_until)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground whitespace-nowrap">
                          {deal.last_activity ? formatDate(deal.last_activity) : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedQuoteId(deal.id);
                                  setIsActivityDialogOpen(true);
                                }}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Log Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigateOrg(`/quotes/${deal.display_id}`)}>
                                <ChevronRight className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteQuote.mutate(deal.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Deal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <ViewToggle
              value={leadsView}
              onChange={setLeadsView}
              options={[
                { value: "table", icon: List, label: "Table view" },
                { value: "cards", icon: LayoutGrid, label: "Card view" },
              ]}
            />
            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
              <DialogTrigger asChild>
                <Button className="border">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[500px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Contact Name</Label>
                      <Input
                        placeholder="Contact name"
                        value={newLead.contact_name}
                        onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={newLead.contact_email}
                        onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 234 567 8900"
                        value={newLead.contact_phone}
                        onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Source</Label>
                      <Input
                        placeholder="e.g., Website, Referral"
                        value={newLead.source}
                        onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newLead.notes}
                      onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                      className="border"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsNewLeadOpen(false)} className="border">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLead} className="border" disabled={createLead.isPending}>
                    {createLead.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredLeads.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-8 text-center">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Leads Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first lead to start tracking potential customers.</p>
                <Button onClick={() => setIsNewLeadOpen(true)} className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </CardContent>
            </Card>
          ) : leadsView === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedLeads.map((lead) => (
                <Card key={lead.id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            style={{
                              backgroundColor: optionColor(leadStatusOptions, lead.status) || "#6B7280",
                              color: stageTextColor(optionColor(leadStatusOptions, lead.status) || "#6B7280"),
                            }}
                          >
                            {optionLabel(leadStatusOptions, lead.status)}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{lead.display_id}</span>
                        </div>
                        <h3 className="font-semibold truncate">{lead.name}</h3>
                        {lead.contact_name && (
                          <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                        )}
                        {lead.contact_email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" /> {lead.contact_email}
                          </p>
                        )}
                        {lead.source && (
                          <p className="text-xs text-muted-foreground mt-1">Source: {lead.source}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border">
                          {leadStatusOptions
                            ?.filter((opt) => opt.value !== lead.status)
                            .map((opt) => (
                              <DropdownMenuItem
                                key={opt.value}
                                onClick={() => updateLead.mutate({ id: lead.id, status: opt.value as LeadStatus })}
                              >
                                Mark as {opt.label}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuItem onClick={() => convertLead.mutate(lead.id)} className="text-chart-2">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteLead.mutate(lead.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="name" label="Lead" />
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="status" label="Status" />
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="contact_name" label="Contact" className="hidden md:table-cell" />
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="contact_email" label="Email" className="hidden lg:table-cell" />
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="source" label="Source" className="hidden xl:table-cell" />
                    <SortableTh sort={leadSort} onSort={toggleLeadSort} id="created_at" label="Created" className="hidden lg:table-cell" />
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium leading-tight">{lead.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{lead.display_id}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => updateLead.mutate({ id: lead.id, status: v as LeadStatus })}
                        >
                          <SelectTrigger
                            className="h-7 w-[120px] border-transparent px-2 text-xs font-semibold shadow-none"
                            style={{
                              backgroundColor: optionColor(leadStatusOptions, lead.status) || "#6B7280",
                              color: stageTextColor(optionColor(leadStatusOptions, lead.status) || "#6B7280"),
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatusOptions?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{lead.contact_name || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {lead.contact_email || "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">
                        {lead.source || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs hidden sm:inline-flex"
                            onClick={() => convertLead.mutate(lead.id)}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Convert
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border">
                              <DropdownMenuItem onClick={() => convertLead.mutate(lead.id)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Convert to Client
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteLead.mutate(lead.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
              <DialogTrigger asChild>
                <Button className="border">
                  <Building className="h-4 w-4 mr-2" />
                  New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[600px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Add New Client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="border"
                    />
                  </div>

                  {/* Contacts Multi-Select Section */}
                  <div className="grid gap-2">
                    <Label>Link Contacts</Label>
                    <p className="text-xs text-muted-foreground">Select contacts to associate with this client. First selected will be primary.</p>

                    {/* Selected Contacts */}
                    {selectedContactIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedContactIds.map((contactId, index) => {
                          const contact = contacts?.find(c => c.id === contactId);
                          return contact ? (
                            <Badge
                              key={contactId}
                              variant={index === 0 ? "default" : "secondary"}
                              className="flex items-center gap-1 pr-1"
                            >
                              {contact.name}
                              {index === 0 && <span className="text-xs ml-1">(Primary)</span>}
                              <button
                                type="button"
                                onClick={() => handleToggleContactSelection(contactId)}
                                className="ml-1 hover:bg-black/20 rounded p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Contact Dropdown */}
                    <Select
                      value=""
                      onValueChange={handleSelectContact}
                    >
                      <SelectTrigger className="border">
                        <SelectValue placeholder="Select contacts to add..." />
                      </SelectTrigger>
                      <SelectContent className="border max-h-60">
                        {contacts?.filter(c => !selectedContactIds.includes(c.id)).map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{contact.name}</span>
                              {contact.email && (
                                <span className="text-xs text-muted-foreground">({contact.email})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {contacts?.filter(c => !selectedContactIds.includes(c.id)).length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No more contacts available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium mb-3">Primary Contact Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Contact Name</Label>
                        <Input
                          placeholder="Contact name"
                          value={newClient.contact_name}
                          onChange={(e) => setNewClient({ ...newClient, contact_name: e.target.value })}
                          className="border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          placeholder="email@company.com"
                          value={newClient.contact_email}
                          onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                          className="border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input
                          placeholder="+1 234 567 8900"
                          value={newClient.contact_phone}
                          onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                          className="border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Industry</Label>
                        <Input
                          placeholder="e.g., Technology"
                          value={newClient.industry}
                          onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                          className="border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => { setIsNewClientOpen(false); setSelectedContactIds([]); }} className="border">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClient} className="border" disabled={createClient.isPending || bulkAddClientContacts.isPending}>
                    {(createClient.isPending || bulkAddClientContacts.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredClients.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Clients Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first client or convert a lead.</p>
                <Button onClick={() => setIsNewClientOpen(true)} className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile List View */}
              <div className="md:hidden space-y-3">
                {filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className="border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigateOrg(`/clients/${client.display_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-emerald-600 text-white text-xs">
                              {client.status}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">{client.display_id}</span>
                          </div>
                          <h3 className="font-semibold truncate">{client.name}</h3>
                          {client.contact_name && (
                            <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                          )}
                          {client.contact_email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" /> {client.contact_email}
                            </p>
                          )}
                          {client.contact_phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" /> {client.contact_phone}
                            </p>
                          )}
                          {client.industry && (
                            <p className="text-xs text-muted-foreground mt-1">Industry: {client.industry}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateOrg(`/clients/${client.display_id}`); }}>
                              <ChevronRight className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Quick Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteClient.mutate(client.id); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Card className="border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="name" label="Client" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="status" label="Status" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="contact_name" label="Contact" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="contact_email" label="Email" className="hidden lg:table-cell" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="contact_phone" label="Phone" className="hidden xl:table-cell" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="industry" label="Industry" className="hidden xl:table-cell" />
                        <SortableTh sort={clientSort} onSort={toggleClientSort} id="total_revenue" label="Revenue" className="text-right" />
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedClients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="cursor-pointer"
                          onClick={() => navigateOrg(`/clients/${client.display_id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[200px]" title={client.name}>{client.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{client.display_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={client.status}
                              onValueChange={(v) =>
                                updateClient.mutate({ id: client.id, status: v as CrmClient["status"] })
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-7 w-[110px] border-transparent px-2 text-xs font-semibold shadow-none",
                                  client.status === "active" ? "bg-emerald-600 text-white" : "bg-slate-400 text-black"
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[150px] block" title={client.contact_name || ""}>
                              {client.contact_name || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground truncate max-w-[180px] block" title={client.contact_email || ""}>
                              {client.contact_email || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {client.contact_phone || "—"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <span className="text-sm text-muted-foreground truncate max-w-[120px] block" title={client.industry || ""}>
                              {client.industry || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatValue(client.total_revenue)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border">
                                <DropdownMenuItem onClick={() => navigateOrg(`/clients/${client.display_id}`)}>
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingClient(client)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Quick Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteClient.mutate(client.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Client
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
              <DialogTrigger asChild>
                <Button className="border">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="border sm:max-w-[500px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Task Title *</Label>
                    <Input
                      placeholder="e.g., Follow up with client"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Task details..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Related Deal</Label>
                      <Select value={newTask.quote_id} onValueChange={(value) => setNewTask({ ...newTask, quote_id: value })}>
                        <SelectTrigger className="border">
                          <SelectValue placeholder="Select deal (optional)" />
                        </SelectTrigger>
                        <SelectContent className="border">
                          {quotes?.map((quote) => (
                            <SelectItem key={quote.id} value={quote.id}>
                              {quote.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsNewTaskOpen(false)} className="border">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} className="border" disabled={createTask.isPending}>
                    {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Tasks */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Tasks ({pendingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pendingTasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No pending tasks
                  </div>
                ) : (
                  <div className="divide-y-2 divide-border">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="p-4 flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {task.quote && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {task.quote.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Completed ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedTasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No completed tasks
                  </div>
                ) : (
                  <div className="divide-y-2 divide-border">
                    {completedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="p-4 flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                          {task.quote && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <FileText className="h-3 w-3" />
                              {task.quote.title}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tags && tags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="border w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent className="border">
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                className="border"
                onClick={() => contacts && exportContacts.mutate(contacts)}
                disabled={exportContacts.isPending || !contacts?.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
                <DialogTrigger asChild>
                  <Button className="border">
                    <User className="h-4 w-4 mr-2" />
                    New Contact
                  </Button>
                </DialogTrigger>
              <DialogContent className="border sm:max-w-[500px]">
                <DialogHeader className="border-b border-border pb-4">
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Contact name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 234 567 8900"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Job Title</Label>
                      <Input
                        placeholder="e.g., Project Manager"
                        value={newContact.job_title}
                        onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                        className="border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Company</Label>
                      <Select value={newContact.company_id} onValueChange={(value) => setNewContact({ ...newContact, company_id: value })}>
                        <SelectTrigger className="border">
                          <SelectValue placeholder="Select company (optional)" />
                        </SelectTrigger>
                        <SelectContent className="border">
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Add New Company Section */}
                  {isCreatingCompanyInline ? (
                    <div className="grid gap-2 p-3 border border-dashed border-border rounded-md bg-muted/30">
                      <Label className="text-sm font-medium">Create New Company</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter company name"
                          value={inlineCompanyName}
                          onChange={(e) => setInlineCompanyName(e.target.value)}
                          className="border flex-1"
                          autoFocus
                        />
                        <Button
                          onClick={handleCreateInlineCompany}
                          disabled={createClient.isPending || !inlineCompanyName.trim()}
                          className="border"
                        >
                          {createClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                          Create
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setIsCreatingCompanyInline(false); setInlineCompanyName(""); }}
                          className="border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingCompanyInline(true)}
                      className="border w-fit"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New Company
                    </Button>
                  )}
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Textarea
                      placeholder="Mailing/billing address..."
                      value={newContact.address}
                      onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                      className="border"
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      className="border"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => { setIsNewContactOpen(false); setIsCreatingCompanyInline(false); setInlineCompanyName(""); }} className="border">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateContact} className="border" disabled={createContact.isPending}>
                    {createContact.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {filteredContacts.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Contacts Yet</h3>
                <p className="text-muted-foreground mb-4">Add contacts to easily link them to deals, quotes, and projects.</p>
                <Button onClick={() => setIsNewContactOpen(true)} className="border">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile List View */}
              <div className="md:hidden space-y-3">
                {filteredContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigateOrg(`/contacts/${contact.display_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold truncate">{contact.name}</h3>
                              {contact.job_title && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> {contact.job_title}
                                </p>
                              )}
                            </div>
                          </div>
                          {contact.company && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <Building className="h-3 w-3" /> {contact.company.name}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" /> {contact.phone}
                            </p>
                          )}
                          {/* Tags */}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags.slice(0, 3).map((ct) => {
                                const tag = tags?.find((t) => t.id === ct.tag_id);
                                return tag ? (
                                  <Badge
                                    key={ct.tag_id}
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0"
                                    style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ) : null;
                              })}
                              {contact.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{contact.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs font-mono text-muted-foreground mt-2">{contact.display_id}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateOrg(`/contacts/${contact.display_id}`); }}>
                              <ChevronRight className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingContact(contact); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Quick Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteContact.mutate(contact.id); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Contact
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Card className="border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="name" label="Name" />
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="job_title" label="Job Title" className="hidden lg:table-cell" />
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="company" label="Company" />
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="email" label="Email" />
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="phone" label="Phone" className="hidden xl:table-cell" />
                        <TableHead>Tags</TableHead>
                        <SortableTh sort={contactSort} onSort={toggleContactSort} id="created_at" label="Created" className="hidden xl:table-cell" />
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedContacts.map((contact) => (
                        <TableRow
                          key={contact.id}
                          className="cursor-pointer"
                          onClick={() => navigateOrg(`/contacts/${contact.display_id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[160px]" title={contact.name}>{contact.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{contact.display_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground truncate max-w-[120px] block" title={contact.job_title || ""}>
                              {contact.job_title || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[140px] block" title={contact.company?.name || ""}>
                              {contact.company?.name || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[180px] block" title={contact.email || ""}>
                              {contact.email || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {contact.phone || "—"}
                          </TableCell>
                          <TableCell>
                            {contact.tags && contact.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {contact.tags.slice(0, 2).map((ct) => {
                                  const tag = tags?.find((t) => t.id === ct.tag_id);
                                  return tag ? (
                                    <Badge
                                      key={ct.tag_id}
                                      variant="secondary"
                                      className="text-xs px-1.5 py-0"
                                      style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ) : null;
                                })}
                                {contact.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    +{contact.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(contact.created_at)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border">
                                <DropdownMenuItem onClick={() => navigateOrg(`/contacts/${contact.display_id}`)}>
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Quick Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteContact.mutate(contact.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="border sm:max-w-[500px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Contact name"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    value={editingContact.email || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={editingContact.phone || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Job Title</Label>
                  <Input
                    placeholder="e.g., Project Manager"
                    value={editingContact.job_title || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, job_title: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <Select
                    value={editingContact.company_id || ""}
                    onValueChange={(value) => setEditingContact({ ...editingContact, company_id: value })}
                  >
                    <SelectTrigger className="border">
                      <SelectValue placeholder="Select company (optional)" />
                    </SelectTrigger>
                    <SelectContent className="border">
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Add New Company Section */}
              {isCreatingCompanyInlineEdit ? (
                <div className="grid gap-2 p-3 border border-dashed border-border rounded-md bg-muted/30">
                  <Label className="text-sm font-medium">Create New Company</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter company name"
                      value={inlineCompanyNameEdit}
                      onChange={(e) => setInlineCompanyNameEdit(e.target.value)}
                      className="border flex-1"
                      autoFocus
                    />
                    <Button
                      onClick={handleCreateInlineCompanyEdit}
                      disabled={createClient.isPending || !inlineCompanyNameEdit.trim()}
                      className="border"
                    >
                      {createClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setIsCreatingCompanyInlineEdit(false); setInlineCompanyNameEdit(""); }}
                      className="border"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingCompanyInlineEdit(true)}
                  className="border w-fit"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Company
                </Button>
              )}
              <div className="grid gap-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Mailing/billing address..."
                  value={editingContact.address || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                  className="border"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={editingContact.notes || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                  className="border"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { setEditingContact(null); setIsCreatingCompanyInlineEdit(false); setInlineCompanyNameEdit(""); }} className="border">
              Cancel
            </Button>
            <Button onClick={handleUpdateContact} className="border" disabled={updateContact.isPending}>
              {updateContact.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="border sm:max-w-[400px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Activity Type</Label>
              <Select value={newActivity.type} onValueChange={(value: ActivityType) => setNewActivity({ ...newActivity, type: value })}>
                <SelectTrigger className="border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border">
                  {activityTypeOptions?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the activity..."
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="border"
              />
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <Input
                placeholder="e.g., 30 min"
                value={newActivity.duration}
                onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                className="border"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)} className="border">
              Cancel
            </Button>
            <Button onClick={handleLogActivity} className="border" disabled={createActivity.isPending}>
              {createActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Log Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="border sm:max-w-[500px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Company Name *</Label>
                <Input
                  placeholder="Company name"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="Contact name"
                    value={editingClient.contact_name || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, contact_name: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    value={editingClient.contact_email || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, contact_email: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={editingClient.contact_phone || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, contact_phone: e.target.value })}
                    className="border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Industry</Label>
                  <Input
                    placeholder="e.g., Technology"
                    value={editingClient.industry || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, industry: e.target.value })}
                    className="border"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setEditingClient(null)} className="border">
              Cancel
            </Button>
            <Button onClick={handleUpdateClient} className="border" disabled={updateClient.isPending}>
              {updateClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Contacts Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportPreview([]);
        }
      }}>
        <DialogContent className="border sm:max-w-[600px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>Import Contacts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      const parsed = parseCSV(content);
                      setImportPreview(parsed.slice(0, 5));
                    };
                    reader.readAsText(file);
                  }
                }}
                className="border"
              />
              <p className="text-xs text-muted-foreground">
                Upload a CSV file with columns: Name, Email, Phone, Job Title, Company, Address, Notes, Tags
              </p>
            </div>

            {importPreview.length > 0 && (
              <div className="grid gap-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="border border-border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Email</th>
                        <th className="px-3 py-2 text-left font-medium">Phone</th>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importPreview.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 truncate max-w-[150px]">{row.name || "-"}</td>
                          <td className="px-3 py-2 truncate max-w-[150px]">{row.email || "-"}</td>
                          <td className="px-3 py-2 truncate max-w-[100px]">{row.phone || "-"}</td>
                          <td className="px-3 py-2 truncate max-w-[150px]">{row.company || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  {importFile && `Total rows to import: ${importPreview.length > 0 ? "loading..." : 0}`}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
                setImportPreview([]);
              }}
              className="border"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!importFile) {
                  toast.error("Please select a file to import");
                  return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const content = event.target?.result as string;
                  const parsed = parseCSV(content);
                  if (parsed.length === 0) {
                    toast.error("No valid data found in the CSV file");
                    return;
                  }
                  try {
                    await importContacts.mutateAsync(parsed);
                    setIsImportDialogOpen(false);
                    setImportFile(null);
                    setImportPreview([]);
                  } catch (error) {
                    // Error handled by hook
                  }
                };
                reader.readAsText(importFile);
              }}
              className="border"
              disabled={importContacts.isPending || !importFile}
            >
              {importContacts.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Import Contacts
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
