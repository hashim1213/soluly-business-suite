-- Deal groups + org-customizable pipeline stages and dropdown options
--
-- 1) Deal groups: a named deal (e.g. "First Farms", "University") that many
--    customer quotes can belong to. quotes.deal_group_id links each deal
--    card to its group.
CREATE TABLE public.deal_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX idx_deal_groups_org ON deal_groups(organization_id);

ALTER TABLE deal_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal groups in their organization"
  ON deal_groups FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create deal groups in their organization"
  ON deal_groups FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update deal groups in their organization"
  ON deal_groups FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete deal groups in their organization"
  ON deal_groups FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE TRIGGER update_deal_groups_updated_at
  BEFORE UPDATE ON public.deal_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE quotes ADD COLUMN deal_group_id UUID REFERENCES deal_groups(id) ON DELETE SET NULL;
CREATE INDEX idx_quotes_deal_group ON quotes(deal_group_id);

-- 2) Org-customizable CRM pipeline stages. quotes.status stores the stage
--    key, so it must become TEXT instead of the fixed quote_status enum.
--    stage_category lets reporting classify custom stages as open/won/lost
--    without knowing their keys.
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  stage_category TEXT NOT NULL DEFAULT 'open' CHECK (stage_category IN ('open', 'won', 'lost')),
  win_progress INTEGER NOT NULL DEFAULT 50 CHECK (win_progress >= 0 AND win_progress <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE INDEX idx_crm_pipeline_stages_org ON crm_pipeline_stages(organization_id);

ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline stages in their organization"
  ON crm_pipeline_stages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create pipeline stages in their organization"
  ON crm_pipeline_stages FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update pipeline stages in their organization"
  ON crm_pipeline_stages FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pipeline stages in their organization"
  ON crm_pipeline_stages FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

-- 3) Org-customizable dropdown options for the enum-backed selects across
--    the app (lead status, activity type, ticket type/category/priority/
--    status, project status, feature status/priority). Options live per
--    organization; the app falls back to the built-in defaults when an org
--    has no rows for a given option_type.
CREATE TABLE public.dropdown_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  option_type TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, option_type, value)
);

CREATE INDEX idx_dropdown_options_org_type ON dropdown_options(organization_id, option_type);

ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dropdown options in their organization"
  ON dropdown_options FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create dropdown options in their organization"
  ON dropdown_options FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update dropdown options in their organization"
  ON dropdown_options FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete dropdown options in their organization"
  ON dropdown_options FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members
    WHERE auth_user_id = auth.uid()
  ));

-- 4) Loosen the enum-backed columns to TEXT so organizations can define
--    their own values. Existing data keeps its current values, and the
--    app's built-in defaults use the same keys, so nothing changes for
--    orgs that never customize.
ALTER TABLE quotes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE quotes ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE quotes ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE crm_leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE crm_leads ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE crm_leads ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE crm_activities ALTER COLUMN type DROP DEFAULT;
ALTER TABLE crm_activities ALTER COLUMN type TYPE TEXT USING type::text;
ALTER TABLE crm_activities ALTER COLUMN type SET DEFAULT 'call';

ALTER TABLE tickets ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tickets ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE tickets ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE tickets ALTER COLUMN priority TYPE TEXT USING priority::text;
ALTER TABLE tickets ALTER COLUMN priority SET DEFAULT 'medium';

ALTER TABLE tickets ALTER COLUMN category DROP DEFAULT;
ALTER TABLE tickets ALTER COLUMN category TYPE TEXT USING category::text;
ALTER TABLE tickets ALTER COLUMN category SET DEFAULT 'feature';

ALTER TABLE tickets ALTER COLUMN ticket_type DROP DEFAULT;
ALTER TABLE tickets ALTER COLUMN ticket_type TYPE TEXT USING ticket_type::text;
ALTER TABLE tickets ALTER COLUMN ticket_type SET DEFAULT 'task';

ALTER TABLE projects ALTER COLUMN status DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE feature_requests ALTER COLUMN status DROP DEFAULT;
ALTER TABLE feature_requests ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE feature_requests ALTER COLUMN status SET DEFAULT 'backlog';

ALTER TABLE feature_requests ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE feature_requests ALTER COLUMN priority TYPE TEXT USING priority::text;
ALTER TABLE feature_requests ALTER COLUMN priority SET DEFAULT 'medium';
