-- ============================================
-- FIX INVITATION ACCEPTANCE
-- Handles the case where auth.users entry may not be immediately available
-- ============================================

-- Update the handle_invitation_acceptance function to handle timing issues
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

  -- Check if auth user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_auth_user_exists;

  IF NOT v_auth_user_exists THEN
    -- User not yet in auth.users - store pending invitation data
    -- Mark the invitation with the pending user info for later processing
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
    'organization_id', v_invitation.organization_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Add columns to invitations table for pending acceptance
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS pending_user_id UUID,
ADD COLUMN IF NOT EXISTS pending_user_name TEXT;

-- Create a function to complete pending invitation on user sign in
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
BEGIN
  -- Check for pending invitation for this user
  SELECT i.*, r.name as role_name
  INTO v_invitation
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  WHERE i.pending_user_id = p_user_id
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
  LIMIT 1;

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  -- Check if user already belongs to an organization
  IF EXISTS (SELECT 1 FROM team_members WHERE auth_user_id = p_user_id) THEN
    -- Clear pending data and mark as accepted since user is already set up
    UPDATE invitations
    SET
      accepted_at = NOW(),
      pending_user_id = NULL,
      pending_user_name = NULL
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object('success', true, 'already_member', true);
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
    'organization_id', v_invitation.organization_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_pending_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pending_invitation TO anon;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
