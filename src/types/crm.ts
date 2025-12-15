// CRM-specific types for enhanced contact management

export interface SocialProfiles {
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website_url?: string;
}

export interface Tag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactTag {
  id: string;
  contact_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag;
}

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'url'
  | 'email'
  | 'phone';

export interface CustomField {
  id: string;
  organization_id: string;
  name: string;
  field_type: CustomFieldType;
  options?: string[] | null;
  required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  contact_id: string;
  field_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
  field?: CustomField;
}

export type ContactActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export type CallOutcome = 'answered' | 'no_answer' | 'voicemail' | 'busy' | 'callback_scheduled';

export type EmailDirection = 'sent' | 'received';

export type ActivityTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ActivityTaskPriority = 'low' | 'medium' | 'high';

export interface MeetingAttendee {
  name: string;
  email?: string;
  role?: string;
}

export interface ContactActivity {
  id: string;
  organization_id: string;
  contact_id: string;
  display_id: string;
  activity_type: ContactActivityType;
  title?: string | null;
  description?: string | null;
  activity_date: string;
  created_by?: string | null;

  // Call fields
  call_duration?: number | null;
  call_outcome?: CallOutcome | null;

  // Email fields
  email_subject?: string | null;
  email_direction?: EmailDirection | null;

  // Meeting fields
  meeting_location?: string | null;
  meeting_attendees?: MeetingAttendee[] | null;
  meeting_outcome?: string | null;
  meeting_start_time?: string | null;
  meeting_end_time?: string | null;

  // Task fields
  task_due_date?: string | null;
  task_status?: ActivityTaskStatus | null;
  task_priority?: ActivityTaskPriority | null;
  task_completed_at?: string | null;

  created_at: string;
  updated_at: string;

  // Joined data
  creator?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

export interface EnhancedContact {
  id: string;
  organization_id: string;
  display_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  address: string | null;
  notes: string | null;
  social_profiles: SocialProfiles | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: {
    id: string;
    name: string;
  } | null;
  tags?: ContactTag[];
  custom_field_values?: CustomFieldValue[];
  activities?: ContactActivity[];
  activity_count?: number;
}

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  tagIds?: string[];
  status?: string;
  clientId?: string;
  teamMemberId?: string;
  activityType?: ContactActivityType;
}

export interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ContactImportRow {
  name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  company?: string;
  address?: string;
  notes?: string;
  tags?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website_url?: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}
