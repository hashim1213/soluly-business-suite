-- =============================================
-- Feature Request Enhancements
-- Add scheduling, estimation, and assignment fields
-- =============================================

-- Add new columns to feature_requests
ALTER TABLE feature_requests
ADD COLUMN IF NOT EXISTS tentative_start_date DATE,
ADD COLUMN IF NOT EXISTS tentative_end_date DATE,
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS cost_override BOOLEAN DEFAULT FALSE;

-- Create junction table for feature request assignees
CREATE TABLE IF NOT EXISTS feature_request_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_request_id, team_member_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_request_assignees_feature
  ON feature_request_assignees(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_assignees_member
  ON feature_request_assignees(team_member_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_dates
  ON feature_requests(tentative_start_date, tentative_end_date);

-- Enable RLS
ALTER TABLE feature_request_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_request_assignees
-- Users can view assignees for features they can access
CREATE POLICY "feature_request_assignees_select" ON feature_request_assignees
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_id
      AND fr.organization_id = (
        SELECT organization_id FROM team_members
        WHERE auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Users can insert assignees for features in their org
CREATE POLICY "feature_request_assignees_insert" ON feature_request_assignees
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_id
      AND fr.organization_id = (
        SELECT organization_id FROM team_members
        WHERE auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Users can delete assignees for features in their org
CREATE POLICY "feature_request_assignees_delete" ON feature_request_assignees
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_id
      AND fr.organization_id = (
        SELECT organization_id FROM team_members
        WHERE auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Function to calculate feature cost based on assignees' hourly rates
CREATE OR REPLACE FUNCTION calculate_feature_cost(
  p_feature_id UUID,
  p_hours NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cost NUMERIC := 0;
  v_assignee_count INT;
  v_avg_rate NUMERIC;
BEGIN
  -- Get average hourly rate of all assignees
  SELECT COUNT(*), COALESCE(AVG(tm.hourly_rate), 0)
  INTO v_assignee_count, v_avg_rate
  FROM feature_request_assignees fra
  JOIN team_members tm ON tm.id = fra.team_member_id
  WHERE fra.feature_request_id = p_feature_id;

  -- If no assignees, return 0
  IF v_assignee_count = 0 OR p_hours IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate cost: hours * average hourly rate
  v_total_cost := p_hours * v_avg_rate;

  RETURN ROUND(v_total_cost, 2);
END;
$$;
