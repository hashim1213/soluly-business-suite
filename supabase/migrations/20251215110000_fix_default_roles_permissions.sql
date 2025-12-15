-- =============================================
-- Fix Default Roles to Include Forms and Issues Permissions
-- Updates create_default_roles_for_org to include all permissions
-- =============================================

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
    "forms": {"view": true, "create": true, "edit": true, "delete": true},
    "issues": {"view": true, "create": true, "edit": true, "delete": true},
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
    "forms": {"view": true, "create": true, "edit": true, "delete": false},
    "issues": {"view": true, "create": true, "edit": true, "delete": false},
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
    "forms": {"view": true, "create": false, "edit": false, "delete": false},
    "issues": {"view": true, "create": true, "edit": "own", "delete": false},
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
    "forms": {"view": true, "create": true, "edit": true, "delete": false},
    "issues": {"view": true, "create": true, "edit": true, "delete": false},
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
    "forms": {"view": true, "create": true, "edit": true, "delete": false},
    "issues": {"view": true, "create": true, "edit": true, "delete": false},
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
    "forms": {"view": false, "create": false, "edit": false, "delete": false},
    "issues": {"view": false, "create": false, "edit": false, "delete": false},
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
    "forms": {"view": true, "create": false, "edit": false, "delete": false},
    "issues": {"view": true, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, NULL)
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;

  -- Contractor role - project-scoped
  INSERT INTO roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
  (org_id, 'Contractor', 'External contractor with access only to assigned projects', TRUE, '{
    "dashboard": {"view": true},
    "projects": {"view": true, "create": false, "edit": true, "delete": false},
    "tickets": {"view": true, "create": true, "edit": "own", "delete": false},
    "team": {"view": true, "create": false, "edit": false, "delete": false},
    "crm": {"view": false, "create": false, "edit": false, "delete": false},
    "quotes": {"view": false, "create": false, "edit": false, "delete": false},
    "features": {"view": true, "create": true, "edit": "own", "delete": false},
    "feedback": {"view": true, "create": true, "edit": "own", "delete": false},
    "emails": {"view": false, "create": false, "edit": false, "delete": false},
    "financials": {"view": false, "create": false, "edit": false, "delete": false},
    "expenses": {"view": false, "create": false, "edit": false, "delete": false},
    "forms": {"view": true, "create": false, "edit": false, "delete": false},
    "issues": {"view": true, "create": true, "edit": "own", "delete": false},
    "settings": {"view": false, "manage_org": false, "manage_users": false, "manage_roles": false}
  }'::jsonb, 'assigned')
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    project_scope = EXCLUDED.project_scope;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update all existing roles to have forms and issues permissions if missing
-- This ensures any orgs created before this migration also get the permissions

-- Add forms permission to existing Admin roles that don't have it
UPDATE roles
SET permissions = permissions || '{"forms": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
WHERE name = 'Admin' AND NOT (permissions ? 'forms');

-- Add issues permission to existing Admin roles that don't have it
UPDATE roles
SET permissions = permissions || '{"issues": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
WHERE name = 'Admin' AND NOT (permissions ? 'issues');

-- Add forms permission to other roles
UPDATE roles
SET permissions = permissions || '{"forms": {"view": true, "create": true, "edit": true, "delete": false}}'::jsonb
WHERE name IN ('Manager', 'Customer Success', 'Developer') AND NOT (permissions ? 'forms');

UPDATE roles
SET permissions = permissions || '{"forms": {"view": true, "create": false, "edit": false, "delete": false}}'::jsonb
WHERE name IN ('Sales', 'Viewer', 'Contractor') AND NOT (permissions ? 'forms');

-- Add issues permission to other roles
UPDATE roles
SET permissions = permissions || '{"issues": {"view": true, "create": true, "edit": true, "delete": false}}'::jsonb
WHERE name IN ('Manager', 'Customer Success', 'Developer') AND NOT (permissions ? 'issues');

UPDATE roles
SET permissions = permissions || '{"issues": {"view": true, "create": true, "edit": "own", "delete": false}}'::jsonb
WHERE name IN ('Sales', 'Contractor') AND NOT (permissions ? 'issues');

UPDATE roles
SET permissions = permissions || '{"issues": {"view": true, "create": false, "edit": false, "delete": false}}'::jsonb
WHERE name = 'Viewer' AND NOT (permissions ? 'issues');
