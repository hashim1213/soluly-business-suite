-- =============================================
-- Add monthly maintenance support to projects
-- and quarterly goals table for projections
-- =============================================

-- Add maintenance fields to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS has_maintenance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS maintenance_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS maintenance_start_date DATE,
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;

-- Create quarterly goals table
CREATE TABLE IF NOT EXISTS quarterly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  revenue_target NUMERIC(12,2) DEFAULT 0,
  projects_target INTEGER DEFAULT 0,
  new_clients_target INTEGER DEFAULT 0,
  profit_margin_target NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, year, quarter)
);

-- Enable RLS on quarterly_goals
ALTER TABLE quarterly_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for quarterly_goals
CREATE POLICY "Users can view their organization's quarterly goals"
  ON quarterly_goals FOR SELECT
  USING (organization_id IN (
    SELECT tm.organization_id FROM team_members tm
    WHERE tm.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert quarterly goals for their organization"
  ON quarterly_goals FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT tm.organization_id FROM team_members tm
    WHERE tm.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their organization's quarterly goals"
  ON quarterly_goals FOR UPDATE
  USING (organization_id IN (
    SELECT tm.organization_id FROM team_members tm
    WHERE tm.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their organization's quarterly goals"
  ON quarterly_goals FOR DELETE
  USING (organization_id IN (
    SELECT tm.organization_id FROM team_members tm
    WHERE tm.auth_user_id = auth.uid()
  ));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_quarterly_goals_org_year ON quarterly_goals(organization_id, year, quarter);
CREATE INDEX IF NOT EXISTS idx_projects_maintenance ON projects(has_maintenance) WHERE has_maintenance = TRUE;

-- Trigger to update updated_at on quarterly_goals
CREATE OR REPLACE FUNCTION update_quarterly_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quarterly_goals_updated_at
  BEFORE UPDATE ON quarterly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_quarterly_goals_updated_at();
