-- =============================================
-- Authentication & Role-Based Access Control System
-- =============================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 3. Add columns to team_members table
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id),
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

-- 4. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  invited_by UUID REFERENCES team_members(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add organization_id to existing tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES team_members(id);
ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES team_members(id);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES team_members(id);
ALTER TABLE feature_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user ON team_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner ON quotes(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_org ON crm_clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_owner ON crm_clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON crm_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);

-- 7. Insert default role templates (these will be copied when org is created)
-- We'll create a function to seed roles for new organizations

CREATE OR REPLACE FUNCTION create_default_roles_for_org(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Admin role - full access
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
  (org_id, 'Admin', 'Full access to all features and settings', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": true, "edit": true, "delete": true},
    "tickets": {"view": true, "create": true, "edit": true, "delete": true},
    "team": {"view": true, "create": true, "edit": true, "delete": true},
    "crm": {"view": true, "create": true, "edit": true, "delete": true},
    "quotes": {"view": true, "create": true, "edit": true, "delete": true},
    "features": {"view": true, "create": true, "edit": true, "delete": true},
    "feedback": {"view": true, "create": true, "edit": true, "delete": true},
    "emails": {"view": true, "create": true, "edit": true, "delete": true},
    "settings": {"view": true, "manage_org": true, "manage_users": true, "manage_roles": true}
  }'::jsonb);

  -- Sales role - CRM focused
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
  (org_id, 'Sales', 'Access to CRM, quotes, and own deals', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": false, "delete": false},
    "tickets": {"view": true, "create": true, "edit": "own", "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": "own", "create": true, "edit": "own", "delete": false},
    "quotes": {"view": "own", "create": true, "edit": "own", "delete": false},
    "features": {"view": true, "create": true, "edit": false, "delete": false},
    "feedback": {"view": true, "create": true, "edit": false, "delete": false},
    "emails": {"view": "own", "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb);

  -- Customer Success role
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
  (org_id, 'Customer Success', 'Access to feedback, tickets, and client management', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": false, "delete": false},
    "tickets": {"view": true, "create": true, "edit": true, "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": true, "create": true, "edit": true, "delete": false},
    "quotes": {"view": true, "create": false, "edit": false, "delete": false},
    "features": {"view": true, "create": true, "edit": true, "delete": false},
    "feedback": {"view": true, "create": true, "edit": true, "delete": true},
    "emails": {"view": true, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb);

  -- Developer role
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
  (org_id, 'Developer', 'Access to projects, tickets, and feature requests', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": true, "edit": true, "delete": false},
    "tickets": {"view": true, "create": true, "edit": true, "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": false, "create": false, "edit": false, "delete": false},
    "quotes": {"view": false, "create": false, "edit": false, "delete": false},
    "features": {"view": true, "create": true, "edit": true, "delete": false},
    "feedback": {"view": true, "create": false, "edit": false, "delete": false},
    "emails": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 8. Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for organizations
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update their own organization if owner" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() AND is_owner = TRUE)
  );

-- 10. Create RLS policies for roles
CREATE POLICY "Users can view roles in their organization" ON roles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'settings'->>'manage_roles')::boolean = TRUE
    )
  );

-- 11. Create RLS policies for invitations
CREATE POLICY "Users can view invitations in their organization" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'settings'->>'manage_users')::boolean = TRUE
    )
  );

-- 12. Public policy for invitation acceptance (by token)
CREATE POLICY "Anyone can view invitation by token" ON invitations
  FOR SELECT USING (TRUE);

-- 13. Update team_members RLS policies
DROP POLICY IF EXISTS "Allow public read access to team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public insert access to team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public update access to team_members" ON team_members;
DROP POLICY IF EXISTS "Allow public delete access to team_members" ON team_members;

CREATE POLICY "Users can view team members in their organization" ON team_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
    OR auth_user_id IS NULL -- Allow viewing during signup flow
  );

CREATE POLICY "Users can update their own profile" ON team_members
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage team members" ON team_members
  FOR ALL USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'settings'->>'manage_users')::boolean = TRUE
    )
  );

-- 14. Allow public insert for signup flow
CREATE POLICY "Allow insert for signup" ON team_members
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow insert for organizations" ON organizations
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow insert for roles" ON roles
  FOR INSERT WITH CHECK (TRUE);

-- 15. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
