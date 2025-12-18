export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Permission types for role-based access control
export type Permission = boolean | "own";
export type ResourcePermissions = {
  view: Permission;
  create: Permission;
  edit: Permission;
  delete: Permission;
};
export type SettingsPermissions = {
  view: Permission;
  manage_org: Permission;
  manage_users: Permission;
  manage_roles: Permission;
};
export type SensitiveDataPermissions = {
  view_amounts: Permission; // View financial amounts (budgets, contract values, salaries, etc.)
};
export type Permissions = {
  dashboard: { view: Permission };
  projects: ResourcePermissions;
  tickets: ResourcePermissions;
  team: ResourcePermissions;
  crm: ResourcePermissions;
  quotes: ResourcePermissions;
  features: ResourcePermissions;
  feedback: ResourcePermissions;
  issues: ResourcePermissions;
  forms: ResourcePermissions;
  emails: ResourcePermissions;
  financials: ResourcePermissions;
  expenses: ResourcePermissions;
  settings: SettingsPermissions;
  sensitive_data: SensitiveDataPermissions;
};

// Human-readable labels for permissions
export const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tickets: "Tickets",
  team: "Team Members",
  crm: "CRM (Clients & Leads)",
  quotes: "Customer Quotes",
  features: "Feature Requests",
  feedback: "Feedback",
  issues: "Issues",
  forms: "Forms",
  emails: "Emails",
  financials: "Financials",
  expenses: "Expenses",
  settings: "Settings",
  sensitive_data: "Sensitive Data",
};

