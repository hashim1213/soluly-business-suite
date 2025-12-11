-- Project Contracts Table
-- Stores contract documents associated with projects

CREATE TABLE IF NOT EXISTS project_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'service', -- nda, service, employee, contractor
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, signed, active, expired
  file_url TEXT, -- URL to the uploaded file (optional)
  file_size TEXT, -- e.g., "245 KB"
  notes TEXT,
  signed_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, display_id)
);

-- Enable RLS
ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_contracts
CREATE POLICY "Users can view contracts in their organization" ON project_contracts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contracts in their organization" ON project_contracts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contracts in their organization" ON project_contracts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contracts in their organization" ON project_contracts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_contracts_organization ON project_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_project ON project_contracts(project_id);
