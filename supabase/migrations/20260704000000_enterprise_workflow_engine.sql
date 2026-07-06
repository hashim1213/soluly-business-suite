-- Enterprise Workflow Engine: ticket hierarchy, dependencies, custom workflows, project templates
-- This brings Jira-level project management to the platform.

-- =============================================================================
-- 1. TICKET TYPE (epic > story > task > subtask > bug)
-- =============================================================================
CREATE TYPE ticket_type AS ENUM ('epic', 'story', 'task', 'subtask', 'bug');

ALTER TABLE tickets ADD COLUMN ticket_type ticket_type NOT NULL DEFAULT 'task';
ALTER TABLE tickets ADD COLUMN parent_ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN labels text[] DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN due_date date;
ALTER TABLE tickets ADD COLUMN estimated_hours numeric(6,2);
ALTER TABLE tickets ADD COLUMN actual_hours numeric(6,2) DEFAULT 0;
ALTER TABLE tickets ADD COLUMN resolution text;

-- Index for parent lookups (subtask queries)
CREATE INDEX idx_tickets_parent ON tickets(parent_ticket_id) WHERE parent_ticket_id IS NOT NULL;
CREATE INDEX idx_tickets_type ON tickets(ticket_type, organization_id);

-- =============================================================================
-- 2. TICKET DEPENDENCIES (blocks / is-blocked-by)
-- =============================================================================
CREATE TABLE ticket_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocking_ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  blocked_ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to', 'duplicates')),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocking_ticket_id, blocked_ticket_id, dependency_type)
);

ALTER TABLE ticket_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view dependencies" ON ticket_dependencies
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));
CREATE POLICY "Org members can manage dependencies" ON ticket_dependencies
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE INDEX idx_ticket_deps_blocking ON ticket_dependencies(blocking_ticket_id);
CREATE INDEX idx_ticket_deps_blocked ON ticket_dependencies(blocked_ticket_id);

-- =============================================================================
-- 3. CUSTOM WORKFLOW STATUSES PER PROJECT
-- =============================================================================
CREATE TABLE workflow_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('todo', 'in_progress', 'done')),
  color text NOT NULL DEFAULT '#0052CC',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE workflow_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view workflow statuses" ON workflow_statuses
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));
CREATE POLICY "Org members can manage workflow statuses" ON workflow_statuses
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE INDEX idx_workflow_statuses_project ON workflow_statuses(project_id, position);

-- Add workflow_status_id to tickets (nullable — legacy tickets use the enum)
ALTER TABLE tickets ADD COLUMN workflow_status_id uuid REFERENCES workflow_statuses(id) ON DELETE SET NULL;

-- =============================================================================
-- 4. PROJECT TEMPLATES
-- =============================================================================
CREATE TABLE project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('consulting', 'supply_chain', 'maintenance', 'software', 'general')),
  default_statuses jsonb NOT NULL DEFAULT '[]',
  default_milestones jsonb NOT NULL DEFAULT '[]',
  default_tasks jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view templates" ON project_templates
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));
CREATE POLICY "Org members can manage templates" ON project_templates
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

-- =============================================================================
-- 5. TICKET ACTIVITY LOG (change history)
-- =============================================================================
CREATE TABLE ticket_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view activity" ON ticket_activity
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));
CREATE POLICY "Org members can create activity" ON ticket_activity
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE INDEX idx_ticket_activity_ticket ON ticket_activity(ticket_id, created_at DESC);

-- =============================================================================
-- 6. SPRINT METRICS (velocity tracking)
-- =============================================================================
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS velocity_points integer;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS completed_points integer DEFAULT 0;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS carried_over_points integer DEFAULT 0;

-- =============================================================================
-- 7. SEED DEFAULT TEMPLATES (system-level, available to all orgs)
-- =============================================================================
-- These will be inserted via the app when an org is first created,
-- but we define the schema here.

-- Add a flag for system templates
ALTER TABLE project_templates ADD COLUMN is_system boolean DEFAULT false;

COMMENT ON TABLE ticket_dependencies IS 'Tracks blocking/relating relationships between tickets';
COMMENT ON TABLE workflow_statuses IS 'Custom workflow columns per project (replaces fixed 4-status enum)';
COMMENT ON TABLE project_templates IS 'Reusable project blueprints with pre-configured statuses and tasks';
COMMENT ON TABLE ticket_activity IS 'Audit trail of all ticket field changes';
