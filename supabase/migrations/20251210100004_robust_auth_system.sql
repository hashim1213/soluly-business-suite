-- =============================================
-- Robust Auth System - Complete Rewrite
-- This migration consolidates and fixes all auth-related issues
-- =============================================

-- First, drop ALL policies that might depend on the functions we're replacing
-- Team Members policies
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Users can view own record or org members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON team_members;
DROP POLICY IF EXISTS "Users can update their own profile" ON team_members;
DROP POLICY IF EXISTS "Allow insert for signup" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can create first team member" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_update_own" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_admin" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_admin" ON team_members;

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization if owner" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "Allow insert for organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;

-- Roles policies
DROP POLICY IF EXISTS "Users can view roles in their organization" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON roles;
DROP POLICY IF EXISTS "Admins can update roles" ON roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON roles;
DROP POLICY IF EXISTS "Allow insert for roles" ON roles;
DROP POLICY IF EXISTS "Allow role creation for new orgs" ON roles;
DROP POLICY IF EXISTS "roles_select" ON roles;
DROP POLICY IF EXISTS "roles_insert" ON roles;
DROP POLICY IF EXISTS "roles_update" ON roles;
DROP POLICY IF EXISTS "roles_delete" ON roles;

-- Invitations policies
DROP POLICY IF EXISTS "Users can view invitations in their organization" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can insert invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;
DROP POLICY IF EXISTS "invitations_select" ON invitations;
DROP POLICY IF EXISTS "invitations_insert" ON invitations;
DROP POLICY IF EXISTS "invitations_update" ON invitations;
DROP POLICY IF EXISTS "invitations_delete" ON invitations;

