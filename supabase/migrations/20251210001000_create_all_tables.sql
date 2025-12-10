-- ============================================
-- SOLULY BUSINESS SUITE - DATABASE SCHEMA
-- Complete migration for all application tables
-- ============================================

-- =====================
-- ENUMS
-- =====================

-- Project status enum
CREATE TYPE project_status AS ENUM ('active', 'pending', 'completed');

-- Ticket category enum
CREATE TYPE ticket_category AS ENUM ('feature', 'quote', 'feedback');

-- Ticket priority enum
CREATE TYPE ticket_priority AS ENUM ('high', 'medium', 'low');

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM ('open', 'in-progress', 'pending', 'closed');

-- Team member contract type enum
CREATE TYPE contract_type AS ENUM ('Full-time', 'Part-time', 'Contractor');

-- Team member status enum
CREATE TYPE member_status AS ENUM ('active', 'inactive');

-- Quote status enum
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'negotiating', 'accepted', 'rejected');

-- Feedback sentiment enum
CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative');

-- Feedback category enum
CREATE TYPE feedback_category AS ENUM ('performance', 'ui-ux', 'feature', 'mobile', 'bug', 'general');

-- Feedback status enum
CREATE TYPE feedback_status AS ENUM ('acknowledged', 'under-review', 'investigating', 'in-progress', 'resolved');

-- Feedback source enum
CREATE TYPE feedback_source AS ENUM ('email', 'call', 'support');

-- Feature request priority enum
CREATE TYPE feature_priority AS ENUM ('high', 'medium', 'low');

-- Feature request status enum
CREATE TYPE feature_status AS ENUM ('backlog', 'in-review', 'planned', 'in-progress', 'completed');

-- CRM client status enum
CREATE TYPE client_status AS ENUM ('active', 'inactive');

-- CRM lead status enum
CREATE TYPE lead_status AS ENUM ('cold', 'warm', 'hot');

-- CRM activity type enum
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'note');

-- CRM task priority enum
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');

-- =====================
-- PROJECTS TABLE
-- =====================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  client_name TEXT NOT NULL,
  client_email TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- TEAM MEMBERS TABLE
-- =====================
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  contract_type contract_type NOT NULL DEFAULT 'Full-time',
  status member_status NOT NULL DEFAULT 'active',
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- PROJECT TEAM MEMBERS (Junction Table)
-- =====================
CREATE TABLE public.project_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  hours_logged DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

-- =====================
-- TICKETS TABLE
-- =====================
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category ticket_category NOT NULL DEFAULT 'feature',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CRM CLIENTS TABLE
-- =====================
CREATE TABLE public.crm_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  industry TEXT,
  address TEXT,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  status client_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CRM LEADS TABLE
-- =====================
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  industry TEXT,
  source TEXT,
  status lead_status NOT NULL DEFAULT 'cold',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- QUOTES TABLE (Also used as Deals in CRM)
-- =====================
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL,
  client_id UUID REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  status quote_status NOT NULL DEFAULT 'draft',
  stage INTEGER NOT NULL DEFAULT 10 CHECK (stage >= 0 AND stage <= 100),
  valid_until DATE,
  notes TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CRM ACTIVITIES TABLE
-- =====================
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  type activity_type NOT NULL DEFAULT 'call',
  description TEXT NOT NULL,
  duration TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- CRM TASKS TABLE
-- =====================
CREATE TABLE public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority task_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- FEEDBACK TABLE
-- =====================
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  sentiment feedback_sentiment NOT NULL DEFAULT 'neutral',
  category feedback_category NOT NULL DEFAULT 'general',
  status feedback_status NOT NULL DEFAULT 'acknowledged',
  source feedback_source NOT NULL DEFAULT 'email',
  from_contact TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- FEATURE REQUESTS TABLE
-- =====================
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  priority feature_priority NOT NULL DEFAULT 'medium',
  status feature_status NOT NULL DEFAULT 'backlog',
  requested_by TEXT,
  client_name TEXT,
  added_to_roadmap BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================
