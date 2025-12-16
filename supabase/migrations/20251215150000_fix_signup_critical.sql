-- =============================================
-- CRITICAL FIX: Fix signup flow issues
-- 1. Fix 'assigned' string being used instead of UUID[] for project_scope
-- 2. Ensure signup function works correctly
-- =============================================

-- Fix the create_default_roles_for_org function
-- The Contractor role was using 'assigned' (TEXT) instead of '{}'::UUID[] (empty array)
CREATE OR REPLACE FUNCTION public.create_default_roles_for_org(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin role - full access
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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

  -- Contractor role - project-scoped (empty array means needs assignment)
  -- FIXED: Changed from 'assigned' (TEXT) to '{}'::UUID[] (empty array)
  INSERT INTO public.roles (organization_id, name, description, is_system, permissions, project_scope) VALUES
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
  }'::jsonb, '{}'::UUID[])
  ON CONFLICT (organization_id, name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    project_scope = EXCLUDED.project_scope;

END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_default_roles_for_org(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.create_default_roles_for_org(UUID) TO authenticated;

-- Fix any existing Contractor roles that might have bad data
-- This shouldn't happen in prod yet, but just in case
UPDATE public.roles
SET project_scope = '{}'::UUID[]
WHERE name = 'Contractor' AND project_scope IS NULL;