// Permission action labels
export const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage_org: "Manage Organization",
  manage_users: "Manage Users",
  manage_roles: "Manage Roles",
  view_amounts: "View Financial Amounts",
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          is_system: boolean
          permissions: Permissions
          project_scope: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          is_system?: boolean
          permissions: Permissions
          project_scope?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          is_system?: boolean
          permissions?: Permissions
          project_scope?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role_id: string
          invited_by: string | null
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role_id: string
          invited_by?: string | null
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role_id?: string
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      crm_activities: {
        Row: {
          activity_date: string
          created_at: string
          description: string
          display_id: string
          duration: string | null
          id: string
          quote_id: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          activity_date?: string
          created_at?: string
          description: string
          display_id: string
          duration?: string | null
          id?: string
          quote_id: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          activity_date?: string
          created_at?: string
          description?: string
          display_id?: string
          duration?: string | null
          id?: string
          quote_id?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      crm_clients: {
        Row: {
          address: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          display_id: string
          id: string
          industry: string | null
          name: string
          status: Database["public"]["Enums"]["client_status"]
          total_revenue: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          display_id: string
          id?: string
          industry?: string | null
          name: string
          status?: Database["public"]["Enums"]["client_status"]
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          display_id?: string
          id?: string
          industry?: string | null
          name?: string
          status?: Database["public"]["Enums"]["client_status"]
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          display_id: string
          id: string
          industry: string | null
          name: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          display_id: string
          id?: string
          industry?: string | null
          name: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          display_id?: string
          id?: string
          industry?: string | null
          name?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          completed: boolean
          created_at: string
          display_id: string
          due_date: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          quote_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          display_id: string
          due_date: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          quote_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          display_id?: string
          due_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          quote_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      email_accounts: {
        Row: {
          id: string
          organization_id: string
          display_name: string
          email_address: string
          imap_host: string
          imap_port: number
          imap_username: string
          imap_password: string
          imap_use_ssl: boolean
          status: "active" | "inactive" | "error" | "syncing"
          auto_categorize: boolean
          auto_create_records: boolean
          sync_folder: string
          last_sync_at: string | null
          last_sync_uid: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          display_name: string
          email_address: string
          imap_host: string
          imap_port?: number
          imap_username: string
          imap_password: string
          imap_use_ssl?: boolean
          status?: "active" | "inactive" | "error" | "syncing"
          auto_categorize?: boolean
          auto_create_records?: boolean
          sync_folder?: string
          last_sync_at?: string | null
          last_sync_uid?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          display_name?: string
          email_address?: string
          imap_host?: string
          imap_port?: number
          imap_username?: string
          imap_password?: string
          imap_use_ssl?: boolean
          status?: "active" | "inactive" | "error" | "syncing"
          auto_categorize?: boolean
          auto_create_records?: boolean
          sync_folder?: string
          last_sync_at?: string | null
          last_sync_uid?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      emails: {
        Row: {
          id: string
          organization_id: string
          email_account_id: string | null
          display_id: string | null
          message_id: string | null
          imap_uid: string | null
          sender_email: string
          sender_name: string | null
          subject: string
          body: string
          received_at: string
          status: Database["public"]["Enums"]["email_status"]
          category: Database["public"]["Enums"]["email_category"] | null
          confidence_score: number | null
          ai_summary: string | null
          ai_suggested_title: string | null
          ai_confidence: number | null
          extracted_data: Json | null
          processed_at: string | null
          linked_ticket_id: string | null
          linked_feature_request_id: string | null
          linked_quote_id: string | null
          linked_feedback_id: string | null
          linked_project_id: string | null
          review_status: "pending" | "approved" | "dismissed"
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email_account_id?: string | null
          display_id?: string | null
          message_id?: string | null
          imap_uid?: string | null
          sender_email: string
          sender_name?: string | null
          subject: string
          body: string
          received_at?: string
          status?: Database["public"]["Enums"]["email_status"]
          category?: Database["public"]["Enums"]["email_category"] | null
          confidence_score?: number | null
          ai_summary?: string | null
          ai_suggested_title?: string | null
          ai_confidence?: number | null
          extracted_data?: Json | null
          processed_at?: string | null
          linked_ticket_id?: string | null
          linked_feature_request_id?: string | null
          linked_quote_id?: string | null
          linked_feedback_id?: string | null
          linked_project_id?: string | null
          review_status?: "pending" | "approved" | "dismissed"
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email_account_id?: string | null
          display_id?: string | null
          message_id?: string | null
          imap_uid?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string
          body?: string
          received_at?: string
          status?: Database["public"]["Enums"]["email_status"]
          category?: Database["public"]["Enums"]["email_category"] | null
          confidence_score?: number | null
          ai_summary?: string | null
          ai_suggested_title?: string | null
          ai_confidence?: number | null
          extracted_data?: Json | null
          processed_at?: string | null
          linked_ticket_id?: string | null
          linked_feature_request_id?: string | null
          linked_quote_id?: string | null
          linked_feedback_id?: string | null
          linked_project_id?: string | null
          review_status?: "pending" | "approved" | "dismissed"
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_request_projects: {
        Row: {
          created_at: string
          feature_request_id: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          feature_request_id: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          feature_request_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_projects_feature_request_id_fkey"
            columns: ["feature_request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_request_assignees: {
        Row: {
          id: string
          feature_request_id: string
          team_member_id: string
          created_at: string
        }
        Insert: {
          id?: string
          feature_request_id: string
          team_member_id: string
          created_at?: string
        }
        Update: {
          id?: string
          feature_request_id?: string
          team_member_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_assignees_feature_request_id_fkey"
            columns: ["feature_request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_request_assignees_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_requests: {
        Row: {
          added_to_roadmap: boolean
          client_name: string | null
          cost_override: boolean
          created_at: string
          description: string | null
          display_id: string
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["feature_priority"]
          requested_by: string | null
          status: Database["public"]["Enums"]["feature_status"]
          tentative_end_date: string | null
          tentative_start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          added_to_roadmap?: boolean
          client_name?: string | null
          cost_override?: boolean
          created_at?: string
          description?: string | null
          display_id: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["feature_status"]
          tentative_end_date?: string | null
          tentative_start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          added_to_roadmap?: boolean
          client_name?: string | null
          cost_override?: boolean
          created_at?: string
          description?: string | null
          display_id?: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["feature_status"]
          tentative_end_date?: string | null
          tentative_start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          description: string | null
          display_id: string
          from_contact: string | null
          id: string
          notes: string | null
          project_id: string | null
          project_name: string | null
          sentiment: Database["public"]["Enums"]["feedback_sentiment"]
          source: Database["public"]["Enums"]["feedback_source"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description?: string | null
          display_id: string
          from_contact?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          sentiment?: Database["public"]["Enums"]["feedback_sentiment"]
          source?: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description?: string | null
          display_id?: string
          from_contact?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          sentiment?: Database["public"]["Enums"]["feedback_sentiment"]
          source?: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_team_members: {
        Row: {
          created_at: string
          hours_logged: number
          id: string
          project_id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          hours_logged?: number
          id?: string
          project_id: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          hours_logged?: number
          id?: string
          project_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          budget: number
          client_email: string | null
          client_name: string
          created_at: string
          description: string | null
          display_id: string
          end_date: string | null
          has_maintenance: boolean
          id: string
          maintenance_amount: number
          maintenance_frequency: string
          maintenance_notes: string | null
          maintenance_start_date: string | null
          name: string
          progress: number
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          value: number
        }
        Insert: {
          budget?: number
          client_email?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          display_id: string
          end_date?: string | null
          has_maintenance?: boolean
          id?: string
          maintenance_amount?: number
          maintenance_frequency?: string
          maintenance_notes?: string | null
          maintenance_start_date?: string | null
          name: string
          progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          value?: number
        }
        Update: {
          budget?: number
          client_email?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          display_id?: string
          end_date?: string | null
          has_maintenance?: boolean
          id?: string
          maintenance_amount?: number
          maintenance_frequency?: string
          maintenance_notes?: string | null
          maintenance_start_date?: string | null
          name?: string
          progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_id: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          display_id: string
          id: string
          last_activity: string | null
          notes: string | null
          stage: number
          status: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at: string
          valid_until: string | null
          value: number
        }
        Insert: {
          client_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          display_id: string
          id?: string
          last_activity?: string | null
          notes?: string | null
          stage?: number
          status?: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at?: string
          valid_until?: string | null
          value?: number
        }
        Update: {
          client_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          display_id?: string
          id?: string
          last_activity?: string | null
          notes?: string | null
          stage?: number
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string
          updated_at?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_line_items: {
        Row: {
          id: string
          quote_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          auth_user_id: string | null
          allowed_project_ids: string[] | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          department: string
          email: string
          hourly_rate: number
          id: string
          is_owner: boolean
          name: string
          organization_id: string | null
          phone: string | null
          role: string
          role_id: string | null
          salary: number
          status: Database["public"]["Enums"]["member_status"]
          total_hours: number
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          auth_user_id?: string | null
          allowed_project_ids?: string[] | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department: string
          email: string
          hourly_rate?: number
          id?: string
          is_owner?: boolean
          name: string
          organization_id?: string | null
          phone?: string | null
          role: string
          role_id?: string | null
          salary?: number
          status?: Database["public"]["Enums"]["member_status"]
          total_hours?: number
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          auth_user_id?: string | null
          allowed_project_ids?: string[] | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string
          email?: string
          hourly_rate?: number
          id?: string
          is_owner?: boolean
          name?: string
          organization_id?: string | null
          phone?: string | null
          role?: string
          role_id?: string | null
          salary?: number
          status?: Database["public"]["Enums"]["member_status"]
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      time_entries: {
        Row: {
          id: string
          team_member_id: string
          project_id: string | null
          date: string
          hours: number
          description: string | null
          billable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_member_id: string
          project_id?: string | null
          date?: string
          hours: number
          description?: string | null
          billable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_member_id?: string
          project_id?: string | null
          date?: string
          hours?: number
          description?: string | null
          billable?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          team_member_id: string
          amount: number
          payment_date: string
          period_start: string | null
          period_end: string | null
          status: Database["public"]["Enums"]["payment_status"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_member_id: string
          amount: number
          payment_date?: string
          period_start?: string | null
          period_end?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_member_id?: string
          amount?: number
          payment_date?: string
          period_start?: string | null
          period_end?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          description: string | null
          display_id: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description?: string | null
          display_id: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description?: string | null
          display_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_tasks: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          title: string
          completed: boolean
          priority: "high" | "medium" | "low"
          assignee_id: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          title: string
          completed?: boolean
          priority?: "high" | "medium" | "low"
          assignee_id?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          title?: string
          completed?: boolean
          priority?: "high" | "medium" | "low"
          assignee_id?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      project_milestones: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          title: string
          description: string | null
          due_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          title: string
          description?: string | null
          due_date: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          title?: string
          description?: string | null
          due_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_costs: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          description: string
          category: string
          amount: number
          date: string
          recurring: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          description: string
          category: string
          amount: number
          date: string
          recurring?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          description?: string
          category?: string
          amount?: number
          date?: string
          recurring?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_invoices: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          invoice_number: string
          description: string
          amount: number
          status: "draft" | "sent" | "paid" | "overdue"
          due_date: string
          paid_date: string | null
          notes: string | null
          file_url: string | null
          file_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          invoice_number: string
          description: string
          amount: number
          status?: "draft" | "sent" | "paid" | "overdue"
          due_date: string
          paid_date?: string | null
          notes?: string | null
          file_url?: string | null
          file_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          invoice_number?: string
          description?: string
          amount?: number
          status?: "draft" | "sent" | "paid" | "overdue"
          due_date?: string
          paid_date?: string | null
          notes?: string | null
          file_url?: string | null
          file_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_contracts: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          name: string
          type: string
          file_url: string | null
          file_name: string | null
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          name: string
          type: string
          file_url?: string | null
          file_name?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          name?: string
          type?: string
          file_url?: string | null
          file_name?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_external_members: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          name: string
          email: string
          role: string | null
          company: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          name: string
          email: string
          role?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          name?: string
          email?: string
          role?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_external_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_external_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          display_id: string
          name: string
          email: string | null
          phone: string | null
          job_title: string | null
          company_id: string | null
          address: string | null
          notes: string | null
          social_profiles: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          display_id: string
          name: string
          email?: string | null
          phone?: string | null
          job_title?: string | null
          company_id?: string | null
          address?: string | null
          notes?: string | null
          social_profiles?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          display_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          job_title?: string | null
          company_id?: string | null
          address?: string | null
          notes?: string | null
          social_profiles?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_tags: {
        Row: {
          id: string
          contact_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_custom_fields: {
        Row: {
          id: string
          organization_id: string
          name: string
          field_type: Database["public"]["Enums"]["custom_field_type"]
          options: Json | null
          required: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          options?: Json | null
          required?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          options?: Json | null
          required?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_custom_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_custom_field_values: {
        Row: {
          id: string
          contact_id: string
          field_id: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          field_id: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          field_id?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_custom_field_values_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "contact_custom_fields"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_activities: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          display_id: string
          activity_type: Database["public"]["Enums"]["contact_activity_type"]
          title: string | null
          description: string | null
          activity_date: string
          created_by: string | null
          call_duration: number | null
          call_outcome: Database["public"]["Enums"]["call_outcome_type"] | null
          email_subject: string | null
          email_direction: Database["public"]["Enums"]["email_direction_type"] | null
          meeting_location: string | null
          meeting_attendees: Json | null
          meeting_outcome: string | null
          meeting_start_time: string | null
          meeting_end_time: string | null
          task_due_date: string | null
          task_status: Database["public"]["Enums"]["activity_task_status"] | null
          task_priority: Database["public"]["Enums"]["activity_task_priority"] | null
          task_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          display_id?: string
          activity_type: Database["public"]["Enums"]["contact_activity_type"]
          title?: string | null
          description?: string | null
          activity_date?: string
          created_by?: string | null
          call_duration?: number | null
          call_outcome?: Database["public"]["Enums"]["call_outcome_type"] | null
          email_subject?: string | null
          email_direction?: Database["public"]["Enums"]["email_direction_type"] | null
          meeting_location?: string | null
          meeting_attendees?: Json | null
          meeting_outcome?: string | null
          meeting_start_time?: string | null
          meeting_end_time?: string | null
          task_due_date?: string | null
          task_status?: Database["public"]["Enums"]["activity_task_status"] | null
          task_priority?: Database["public"]["Enums"]["activity_task_priority"] | null
          task_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          display_id?: string
          activity_type?: Database["public"]["Enums"]["contact_activity_type"]
          title?: string | null
          description?: string | null
          activity_date?: string
          created_by?: string | null
          call_duration?: number | null
          call_outcome?: Database["public"]["Enums"]["call_outcome_type"] | null
          email_subject?: string | null
          email_direction?: Database["public"]["Enums"]["email_direction_type"] | null
          meeting_location?: string | null
          meeting_attendees?: Json | null
          meeting_outcome?: string | null
          meeting_start_time?: string | null
          meeting_end_time?: string | null
          task_due_date?: string | null
          task_status?: Database["public"]["Enums"]["activity_task_status"] | null
          task_priority?: Database["public"]["Enums"]["activity_task_priority"] | null
          task_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          }
        ]
      }
      quarterly_goals: {
        Row: {
          id: string
          organization_id: string
          year: number
          quarter: number
          revenue_target: number
          projects_target: number
          new_clients_target: number
          profit_margin_target: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          year: number
          quarter: number
          revenue_target?: number
          projects_target?: number
          new_clients_target?: number
          profit_margin_target?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          year?: number
          quarter?: number
          revenue_target?: number
          projects_target?: number
          new_clients_target?: number
          profit_margin_target?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user_signup: {
        Args: {
          p_user_id: string
          p_email: string
          p_name: string
          p_org_name: string
          p_org_slug: string
        }
        Returns: Json
      }
      handle_invitation_acceptance: {
        Args: {
          p_user_id: string
          p_token: string
          p_name: string
        }
        Returns: Json
      }
      create_default_roles_for_org: {
        Args: {
          org_id: string
        }
        Returns: undefined
      }
      auth_get_user_org_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      auth_is_org_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
      auth_has_settings_permission: {
        Args: {
          perm: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_event_details?: Json
          p_risk_level?: string
        }
        Returns: string
      }
      is_account_locked: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      record_login_attempt: {
        Args: {
          p_email: string
          p_success: boolean
          p_failure_reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "note"
      client_status: "active" | "inactive"
      contract_type: "Full-time" | "Part-time" | "Contractor"
      email_category: "ticket" | "feature_request" | "customer_quote" | "feedback" | "other"
      email_status: "pending" | "processed" | "failed"
      feature_priority: "high" | "medium" | "low"
      feature_status: "backlog" | "in-review" | "planned" | "in-progress" | "completed"
      feedback_category: "performance" | "ui-ux" | "feature" | "mobile" | "bug" | "general"
      feedback_sentiment: "positive" | "neutral" | "negative"
      feedback_source: "email" | "call" | "support"
      feedback_status: "acknowledged" | "under-review" | "investigating" | "in-progress" | "resolved"
      lead_status: "cold" | "warm" | "hot"
      member_status: "active" | "inactive"
      project_status: "active" | "pending" | "completed"
      quote_status: "draft" | "sent" | "negotiating" | "accepted" | "rejected"
      task_priority: "high" | "medium" | "low"
      ticket_category: "feature" | "quote" | "feedback" | "issue"
      ticket_priority: "high" | "medium" | "low"
      ticket_status: "open" | "in-progress" | "pending" | "closed"
      payment_status: "pending" | "paid" | "cancelled"
      payment_method: "direct_deposit" | "check" | "wire_transfer" | "e_transfer" | "cash" | "other"
      custom_field_type: "text" | "number" | "date" | "select" | "multiselect" | "boolean" | "url" | "email" | "phone"
      contact_activity_type: "call" | "email" | "meeting" | "note" | "task"
      call_outcome_type: "answered" | "no_answer" | "voicemail" | "busy" | "callback_scheduled"
      email_direction_type: "sent" | "received"
      activity_task_status: "pending" | "in_progress" | "completed" | "cancelled"
      activity_task_priority: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["call", "email", "meeting", "note"],
      client_status: ["active", "inactive"],
      contract_type: ["Full-time", "Part-time", "Contractor"],
      email_category: ["ticket", "feature_request", "customer_quote", "feedback", "other"],
      email_status: ["pending", "processed", "failed"],
      feature_priority: ["high", "medium", "low"],
      feature_status: ["backlog", "in-review", "planned", "in-progress", "completed"],
      feedback_category: ["performance", "ui-ux", "feature", "mobile", "bug", "general"],
      feedback_sentiment: ["positive", "neutral", "negative"],
      feedback_source: ["email", "call", "support"],
      feedback_status: ["acknowledged", "under-review", "investigating", "in-progress", "resolved"],
      lead_status: ["cold", "warm", "hot"],
      member_status: ["active", "inactive"],
      project_status: ["active", "pending", "completed"],
      quote_status: ["draft", "sent", "negotiating", "accepted", "rejected"],
      task_priority: ["high", "medium", "low"],
      ticket_category: ["feature", "quote", "feedback", "issue"],
      ticket_priority: ["high", "medium", "low"],
      ticket_status: ["open", "in-progress", "pending", "closed"],
    },
  },
} as const
