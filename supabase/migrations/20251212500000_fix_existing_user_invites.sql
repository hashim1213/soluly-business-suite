-- ============================================
-- FIX EXISTING USER INVITATION ACCEPTANCE
-- Allows users who already have accounts to join new organizations
-- ============================================

-- Update the handle_invitation_acceptance function to support existing users
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
  v_auth_user_exists BOOLEAN;
  v_already_member BOOLEAN;
BEGIN
  -- Get and validate invitation
  SELECT i.*, r.name as role_name, o.name as org_name
  INTO v_invitation
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  LEFT JOIN organizations o ON i.organization_id = o.id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW();

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if auth user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_auth_user_exists;

  IF NOT v_auth_user_exists THEN
    -- User not yet in auth.users - store pending invitation data
    UPDATE invitations
    SET
      pending_user_id = p_user_id,
      pending_user_name = p_name
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Please confirm your email first, then sign in to complete the invitation acceptance',
      'pending', true
    );
  END IF;

  -- Check if user is ALREADY a member of THIS specific organization
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE auth_user_id = p_user_id
    AND organization_id = v_invitation.organization_id
  ) INTO v_already_member;

  IF v_already_member THEN
    -- Mark invitation as accepted since user is already in this org
    UPDATE invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'message', 'You are already a member of this organization'
    );
  END IF;

  v_role_name := COALESCE(v_invitation.role_name, 'Member');

  -- Create team member (this allows multi-org membership)
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

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'organization_id', v_invitation.organization_id,
    'organization_name', v_invitation.org_name
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create a new function specifically for existing authenticated users to accept invites
CREATE OR REPLACE FUNCTION accept_invitation_existing_user(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
  v_role_name TEXT;
  v_user_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_already_member BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be logged in to accept this invitation');
  END IF;

  -- Get user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Get and validate invitation
  SELECT i.*, r.name as role_name, o.name as org_name, o.slug as org_slug
  INTO v_invitation
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  LEFT JOIN organizations o ON i.organization_id = o.id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW();

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if the invitation email matches the logged-in user's email
  IF lower(v_invitation.email) != lower(v_user_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation was sent to a different email address. Please log in with ' || v_invitation.email
    );
  END IF;

  -- Check if user is already a member of this organization
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE auth_user_id = v_user_id
    AND organization_id = v_invitation.organization_id
  ) INTO v_already_member;

  IF v_already_member THEN
    UPDATE invitations SET accepted_at = NOW() WHERE id = v_invitation.id;
    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'organization_id', v_invitation.organization_id,
      'organization_slug', v_invitation.org_slug
    );
  END IF;

  -- Get user's name from any existing team_member record, or use email prefix
  SELECT name INTO v_user_name
  FROM team_members
  WHERE auth_user_id = v_user_id
  LIMIT 1;

  IF v_user_name IS NULL THEN
    v_user_name := split_part(v_user_email, '@', 1);
  END IF;

  v_role_name := COALESCE(v_invitation.role_name, 'Member');

  -- Create team member for this organization
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
    v_user_id,
    v_invitation.organization_id,
    v_invitation.role_id,
    v_user_name,
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

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'organization_id', v_invitation.organization_id,
    'organization_name', v_invitation.org_name,
    'organization_slug', v_invitation.org_slug
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_invitation_existing_user TO authenticated;

-- Update complete_pending_invitation to also support multi-org
CREATE OR REPLACE FUNCTION complete_pending_invitation(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
  v_role_name TEXT;
  v_already_member BOOLEAN;
BEGIN
  -- Check for pending invitation for this user
  SELECT i.*, r.name as role_name, o.slug as org_slug
  INTO v_invitation
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  LEFT JOIN organizations o ON i.organization_id = o.id
  WHERE i.pending_user_id = p_user_id
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
  LIMIT 1;

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  -- Check if user is already a member of THIS organization
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE auth_user_id = p_user_id
    AND organization_id = v_invitation.organization_id
  ) INTO v_already_member;

  IF v_already_member THEN
    -- Clear pending data and mark as accepted
    UPDATE invitations
    SET
      accepted_at = NOW(),
      pending_user_id = NULL,
      pending_user_name = NULL
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'organization_slug', v_invitation.org_slug
    );
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
    COALESCE(v_invitation.pending_user_name, 'New Member'),
    v_invitation.email,
    v_role_name,
    'General',
    FALSE,
    'active'
  )
  RETURNING id INTO v_member_id;

  -- Mark invitation as accepted and clear pending data
  UPDATE invitations
  SET
    accepted_at = NOW(),
    pending_user_id = NULL,
    pending_user_name = NULL
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'organization_id', v_invitation.organization_id,
    'organization_slug', v_invitation.org_slug
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
