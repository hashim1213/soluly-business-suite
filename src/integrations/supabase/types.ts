export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
      emails: {
        Row: {
          ai_summary: string | null
          body: string
          category: Database["public"]["Enums"]["email_category"] | null
          confidence_score: number | null
          created_at: string
          extracted_data: Json | null
          id: string
          processed_at: string | null
          received_at: string
          sender_email: string
          sender_name: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          body: string
          category?: Database["public"]["Enums"]["email_category"] | null
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          processed_at?: string | null
          received_at?: string
          sender_email: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          body?: string
          category?: Database["public"]["Enums"]["email_category"] | null
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          processed_at?: string | null
          received_at?: string
          sender_email?: string
          sender_name?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
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
      feature_requests: {
        Row: {
          added_to_roadmap: boolean
          client_name: string | null
          created_at: string
          description: string | null
          display_id: string
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["feature_priority"]
          requested_by: string | null
          status: Database["public"]["Enums"]["feature_status"]
          title: string
          updated_at: string
        }
        Insert: {
          added_to_roadmap?: boolean
          client_name?: string | null
          created_at?: string
          description?: string | null
          display_id: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["feature_status"]
          title: string
          updated_at?: string
        }
        Update: {
          added_to_roadmap?: boolean
          client_name?: string | null
          created_at?: string
          description?: string | null
          display_id?: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["feature_status"]
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
          client_email: string | null
          client_name: string
          created_at: string
          description: string | null
          display_id: string
          id: string
          name: string
          progress: number
          start_date: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          value: number
        }
        Insert: {
          client_email?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          display_id: string
          id?: string
          name: string
          progress?: number
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          value?: number
        }
        Update: {
          client_email?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          display_id?: string
          id?: string
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
      team_members: {
        Row: {
          avatar: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          department: string
          email: string
          hourly_rate: number
          id: string
          name: string
          phone: string | null
          role: string
          salary: number
          status: Database["public"]["Enums"]["member_status"]
          total_hours: number
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department: string
          email: string
          hourly_rate?: number
          id?: string
          name: string
          phone?: string | null
          role: string
          salary?: number
          status?: Database["public"]["Enums"]["member_status"]
          total_hours?: number
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          department?: string
          email?: string
          hourly_rate?: number
          id?: string
          name?: string
          phone?: string | null
          role?: string
          salary?: number
          status?: Database["public"]["Enums"]["member_status"]
          total_hours?: number
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "note"
      client_status: "active" | "inactive"
      contract_type: "Full-time" | "Part-time" | "Contractor"
      email_category: "feature_request" | "customer_quote" | "feedback" | "other"
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
      ticket_category: "feature" | "quote" | "feedback"
      ticket_priority: "high" | "medium" | "low"
      ticket_status: "open" | "in-progress" | "pending" | "closed"
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
      email_category: ["feature_request", "customer_quote", "feedback", "other"],
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
      ticket_category: ["feature", "quote", "feedback"],
      ticket_priority: ["high", "medium", "low"],
      ticket_status: ["open", "in-progress", "pending", "closed"],
    },
  },
} as const
