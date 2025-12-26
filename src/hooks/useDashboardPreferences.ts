import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Available stat card types
export type StatCardType =
  | "activeProjects"
  | "openTickets"
  | "featureRequests"
  | "pipelineValue"
  | "teamMembers"
  | "tasksDueToday"
  | "emailsPending"
  | "upcomingDeadlines"
  | "contactsThisMonth"
  | "feedbackCount"
  | "closedTicketsWeek"
  | "completedTasksWeek"
  | "totalClients"
  | "activeQuotes";

// Available widget types
export type WidgetType =
  | "recentTickets"
  | "projectsOverview"
  | "recentEmails"
  | "upcomingMilestones"
  | "teamWorkload"
  | "quickActions"
  | "recentActivity"
  | "tasksList";

export interface DashboardLayout {
  statsCards: StatCardType[];
  widgets: WidgetType[];
}

export interface StatCardConfig {
  id: StatCardType;
  title: string;
  description: string;
  category: "projects" | "tickets" | "crm" | "team" | "emails" | "tasks";
}

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  description: string;
  category: "projects" | "tickets" | "crm" | "team" | "emails" | "tasks";
}

// All available stat cards
export const AVAILABLE_STAT_CARDS: StatCardConfig[] = [
  { id: "activeProjects", title: "Active Projects", description: "Number of active projects", category: "projects" },
  { id: "openTickets", title: "Open Tickets", description: "Tickets that need attention", category: "tickets" },
  { id: "featureRequests", title: "Feature Requests", description: "Total feature requests", category: "tickets" },
  { id: "pipelineValue", title: "Pipeline Value", description: "Value from active quotes", category: "crm" },
  { id: "teamMembers", title: "Team Members", description: "Active team members", category: "team" },
  { id: "tasksDueToday", title: "Tasks Due Today", description: "Tasks due today", category: "tasks" },
  { id: "emailsPending", title: "Pending Emails", description: "Emails awaiting review", category: "emails" },
  { id: "upcomingDeadlines", title: "Upcoming Deadlines", description: "Deadlines in the next 7 days", category: "projects" },
  { id: "contactsThisMonth", title: "New Contacts", description: "Contacts added this month", category: "crm" },
  { id: "feedbackCount", title: "Feedback Items", description: "Total feedback received", category: "tickets" },
  { id: "closedTicketsWeek", title: "Tickets Closed", description: "Tickets closed this week", category: "tickets" },
  { id: "completedTasksWeek", title: "Tasks Completed", description: "Tasks completed this week", category: "tasks" },
  { id: "totalClients", title: "Total Clients", description: "All clients in CRM", category: "crm" },
  { id: "activeQuotes", title: "Active Quotes", description: "Quotes in progress", category: "crm" },
];

// All available widgets
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: "recentTickets", title: "Recent Tickets", description: "Latest tickets and updates", category: "tickets" },
  { id: "projectsOverview", title: "Projects Overview", description: "Active projects summary", category: "projects" },
  { id: "recentEmails", title: "Recent Emails", description: "Latest synced emails", category: "emails" },
  { id: "upcomingMilestones", title: "Upcoming Milestones", description: "Project milestones due soon", category: "projects" },
  { id: "teamWorkload", title: "Team Workload", description: "Team member assignments", category: "team" },
  { id: "quickActions", title: "Quick Actions", description: "Common actions shortcuts", category: "projects" },
  { id: "recentActivity", title: "Recent Activity", description: "Latest activity across the system", category: "projects" },
  { id: "tasksList", title: "My Tasks", description: "Your assigned tasks", category: "tasks" },
];

const DEFAULT_LAYOUT: DashboardLayout = {
  statsCards: ["activeProjects", "openTickets", "featureRequests", "pipelineValue"],
  widgets: ["recentTickets", "projectsOverview"],
};

const STORAGE_KEY = "dashboard_preferences";
const LAYOUT_CHANGE_EVENT = "dashboard_layout_change";

export function useDashboardPreferences() {
  const { member } = useAuth();
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);

  // Generate user-specific storage key
  const storageKey = member?.id ? `${STORAGE_KEY}_${member.id}` : STORAGE_KEY;

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLayout(parsed);
      }
    } catch (e) {
      console.error("Error loading dashboard preferences:", e);
    }
    setIsLoading(false);
  }, [storageKey]);

  // Listen for layout changes from other components
  useEffect(() => {
    const handleLayoutChange = (event: CustomEvent<DashboardLayout>) => {
      setLayout(event.detail);
    };

    window.addEventListener(LAYOUT_CHANGE_EVENT, handleLayoutChange as EventListener);
    return () => {
      window.removeEventListener(LAYOUT_CHANGE_EVENT, handleLayoutChange as EventListener);
    };
  }, []);

  // Save preferences to localStorage and broadcast change
  const saveLayout = useCallback((newLayout: DashboardLayout) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      setLayout(newLayout);
      // Broadcast the change to other components
      window.dispatchEvent(new CustomEvent(LAYOUT_CHANGE_EVENT, { detail: newLayout }));
    } catch (e) {
      console.error("Error saving dashboard preferences:", e);
    }
  }, [storageKey]);

  // Add a stat card
  const addStatCard = useCallback((cardId: StatCardType) => {
    if (!layout.statsCards.includes(cardId)) {
      saveLayout({
        ...layout,
        statsCards: [...layout.statsCards, cardId],
      });
    }
  }, [layout, saveLayout]);

  // Remove a stat card
  const removeStatCard = useCallback((cardId: StatCardType) => {
    saveLayout({
      ...layout,
      statsCards: layout.statsCards.filter(id => id !== cardId),
    });
  }, [layout, saveLayout]);

  // Reorder stat cards
  const reorderStatCards = useCallback((cards: StatCardType[]) => {
    saveLayout({
      ...layout,
      statsCards: cards,
    });
  }, [layout, saveLayout]);

  // Add a widget
  const addWidget = useCallback((widgetId: WidgetType) => {
    if (!layout.widgets.includes(widgetId)) {
      saveLayout({
        ...layout,
        widgets: [...layout.widgets, widgetId],
      });
    }
  }, [layout, saveLayout]);

  // Remove a widget
  const removeWidget = useCallback((widgetId: WidgetType) => {
    saveLayout({
      ...layout,
      widgets: layout.widgets.filter(id => id !== widgetId),
    });
  }, [layout, saveLayout]);

  // Reorder widgets
  const reorderWidgets = useCallback((widgets: WidgetType[]) => {
    saveLayout({
      ...layout,
      widgets,
    });
  }, [layout, saveLayout]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveLayout(DEFAULT_LAYOUT);
  }, [saveLayout]);

  return {
    layout,
    isLoading,
    saveLayout,
    addStatCard,
    removeStatCard,
    reorderStatCards,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefaults,
    availableStatCards: AVAILABLE_STAT_CARDS,
    availableWidgets: AVAILABLE_WIDGETS,
  };
}
