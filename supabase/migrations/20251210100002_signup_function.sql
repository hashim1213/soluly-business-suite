-- =============================================
-- Signup Function with Elevated Privileges
-- =============================================

-- This function handles the entire org/role/member creation process
-- It runs with SECURITY DEFINER to bypass RLS during signup
CREATE OR REPLACE FUNCTION handle_new_user_signup(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSON
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
    RETURN json_build_object('success', false, 'error', 'Organization URL is already taken');
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
    p_email,
    'Admin',
    'Management',
    TRUE,
    'active'
  )
  RETURNING id INTO v_member_id;

  RETURN json_build_object(
    'success', true,
    'organization_id', v_org_id,
    'member_id', v_member_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION handle_invitation_acceptance(
  p_user_id UUID,
  p_token TEXT,
  p_name TEXT
)
RETURNS JSON
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
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
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
    v_invitation.email,
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

  RETURN json_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'member_id', v_member_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION handle_new_user_signup TO authenticated;
GRANT EXECUTE ON FUNCTION handle_invitation_acceptance TO authenticated;

-- Also grant to anon for the signup flow (user may not be fully authenticated yet)
GRANT EXECUTE ON FUNCTION handle_new_user_signup TO anon;
GRANT EXECUTE ON FUNCTION handle_invitation_acceptance TO anon;
