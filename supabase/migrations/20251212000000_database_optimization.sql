-- ============================================
-- DATABASE OPTIMIZATION MIGRATION
-- Adds missing indexes, organization_id columns, and triggers
-- ============================================

-- =============================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- =============================================

-- Contacts - name is frequently searched
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- CRM Clients - name is frequently searched
CREATE INDEX IF NOT EXISTS idx_crm_clients_name ON crm_clients(name);

-- CRM Leads - status is frequently filtered
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);

-- Project Tasks - assignee and completion status are frequently filtered
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_completed ON project_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

-- Project Milestones - completion status and due date are frequently filtered
CREATE INDEX IF NOT EXISTS idx_project_milestones_completed ON project_milestones(completed);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);

-- Project Invoices - status is frequently filtered
CREATE INDEX IF NOT EXISTS idx_project_invoices_status ON project_invoices(status);
CREATE INDEX IF NOT EXISTS idx_project_invoices_due_date ON project_invoices(due_date);

-- Business Costs - vendor is frequently searched
CREATE INDEX IF NOT EXISTS idx_business_costs_vendor ON business_costs(vendor);

-- Project Contracts - status and type are frequently filtered
CREATE INDEX IF NOT EXISTS idx_project_contracts_status ON project_contracts(status);
CREATE INDEX IF NOT EXISTS idx_project_contracts_type ON project_contracts(type);