-- FEATURE REQUEST PROJECTS (Junction Table)
-- =====================
CREATE TABLE public.feature_request_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feature_request_id, project_id)
);

-- =====================
-- ENABLE ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_projects ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES (Allow public access for now)
-- =====================

-- Projects
CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete projects" ON public.projects FOR DELETE USING (true);

-- Team Members
CREATE POLICY "Allow public read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_members" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete team_members" ON public.team_members FOR DELETE USING (true);

-- Project Team Members
CREATE POLICY "Allow public read project_team_members" ON public.project_team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert project_team_members" ON public.project_team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update project_team_members" ON public.project_team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete project_team_members" ON public.project_team_members FOR DELETE USING (true);

-- Tickets
CREATE POLICY "Allow public read tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Allow public insert tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tickets" ON public.tickets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tickets" ON public.tickets FOR DELETE USING (true);

-- CRM Clients
CREATE POLICY "Allow public read crm_clients" ON public.crm_clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert crm_clients" ON public.crm_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crm_clients" ON public.crm_clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crm_clients" ON public.crm_clients FOR DELETE USING (true);

-- CRM Leads
CREATE POLICY "Allow public read crm_leads" ON public.crm_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert crm_leads" ON public.crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crm_leads" ON public.crm_leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crm_leads" ON public.crm_leads FOR DELETE USING (true);

-- Quotes
CREATE POLICY "Allow public read quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Allow public insert quotes" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update quotes" ON public.quotes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete quotes" ON public.quotes FOR DELETE USING (true);

-- CRM Activities
CREATE POLICY "Allow public read crm_activities" ON public.crm_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert crm_activities" ON public.crm_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crm_activities" ON public.crm_activities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crm_activities" ON public.crm_activities FOR DELETE USING (true);

-- CRM Tasks
CREATE POLICY "Allow public read crm_tasks" ON public.crm_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert crm_tasks" ON public.crm_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update crm_tasks" ON public.crm_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete crm_tasks" ON public.crm_tasks FOR DELETE USING (true);

-- Feedback
CREATE POLICY "Allow public read feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update feedback" ON public.feedback FOR UPDATE USING (true);
CREATE POLICY "Allow public delete feedback" ON public.feedback FOR DELETE USING (true);

-- Feature Requests
CREATE POLICY "Allow public read feature_requests" ON public.feature_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert feature_requests" ON public.feature_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update feature_requests" ON public.feature_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete feature_requests" ON public.feature_requests FOR DELETE USING (true);

-- Feature Request Projects
CREATE POLICY "Allow public read feature_request_projects" ON public.feature_request_projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert feature_request_projects" ON public.feature_request_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update feature_request_projects" ON public.feature_request_projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete feature_request_projects" ON public.feature_request_projects FOR DELETE USING (true);

-- =====================
-- UPDATED_AT TRIGGERS
-- =====================

-- Apply the updated_at trigger to all tables that need it
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_clients_updated_at
  BEFORE UPDATE ON public.crm_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- REALTIME SUBSCRIPTIONS
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_requests;

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_client_name ON public.projects(client_name);
CREATE INDEX idx_tickets_project_id ON public.tickets(project_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_team_members_status ON public.team_members(status);
CREATE INDEX idx_team_members_department ON public.team_members(department);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_crm_activities_quote_id ON public.crm_activities(quote_id);
CREATE INDEX idx_crm_tasks_quote_id ON public.crm_tasks(quote_id);
CREATE INDEX idx_crm_tasks_completed ON public.crm_tasks(completed);
CREATE INDEX idx_feedback_project_id ON public.feedback(project_id);
CREATE INDEX idx_feedback_sentiment ON public.feedback(sentiment);
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX idx_feature_requests_priority ON public.feature_requests(priority);
