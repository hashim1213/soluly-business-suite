-- =============================================
-- Fix display_id unique constraints to be per-organization
-- This allows each organization to have their own PRJ-001, TKT-001, etc.
-- =============================================

-- Drop existing unique constraints on display_id
-- Note: team_members table does not have display_id column
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_display_id_key;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_display_id_key;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_display_id_key;
ALTER TABLE crm_clients DROP CONSTRAINT IF EXISTS crm_clients_display_id_key;
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_display_id_key;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_display_id_key;
ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_display_id_key;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_display_id_key;
ALTER TABLE feature_requests DROP CONSTRAINT IF EXISTS feature_requests_display_id_key;

-- Create new composite unique constraints (organization_id + display_id)
-- This ensures display_id is unique within each organization
ALTER TABLE projects ADD CONSTRAINT projects_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE tickets ADD CONSTRAINT tickets_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE quotes ADD CONSTRAINT quotes_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE crm_clients ADD CONSTRAINT crm_clients_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE crm_activities ADD CONSTRAINT crm_activities_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE crm_tasks ADD CONSTRAINT crm_tasks_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE feedback ADD CONSTRAINT feedback_org_display_id_unique UNIQUE (organization_id, display_id);
ALTER TABLE feature_requests ADD CONSTRAINT feature_requests_org_display_id_unique UNIQUE (organization_id, display_id);

-- Create indexes to improve lookup performance for display_id queries
CREATE INDEX IF NOT EXISTS idx_projects_display_id ON projects(display_id);
CREATE INDEX IF NOT EXISTS idx_tickets_display_id ON tickets(display_id);
CREATE INDEX IF NOT EXISTS idx_quotes_display_id ON quotes(display_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_display_id ON crm_clients(display_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_display_id ON crm_leads(display_id);
CREATE INDEX IF NOT EXISTS idx_feedback_display_id ON feedback(display_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_display_id ON feature_requests(display_id);
