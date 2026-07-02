-- Agile management: sprints for tickets, story points, board ordering,
-- and task start dates for the project Gantt timeline.

CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprints_org ON sprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(organization_id, status);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sprints in their organization"
  ON sprints FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create sprints in their organization"
  ON sprints FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update sprints in their organization"
  ON sprints FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sprints in their organization"
  ON sprints FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

-- Sprint membership, estimation, and board ordering for tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS story_points NUMERIC;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS board_rank DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tickets_sprint ON tickets(sprint_id);

-- Tasks need a start date to render as Gantt bars (due_date alone only
-- supports point markers)
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS start_date DATE;
