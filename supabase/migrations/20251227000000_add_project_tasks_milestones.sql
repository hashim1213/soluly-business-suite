-- Add project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_org ON project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_org ON project_milestones(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_tasks
CREATE POLICY "Users can view project tasks in their organization"
  ON project_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create project tasks in their organization"
  ON project_tasks FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update project tasks in their organization"
  ON project_tasks FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project tasks in their organization"
  ON project_tasks FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

-- RLS policies for project_milestones
CREATE POLICY "Users can view project milestones in their organization"
  ON project_milestones FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create project milestones in their organization"
  ON project_milestones FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update project milestones in their organization"
  ON project_milestones FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project milestones in their organization"
  ON project_milestones FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));