-- Feature Request Projects - both foreign keys need indexes
CREATE INDEX IF NOT EXISTS idx_feature_request_projects_feature ON feature_request_projects(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_projects_project ON feature_request_projects(project_id);

-- Expense Templates - organization and name lookup
CREATE INDEX IF NOT EXISTS idx_expense_templates_organization ON expense_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_templates_name ON expense_templates(name);
CREATE INDEX IF NOT EXISTS idx_expense_templates_vendor ON expense_templates(vendor);

-- =============================================
-- 2. ADD ORGANIZATION_ID TO TABLES THAT DON'T HAVE IT
-- These tables currently rely on parent relationships for org isolation
-- Adding organization_id improves query performance and explicit isolation
-- =============================================

-- Add organization_id to time_entries (inherited via team_member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_time_entries_organization ON time_entries(organization_id);
  END IF;
END $$;

-- Add organization_id to payments (inherited via team_member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_payments_organization ON payments(organization_id);
  END IF;
END $$;

-- Add organization_id to quote_line_items (inherited via quote)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_line_items' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE quote_line_items ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_quote_line_items_organization ON quote_line_items(organization_id);
  END IF;
END $$;

-- Add organization_id to project_team_members (inherited via project)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_team_members' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE project_team_members ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_project_team_members_organization ON project_team_members(organization_id);
  END IF;
END $$;

-- Add organization_id to feature_request_projects (inherited via feature_request)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feature_request_projects' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE feature_request_projects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_feature_request_projects_organization ON feature_request_projects(organization_id);
  END IF;
END $$;

-- Add organization_id to client_contacts (inherited via client)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_contacts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE client_contacts ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX idx_client_contacts_organization ON client_contacts(organization_id);
  END IF;
END $$;

-- =============================================
-- 3. BACKFILL ORGANIZATION_ID FOR EXISTING DATA
-- Populate organization_id from parent relationships
-- =============================================

-- Backfill time_entries.organization_id from team_members
UPDATE time_entries te
SET organization_id = tm.organization_id
FROM team_members tm
WHERE te.team_member_id = tm.id
AND te.organization_id IS NULL;

-- Backfill payments.organization_id from team_members
UPDATE payments p
SET organization_id = tm.organization_id
FROM team_members tm
WHERE p.team_member_id = tm.id
AND p.organization_id IS NULL;

-- Backfill quote_line_items.organization_id from quotes
UPDATE quote_line_items qli
SET organization_id = q.organization_id
FROM quotes q
WHERE qli.quote_id = q.id
AND qli.organization_id IS NULL;

-- Backfill project_team_members.organization_id from projects
UPDATE project_team_members ptm
SET organization_id = p.organization_id
FROM projects p
WHERE ptm.project_id = p.id
AND ptm.organization_id IS NULL;

-- Backfill feature_request_projects.organization_id from feature_requests
UPDATE feature_request_projects frp
SET organization_id = fr.organization_id
FROM feature_requests fr
WHERE frp.feature_request_id = fr.id
AND frp.organization_id IS NULL;

-- Backfill client_contacts.organization_id from crm_clients
UPDATE client_contacts cc
SET organization_id = c.organization_id
FROM crm_clients c
WHERE cc.client_id = c.id
AND cc.organization_id IS NULL;

-- =============================================
-- 4. ADD MISSING UPDATED_AT TRIGGERS
-- Ensures updated_at is automatically updated on changes
-- =============================================

-- Contacts updated_at trigger
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project Invoices updated_at trigger
DROP TRIGGER IF EXISTS update_project_invoices_updated_at ON project_invoices;
CREATE TRIGGER update_project_invoices_updated_at
  BEFORE UPDATE ON project_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project Tasks updated_at trigger
DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project Milestones updated_at trigger
DROP TRIGGER IF EXISTS update_project_milestones_updated_at ON project_milestones;
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project Costs updated_at trigger
DROP TRIGGER IF EXISTS update_project_costs_updated_at ON project_costs;
CREATE TRIGGER update_project_costs_updated_at
  BEFORE UPDATE ON project_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Project Contracts updated_at trigger
DROP TRIGGER IF EXISTS update_project_contracts_updated_at ON project_contracts;
CREATE TRIGGER update_project_contracts_updated_at
  BEFORE UPDATE ON project_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Business Costs updated_at trigger
DROP TRIGGER IF EXISTS update_business_costs_updated_at ON business_costs;
CREATE TRIGGER update_business_costs_updated_at
  BEFORE UPDATE ON business_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Expense Templates updated_at trigger
DROP TRIGGER IF EXISTS update_expense_templates_updated_at ON expense_templates;
CREATE TRIGGER update_expense_templates_updated_at
  BEFORE UPDATE ON expense_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. ADD COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================

-- Time entries: commonly queried by member + date range
CREATE INDEX IF NOT EXISTS idx_time_entries_member_date ON time_entries(team_member_id, date DESC);

-- Payments: commonly queried by member + status
CREATE INDEX IF NOT EXISTS idx_payments_member_status ON payments(team_member_id, status);

-- Tickets: commonly queried by org + status
CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(organization_id, status);

-- Projects: commonly queried by org + status
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(organization_id, status);

-- Quotes: commonly queried by org + status
CREATE INDEX IF NOT EXISTS idx_quotes_org_status ON quotes(organization_id, status);

-- CRM Tasks: commonly queried by completion + due date
CREATE INDEX IF NOT EXISTS idx_crm_tasks_completed_due ON crm_tasks(completed, due_date);

-- =============================================
-- 6. ADD MISSING FOREIGN KEY INDEXES
-- Improves JOIN performance
-- =============================================

-- CRM Activities - organization_id index
CREATE INDEX IF NOT EXISTS idx_crm_activities_organization ON crm_activities(organization_id);

-- CRM Tasks - organization_id index
CREATE INDEX IF NOT EXISTS idx_crm_tasks_organization ON crm_tasks(organization_id);

-- Feature requests - organization_id index
CREATE INDEX IF NOT EXISTS idx_feature_requests_organization ON feature_requests(organization_id);

-- Feedback - organization_id index
CREATE INDEX IF NOT EXISTS idx_feedback_organization ON feedback(organization_id);

-- =============================================
-- 7. ADD PUBLIC RLS POLICIES FOR TABLES MISSING THEM
-- These tables need public policies to work with the application
-- =============================================

-- Drop existing RLS policies if they exist and recreate as public
-- (The application handles authorization via organization_id filtering in queries)

-- Time entries - ensure public access policies exist
DO $$
BEGIN
  -- Check if the more restrictive policy exists and drop it
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Allow all operations on time_entries') THEN
    DROP POLICY "Allow all operations on time_entries" ON time_entries;
  END IF;

  -- Create individual policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Allow public read time_entries') THEN
    CREATE POLICY "Allow public read time_entries" ON time_entries FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Allow public insert time_entries') THEN
    CREATE POLICY "Allow public insert time_entries" ON time_entries FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Allow public update time_entries') THEN
    CREATE POLICY "Allow public update time_entries" ON time_entries FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'Allow public delete time_entries') THEN
    CREATE POLICY "Allow public delete time_entries" ON time_entries FOR DELETE USING (true);
  END IF;
END $$;

-- Payments - ensure public access policies exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow all operations on payments') THEN
    DROP POLICY "Allow all operations on payments" ON payments;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow public read payments') THEN
    CREATE POLICY "Allow public read payments" ON payments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow public insert payments') THEN
    CREATE POLICY "Allow public insert payments" ON payments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow public update payments') THEN
    CREATE POLICY "Allow public update payments" ON payments FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow public delete payments') THEN
    CREATE POLICY "Allow public delete payments" ON payments FOR DELETE USING (true);
  END IF;
END $$;

-- Quote line items - ensure public access policies exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_line_items' AND policyname = 'Allow all operations on quote_line_items') THEN
    DROP POLICY "Allow all operations on quote_line_items" ON quote_line_items;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_line_items' AND policyname = 'Allow public read quote_line_items') THEN
    CREATE POLICY "Allow public read quote_line_items" ON quote_line_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_line_items' AND policyname = 'Allow public insert quote_line_items') THEN
    CREATE POLICY "Allow public insert quote_line_items" ON quote_line_items FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_line_items' AND policyname = 'Allow public update quote_line_items') THEN
    CREATE POLICY "Allow public update quote_line_items" ON quote_line_items FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_line_items' AND policyname = 'Allow public delete quote_line_items') THEN
    CREATE POLICY "Allow public delete quote_line_items" ON quote_line_items FOR DELETE USING (true);
  END IF;
END $$;

-- =============================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN time_entries.organization_id IS 'Organization this time entry belongs to (denormalized from team_member for query performance)';
COMMENT ON COLUMN payments.organization_id IS 'Organization this payment belongs to (denormalized from team_member for query performance)';
COMMENT ON COLUMN quote_line_items.organization_id IS 'Organization this line item belongs to (denormalized from quote for query performance)';
COMMENT ON COLUMN project_team_members.organization_id IS 'Organization this assignment belongs to (denormalized from project for query performance)';
COMMENT ON COLUMN feature_request_projects.organization_id IS 'Organization this link belongs to (denormalized from feature_request for query performance)';
COMMENT ON COLUMN client_contacts.organization_id IS 'Organization this link belongs to (denormalized from client for query performance)';

-- =============================================
-- 9. CREATE FUNCTION TO AUTO-SET ORGANIZATION_ID ON INSERT
-- For tables with denormalized organization_id
-- =============================================

-- Function to set organization_id for time_entries from team_member
CREATE OR REPLACE FUNCTION set_time_entry_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM team_members
    WHERE id = NEW.team_member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_time_entry_org_trigger ON time_entries;
CREATE TRIGGER set_time_entry_org_trigger
  BEFORE INSERT ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_time_entry_organization_id();

-- Function to set organization_id for payments from team_member
CREATE OR REPLACE FUNCTION set_payment_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM team_members
    WHERE id = NEW.team_member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_org_trigger ON payments;
CREATE TRIGGER set_payment_org_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_organization_id();

-- Function to set organization_id for quote_line_items from quote
CREATE OR REPLACE FUNCTION set_quote_line_item_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM quotes
    WHERE id = NEW.quote_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quote_line_item_org_trigger ON quote_line_items;
CREATE TRIGGER set_quote_line_item_org_trigger
  BEFORE INSERT ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_line_item_organization_id();

-- Function to set organization_id for project_team_members from project
CREATE OR REPLACE FUNCTION set_project_team_member_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_project_team_member_org_trigger ON project_team_members;
CREATE TRIGGER set_project_team_member_org_trigger
  BEFORE INSERT ON project_team_members
  FOR EACH ROW
  EXECUTE FUNCTION set_project_team_member_organization_id();

-- Function to set organization_id for feature_request_projects from feature_request
CREATE OR REPLACE FUNCTION set_feature_request_project_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM feature_requests
    WHERE id = NEW.feature_request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_feature_request_project_org_trigger ON feature_request_projects;
CREATE TRIGGER set_feature_request_project_org_trigger
  BEFORE INSERT ON feature_request_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_feature_request_project_organization_id();

-- Function to set organization_id for client_contacts from client
CREATE OR REPLACE FUNCTION set_client_contact_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM crm_clients
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_contact_org_trigger ON client_contacts;
CREATE TRIGGER set_client_contact_org_trigger
  BEFORE INSERT ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_client_contact_organization_id();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
