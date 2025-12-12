-- ============================================
-- PROJECT-SCOPED ROLES
-- Allows restricting users to specific projects
-- ============================================

-- Add project_scope to roles table
-- NULL = access to all projects (default for existing roles)
-- Empty array = no project access
-- Array of UUIDs = access only to those specific projects
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS project_scope UUID[] DEFAULT NULL;

-- Add index for efficient project scope lookups
CREATE INDEX IF NOT EXISTS idx_roles_project_scope ON roles USING GIN (project_scope);

-- Also add project_ids to team_members for direct assignment
-- This overrides role-level project scope if set
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS allowed_project_ids UUID[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_allowed_projects ON team_members USING GIN (allowed_project_ids);

-- Create a function to check if a user has access to a specific project
CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        -- If member has specific project_ids, use those
        CASE
          WHEN tm.allowed_project_ids IS NOT NULL THEN
            p_project_id = ANY(tm.allowed_project_ids)
          -- Otherwise check role's project_scope
          WHEN r.project_scope IS NOT NULL THEN
            p_project_id = ANY(r.project_scope)
          -- NULL project_scope means access to all projects
          ELSE TRUE
        END
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      LIMIT 1
    ),
    FALSE
  );
$$;

-- Create a function to get user's allowed project IDs
-- Returns NULL if user has access to all projects
CREATE OR REPLACE FUNCTION get_user_allowed_project_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    CASE
      -- If member has specific project_ids, use those
      WHEN tm.allowed_project_ids IS NOT NULL THEN tm.allowed_project_ids
      -- Otherwise use role's project_scope (could be NULL for all access)
      ELSE r.project_scope
    END
  FROM team_members tm
  LEFT JOIN roles r ON tm.role_id = r.id
  WHERE tm.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Create a function to check if user has full project access (not scoped)
CREATE OR REPLACE FUNCTION user_has_full_project_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        tm.allowed_project_ids IS NULL AND r.project_scope IS NULL
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      LIMIT 1
    ),
    FALSE
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_has_project_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_allowed_project_ids TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_full_project_access TO authenticated;

-- Add a "Contractor" role template with project scope
-- This will be created for each organization via the function update below

-- Update the create_default_roles_for_org function to include Contractor role
CREATE OR REPLACE FUNCTION create_default_roles_for_org(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Admin role - full access
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
    "financials": {"view": true, "create": true, "edit": true, "delete": true},
    "expenses": {"view": true, "create": true, "edit": true, "delete": true},
    "settings": {"view": true, "manage_org": true, "manage_users": true, "manage_roles": true}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Manager role
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Manager', 'Can manage projects, team, and view financials', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": true, "edit": true, "delete": false},
    "tickets": {"view": true, "create": true, "edit": true, "delete": false},
    "team": {"view": true, "create": false, "edit": true, "delete": false},
    "crm": {"view": true, "create": true, "edit": true, "delete": false},
    "quotes": {"view": true, "create": true, "edit": true, "delete": false},
    "features": {"view": true, "create": true, "edit": true, "delete": false},
    "feedback": {"view": true, "create": true, "edit": true, "delete": false},
    "emails": {"view": true, "create": true, "edit": true, "delete": false},
    "financials": {"view": true, "create": false, "edit": false, "delete": false},
    "expenses": {"view": true, "create": true, "edit": true, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Sales role - CRM focused
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Sales', 'Access to CRM, quotes, and client management', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": false, "delete": false},
    "tickets": {"view": true, "create": true, "edit": "own", "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": true, "create": true, "edit": "own", "delete": false},
    "quotes": {"view": true, "create": true, "edit": "own", "delete": false},
    "features": {"view": true, "create": true, "edit": false, "delete": false},
    "feedback": {"view": true, "create": true, "edit": false, "delete": false},
    "emails": {"view": "own", "create": true, "edit": false, "delete": false},
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Customer Success role
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Developer role
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Accountant role
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Accountant', 'Access to financials and expenses only', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": false, "create": false, "edit": false, "delete": false},
    "tickets": {"view": false, "create": false, "edit": false, "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": false, "create": false, "edit": false, "delete": false},
    "quotes": {"view": true, "create": false, "edit": false, "delete": false},
    "features": {"view": false, "create": false, "edit": false, "delete": false},
    "feedback": {"view": false, "create": false, "edit": false, "delete": false},
    "emails": {"view": false, "create": false, "edit": false, "delete": false},
    "financials": {"view": true, "create": true, "edit": true, "delete": true},
    "expenses": {"view": true, "create": true, "edit": true, "delete": true},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Viewer role
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Viewer', 'Read-only access to most areas', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": false, "delete": false},
    "tickets": {"view": true, "create": false, "edit": false, "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": true, "create": false, "edit": false, "delete": false},
    "quotes": {"view": true, "create": false, "edit": false, "delete": false},
    "features": {"view": true, "create": false, "edit": false, "delete": false},
    "feedback": {"view": true, "create": false, "edit": false, "delete": false},
    "emails": {"view": false, "create": false, "edit": false, "delete": false},
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Contractor role - NEW (project-scoped by default, needs project assignment)
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Contractor', 'Limited access to assigned projects only', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": false, "delete": false},
    "tickets": {"view": true, "create": true, "edit": "own", "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": false, "create": false, "edit": false, "delete": false},
    "quotes": {"view": false, "create": false, "edit": false, "delete": false},
    "features": {"view": true, "create": true, "edit": "own", "delete": false},
    "feedback": {"view": true, "create": true, "edit": "own", "delete": false},
    "emails": {"view": false, "create": false, "edit": false, "delete": false},
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, ARRAY[]::UUID[])
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    project_scope = EXCLUDED.project_scope;
END;
$$ LANGUAGE plpgsql;

-- Apply Contractor role to all existing organizations
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Only insert Contractor role if it doesn't exist
    INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope)
    VALUES (
      org_record.id,
      'Contractor',
      'Limited access to assigned projects only',
      TRUE,
      '{
        "dashboard": {"view": true},
        "projects": {"view": true, "create": false, "edit": false, "delete": false},
        "tickets": {"view": true, "create": true, "edit": "own", "delete": false},
        "team": {"view": true, "create": false, "edit": false, "delete": false},
        "crm": {"view": false, "create": false, "edit": false, "delete": false},
        "quotes": {"view": false, "create": false, "edit": false, "delete": false},
        "features": {"view": true, "create": true, "edit": "own", "delete": false},
        "feedback": {"view": true, "create": true, "edit": "own", "delete": false},
        "emails": {"view": false, "create": false, "edit": false, "delete": false},
        "financials": {"view": false, "create": false, "edit": false, "delete": false},
        "expenses": {"view": false, "create": false, "edit": false, "delete": false},
        "settings": {"view": false, "manage_org": false, "manage_users": false, "manage_roles": false}
      }'::jsonb,
      ARRAY[]::UUID[]
    )
    ON CONFLICT (organization_id, name) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
