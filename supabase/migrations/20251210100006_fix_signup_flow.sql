-- =============================================
-- Fix Signup Flow - Make org creation work reliably
-- =============================================

-- Drop existing function to recreate with better error handling
DROP FUNCTION IF EXISTS handle_new_user_signup(UUID, TEXT, TEXT, TEXT, TEXT);

-- Create a more robust signup function that can be called by anon users
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
  v_slug := lower(regexp_replace(COALESCE(p_org_slug, ''), '[^a-z0-9-]', '-', 'g'));

  -- Validate inputs
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email is required');
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Name is required');
  END IF;

  IF p_org_name IS NULL OR p_org_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization name is required');
  END IF;

  IF v_slug IS NULL OR length(v_slug) < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization URL must be at least 3 characters');
  END IF;

  -- Check if slug is already taken
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization URL is already taken');
  END IF;

  -- Check if user already has an organization
  IF EXISTS (SELECT 1 FROM team_members WHERE auth_user_id = p_user_id) THEN
    -- User already has org, return success with existing data
    SELECT tm.organization_id, tm.id INTO v_org_id, v_member_id
    FROM team_members tm
    WHERE tm.auth_user_id = p_user_id
    LIMIT 1;

    RETURN jsonb_build_object(
      'success', true,
      'organization_id', v_org_id,
      'member_id', v_member_id,
      'message', 'User already has an organization'
    );
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
  RAISE WARNING 'handle_new_user_signup error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to both anon and authenticated users
GRANT EXECUTE ON FUNCTION handle_new_user_signup(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user_signup(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Make sure create_default_roles_for_org exists and is accessible
GRANT EXECUTE ON FUNCTION create_default_roles_for_org(UUID) TO anon;
GRANT EXECUTE ON FUNCTION create_default_roles_for_org(UUID) TO authenticated;

-- Ensure tables allow inserts from the SECURITY DEFINER function
-- The function runs as the DB owner, but we need to make sure RLS doesn't block it

-- Add a policy to allow the signup function to insert (it runs as definer anyway, but just in case)
DROP POLICY IF EXISTS "Allow signup function to insert orgs" ON organizations;
CREATE POLICY "Allow signup function to insert orgs" ON organizations
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow signup function to insert team_members" ON team_members;
CREATE POLICY "Allow signup function to insert team_members" ON team_members
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow signup function to insert roles" ON roles;
CREATE POLICY "Allow signup function to insert roles" ON roles
  FOR INSERT WITH CHECK (TRUE);