-- Now drop existing functions to recreate them
DROP FUNCTION IF EXISTS handle_new_user_signup(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_invitation_acceptance(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_organization_id();
DROP FUNCTION IF EXISTS is_organization_owner();
DROP FUNCTION IF EXISTS user_has_permission(TEXT);

-- =============================================
-- 1. Core Helper Functions (SECURITY DEFINER)
-- =============================================

-- Get user's organization_id safely (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id
  FROM team_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is organization owner
CREATE OR REPLACE FUNCTION auth_is_org_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_owner FROM team_members WHERE auth_user_id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- Check if user has a specific settings permission
CREATE OR REPLACE FUNCTION auth_has_settings_permission(perm TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE perm
          WHEN 'manage_roles' THEN (r.permissions->'settings'->>'manage_roles')::boolean
          WHEN 'manage_users' THEN (r.permissions->'settings'->>'manage_users')::boolean
          WHEN 'manage_org' THEN (r.permissions->'settings'->>'manage_org')::boolean
          ELSE FALSE
        END
      FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      LIMIT 1
    ),
    FALSE
  );
$$;

-- =============================================
-- 2. Signup Function (returns JSONB for better compatibility)
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user_signup(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_admin_role_id UUID;
  v_member_id UUID;
  v_slug TEXT;
BEGIN
  -- Normalize slug
  v_slug := lower(regexp_replace(p_org_slug, '[^a-z0-9-]', '-', 'g'));

  -- Check if slug is already taken
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization URL is already taken');
  END IF;

  -- Check if user already has an organization
  IF EXISTS (SELECT 1 FROM team_members WHERE auth_user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already belongs to an organization');
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (p_org_name, v_slug)
  RETURNING id INTO v_org_id;

  -- Create default roles for the organization
  PERFORM create_default_roles_for_org(v_org_id);

  -- Get the Admin role ID
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE organization_id = v_org_id AND name = 'Admin'
  LIMIT 1;

  -- Create team member
  INSERT INTO team_members (
    auth_user_id,
    organization_id,
    role_id,
    name,
    email,
    role,
    department,
    is_owner,
    status
  )
  VALUES (
    p_user_id,
    v_org_id,
    v_admin_role_id,
    p_name,
    lower(p_email),
    'Admin',
    'Management',
    TRUE,
    'active'
  )
  RETURNING id INTO v_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'member_id', v_member_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Log the error for debugging
  RAISE WARNING 'handle_new_user_signup error: %', SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================
-- 3. Invitation Acceptance Function
-- =============================================

CREATE OR REPLACE FUNCTION handle_invitation_acceptance(
  p_user_id UUID,
  p_token TEXT,
  p_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
  v_role_name TEXT;
BEGIN
  -- Get and validate invitation
  SELECT i.*, r.name as role_name
  INTO v_invitation
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW();

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if user already belongs to an organization
  IF EXISTS (SELECT 1 FROM team_members WHERE auth_user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already belongs to an organization');
  END IF;

  v_role_name := COALESCE(v_invitation.role_name, 'Member');

  -- Create team member
  INSERT INTO team_members (
    auth_user_id,
    organization_id,
    role_id,
    name,
    email,
    role,
    department,
    is_owner,
    status
  )
  VALUES (
    p_user_id,
    v_invitation.organization_id,
    v_invitation.role_id,
    p_name,
    lower(v_invitation.email),
    v_role_name,
    'General',
    FALSE,
    'active'
  )
  RETURNING id INTO v_member_id;

  -- Mark invitation as accepted
  UPDATE invitations
  SET accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'member_id', v_member_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_invitation_acceptance error: %', SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================
-- 4. Create Clean RLS Policies
-- =============================================

-- TEAM MEMBERS
-- Users can view their own record or members in their org
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR organization_id = auth_get_user_org_id()
  );

-- Users can update their own profile
CREATE POLICY "team_members_update_own" ON team_members
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Admins can insert new team members (for invitations)
CREATE POLICY "team_members_insert_admin" ON team_members
  FOR INSERT WITH CHECK (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  );

-- Admins can delete team members (except themselves)
CREATE POLICY "team_members_delete_admin" ON team_members
  FOR DELETE USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
    AND auth_user_id != auth.uid()
  );

-- ORGANIZATIONS
-- Users can view their organization
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (
    id = auth_get_user_org_id()
  );

-- Owners/admins can update organization
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (
    id = auth_get_user_org_id()
    AND (auth_is_org_owner() OR auth_has_settings_permission('manage_org'))
  );

-- ROLES
-- Users can view roles in their organization
CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (
    organization_id = auth_get_user_org_id()
  );

-- Admins can manage roles
CREATE POLICY "roles_insert" ON roles
  FOR INSERT WITH CHECK (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_roles')
  );

CREATE POLICY "roles_update" ON roles
  FOR UPDATE USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_roles')
  );

CREATE POLICY "roles_delete" ON roles
  FOR DELETE USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_roles')
    AND is_system = FALSE
  );

-- INVITATIONS
-- Users can view invitations in their org
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id = auth_get_user_org_id()
    OR token IS NOT NULL  -- Allow viewing by token for acceptance
  );

-- Admins can manage invitations
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  );

CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  );

CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  );

-- =============================================
-- 6. Grant execute permissions
-- =============================================

GRANT EXECUTE ON FUNCTION handle_new_user_signup TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_signup TO anon;
GRANT EXECUTE ON FUNCTION handle_invitation_acceptance TO authenticated;
GRANT EXECUTE ON FUNCTION handle_invitation_acceptance TO anon;
GRANT EXECUTE ON FUNCTION auth_get_user_org_id TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_org_owner TO authenticated;
GRANT EXECUTE ON FUNCTION auth_has_settings_permission TO authenticated;

-- =============================================
-- 7. Audit logging table for SOC2 compliance
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  team_member_id UUID REFERENCES team_members(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_org')
  );

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_org_id UUID;
  v_member_id UUID;
BEGIN
  SELECT organization_id, id INTO v_org_id, v_member_id
  FROM team_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  INSERT INTO audit_logs (
    organization_id,
    user_id,
    team_member_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  )
  VALUES (
    v_org_id,
    auth.uid(),
    v_member_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
