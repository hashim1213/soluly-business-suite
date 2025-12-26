-- Dashboard preferences for customizable dashboards
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  layout JSONB NOT NULL DEFAULT '{"statsCards": ["activeProjects", "openTickets", "featureRequests", "pipelineValue"], "widgets": ["recentTickets", "projectsOverview"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_member_id)
);

-- RLS policies
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own preferences
CREATE POLICY "Users can view own dashboard preferences"
  ON dashboard_preferences FOR SELECT
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own dashboard preferences"
  ON dashboard_preferences FOR INSERT
  WITH CHECK (
    team_member_id IN (
      SELECT id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own dashboard preferences"
  ON dashboard_preferences FOR UPDATE
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_team_member ON dashboard_preferences(team_member_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dashboard_preferences_updated_at
  BEFORE UPDATE ON dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_preferences_updated_at();
