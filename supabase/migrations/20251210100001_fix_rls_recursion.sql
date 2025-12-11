-- =============================================
-- Fix RLS Infinite Recursion Issue
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization if owner" ON organizations;
DROP POLICY IF EXISTS "Users can view roles in their organization" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Users can view invitations in their organization" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Allow insert for signup" ON team_members;
DROP POLICY IF EXISTS "Allow insert for organizations" ON organizations;
DROP POLICY IF EXISTS "Allow insert for roles" ON roles;
DROP POLICY IF EXISTS "Users can update their own profile" ON team_members;

-- Create a security definer function to get user's organization_id without RLS
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Create a security definer function to check if user is owner
CREATE OR REPLACE FUNCTION is_organization_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_owner FROM team_members WHERE auth_user_id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- Create a security definer function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE permission_path
          WHEN 'settings.manage_roles' THEN (r.permissions->'settings'->>'manage_roles')::boolean
          WHEN 'settings.manage_users' THEN (r.permissions->'settings'->>'manage_users')::boolean
          WHEN 'settings.manage_org' THEN (r.permissions->'settings'->>'manage_org')::boolean
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
-- Team Members Policies (fixed - no recursion)
-- =============================================

-- Users can view team members in their organization
CREATE POLICY "Users can view team members in their organization" ON team_members
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    OR auth_user_id = auth.uid() -- Can always view own record
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON team_members
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Admins can insert/delete team members
CREATE POLICY "Admins can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_users')
  );

CREATE POLICY "Admins can delete team members" ON team_members
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_users')
    AND auth_user_id != auth.uid() -- Cannot delete yourself
  );

-- Keep the signup insert policy (allows first user to create themselves)
-- This was already created in the previous migration

-- =============================================
-- Organizations Policies (fixed)
-- =============================================

CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization_id()
  );

CREATE POLICY "Owners can update their organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id()
    AND (is_organization_owner() OR user_has_permission('settings.manage_org'))
  );

-- =============================================
-- Roles Policies (fixed)
-- =============================================

CREATE POLICY "Users can view roles in their organization" ON roles
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins can insert roles" ON roles
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_roles')
  );

CREATE POLICY "Admins can update roles" ON roles
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_roles')
  );

CREATE POLICY "Admins can delete roles" ON roles
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_roles')
    AND is_system = FALSE -- Cannot delete system roles
  );

-- =============================================
-- Invitations Policies (fixed)
-- =============================================

CREATE POLICY "Users can view invitations in their organization" ON invitations
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins can insert invitations" ON invitations
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_users')
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_users')
  );

CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND user_has_permission('settings.manage_users')
  );

-- =============================================
-- Signup Flow Policies (allow authenticated users to create initial records)
-- =============================================

-- Allow authenticated users to create their first organization (during signup)
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert their first team member record
-- This is needed during signup when user creates themselves
CREATE POLICY "Authenticated users can create first team member" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth_user_id = auth.uid()  -- Can only create record for themselves
  );

-- Allow the create_default_roles_for_org function to insert roles
-- Using a broader policy since the function is called during signup
CREATE POLICY "Allow role creation for new orgs" ON roles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
