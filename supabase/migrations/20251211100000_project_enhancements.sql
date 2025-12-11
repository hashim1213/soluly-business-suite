-- Project Management Enhancements Migration
-- Creates tables for contacts, invoices, tasks, milestones, and costs

-- ============================================
-- 1. Create contacts table
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES crm_clients(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, display_id)
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Users can view contacts in their organization" ON contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts in their organization" ON contacts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in their organization" ON contacts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts in their organization" ON contacts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- 2. Create project_invoices table
-- ============================================
CREATE TABLE IF NOT EXISTS project_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, display_id)
);

-- Enable RLS
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_invoices
CREATE POLICY "Users can view invoices in their organization" ON project_invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices in their organization" ON project_invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their organization" ON project_invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices in their organization" ON project_invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Create project_tasks table
-- ============================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_tasks
CREATE POLICY "Users can view tasks in their organization" ON project_tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their organization" ON project_tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their organization" ON project_tasks
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their organization" ON project_tasks
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Create project_milestones table
-- ============================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_milestones
CREATE POLICY "Users can view milestones in their organization" ON project_milestones
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create milestones in their organization" ON project_milestones
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones in their organization" ON project_milestones
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones in their organization" ON project_milestones
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Create project_costs table
-- ============================================
CREATE TABLE IF NOT EXISTS project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_costs
CREATE POLICY "Users can view costs in their organization" ON project_costs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create costs in their organization" ON project_costs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update costs in their organization" ON project_costs
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete costs in their organization" ON project_costs
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- 6. Add organization_id to existing tables
-- ============================================
DO $$
BEGIN
  -- Add organization_id to crm_clients if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE crm_clients ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;

  -- Add organization_id to crm_leads if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- ============================================
-- 7. Add contact_id to relevant tables
-- ============================================
DO $$
BEGIN
  -- Add contact_id to quotes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;

  -- Add contact_id to projects if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;

  -- Add primary_contact_id to crm_clients if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_clients' AND column_name = 'primary_contact_id'
  ) THEN
    ALTER TABLE crm_clients ADD COLUMN primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 8. Add AI summary columns to feature_requests
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_requests' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE feature_requests ADD COLUMN ai_summary TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_requests' AND column_name = 'summarized_at'
  ) THEN
    ALTER TABLE feature_requests ADD COLUMN summarized_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 9. Create indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_organization ON project_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_organization ON project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_organization ON project_milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_organization ON project_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);
