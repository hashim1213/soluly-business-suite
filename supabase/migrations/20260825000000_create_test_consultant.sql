-- Confirm the test consultant user's email so they can log in
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'testconsultant@soluly.com'
  AND email_confirmed_at IS NULL;

-- Add them to the first organization as a member
-- Uses the handle_new_user_signup pattern: create a team_member row
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'testconsultant@soluly.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Test user not found, skipping';
    RETURN;
  END IF;

  -- Use the existing org (cdfa4815-8e52-48e8-bac0-824a28fd2120 from earlier context)
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found, skipping';
    RETURN;
  END IF;

  -- Get a member/viewer role
  SELECT id INTO v_role_id FROM roles
    WHERE organization_id = v_org_id
    AND lower(name) IN ('member', 'viewer', 'team member')
    LIMIT 1;

  -- Fallback to any role in the org
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE organization_id = v_org_id LIMIT 1;
  END IF;

  -- Only insert if not already a member
  IF NOT EXISTS (
    SELECT 1 FROM team_members WHERE auth_user_id = v_user_id AND organization_id = v_org_id
  ) THEN
    INSERT INTO team_members (organization_id, auth_user_id, name, email, role_id, role, department, status)
    VALUES (v_org_id, v_user_id, 'Test Consultant', 'testconsultant@soluly.com', v_role_id, 'Consultant', 'Consulting', 'active');
  END IF;
END $$;
