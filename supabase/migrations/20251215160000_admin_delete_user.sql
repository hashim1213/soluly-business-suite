-- =============================================
-- Admin function to delete users
-- This bypasses foreign key issues by cleaning up related data first
-- =============================================

-- Function to delete a user by email (for admin use)
CREATE OR REPLACE FUNCTION public.admin_delete_user_by_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_member_id UUID;
  v_org_id UUID;
  v_org_member_count INT;
BEGIN
  -- Find the auth user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(p_email);

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Find team member
  SELECT id, organization_id INTO v_member_id, v_org_id
  FROM team_members
  WHERE auth_user_id = v_user_id;

  -- If member exists, handle cleanup
  IF v_member_id IS NOT NULL THEN
    -- Check if this is the only member in the org
    SELECT COUNT(*) INTO v_org_member_count
    FROM team_members
    WHERE organization_id = v_org_id;

    -- Delete related data for this member
    DELETE FROM notifications WHERE recipient_id = v_member_id;
    DELETE FROM user_sessions WHERE user_id = v_user_id;

    -- Delete the team member
    DELETE FROM team_members WHERE id = v_member_id;

    -- If this was the only member, delete the entire organization and its data
    IF v_org_member_count = 1 THEN
      -- Delete org-related data (cascade should handle most, but be explicit)
      DELETE FROM invitations WHERE organization_id = v_org_id;
      DELETE FROM roles WHERE organization_id = v_org_id;
      DELETE FROM organizations WHERE id = v_org_id;
    END IF;
  END IF;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', v_user_id,
    'deleted_member_id', v_member_id,
    'deleted_org_id', CASE WHEN v_org_member_count = 1 THEN v_org_id ELSE NULL END
  );
END;
$$;

-- Only allow service role to execute this (not exposed to clients)
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM authenticated;

-- Function to delete orphaned users (users with no team_member record)
CREATE OR REPLACE FUNCTION public.admin_cleanup_orphaned_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INT := 0;
  v_user RECORD;
BEGIN
  -- Find and delete orphaned users
  FOR v_user IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN team_members tm ON tm.auth_user_id = au.id
    WHERE tm.id IS NULL
  LOOP
    -- Clean up any sessions
    DELETE FROM user_sessions WHERE user_id = v_user.id;

    -- Delete the auth user
    DELETE FROM auth.users WHERE id = v_user.id;

    v_deleted_count := v_deleted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count
  );
END;
$$;

-- Only allow service role to execute this
REVOKE EXECUTE ON FUNCTION public.admin_cleanup_orphaned_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_cleanup_orphaned_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_cleanup_orphaned_users() FROM authenticated;
