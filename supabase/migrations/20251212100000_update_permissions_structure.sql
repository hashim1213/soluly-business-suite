-- ============================================
-- UPDATE PERMISSIONS STRUCTURE
-- Adds financials and expenses permissions to all roles
-- ============================================

-- Update the create_default_roles_for_org function with new permission structure
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
    "financials": {"view": true, "create": true, "edit": true, "delete": true},
    "expenses": {"view": true, "create": true, "edit": true, "delete": true},
    "settings": {"view": true, "manage_org": true, "manage_users": true, "manage_roles": true}
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Manager role
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
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
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Sales role - CRM focused
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
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
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

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
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

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
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "settings": {"view": true, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Accountant role - NEW
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
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
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Viewer role - NEW
  INSERT INTO roles (organization_id, name, description, is_system, permissions) VALUES
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
  }'::jsonb)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;
END;
$$ LANGUAGE plpgsql;

-- Update existing roles to include new financials and expenses permissions
-- For existing Admin roles - add full financials/expenses access
UPDATE roles
SET permissions = permissions || '{"financials": {"view": true, "create": true, "edit": true, "delete": true}, "expenses": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
WHERE name = 'Admin'
AND NOT (permissions ? 'financials');

-- For existing Manager roles - add view financials and manage expenses
UPDATE roles
SET permissions = permissions || '{"financials": {"view": true, "create": false, "edit": false, "delete": false}, "expenses": {"view": true, "create": true, "edit": true, "delete": false}}'::jsonb
WHERE name = 'Manager'
AND NOT (permissions ? 'financials');

-- For all other roles - add no access to financials/expenses
UPDATE roles
SET permissions = permissions || '{"financials": {"view": false, "create": false, "edit": false, "delete": false}, "expenses": {"view": false, "create": false, "edit": false, "delete": false}}'::jsonb
WHERE name NOT IN ('Admin', 'Manager', 'Accountant')
AND NOT (permissions ? 'financials');

-- Apply updated roles to all existing organizations
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    PERFORM create_default_roles_for_org(org_record.id);
  END LOOP;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
