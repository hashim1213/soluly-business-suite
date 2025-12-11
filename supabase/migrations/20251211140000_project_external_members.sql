-- Project External Members Table
-- Links contacts to projects as external team members (client-side stakeholders)

CREATE TABLE IF NOT EXISTS project_external_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT, -- Role on the project (e.g., Product Owner, Technical Lead)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contact_id)
);

-- Enable RLS
ALTER TABLE project_external_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_external_members
CREATE POLICY "Users can view external members in their organization" ON project_external_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create external members in their organization" ON project_external_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update external members in their organization" ON project_external_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete external members in their organization" ON project_external_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_external_members_organization ON project_external_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_external_members_project ON project_external_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_external_members_contact ON project_external_members(contact_id);
