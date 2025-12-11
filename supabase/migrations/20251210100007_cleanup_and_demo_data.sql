-- =============================================
-- Clean up orphaned test data and create demo data function
-- =============================================

-- 1. Delete all records that don't have an organization_id
-- This cleans up any test data created before the auth system

DELETE FROM project_team_members WHERE project_id IN (
  SELECT id FROM projects WHERE organization_id IS NULL
);

DELETE FROM feature_request_projects WHERE project_id IN (
  SELECT id FROM projects WHERE organization_id IS NULL
);

DELETE FROM feature_request_projects WHERE feature_request_id IN (
  SELECT id FROM feature_requests WHERE organization_id IS NULL
);

DELETE FROM tickets WHERE organization_id IS NULL;
DELETE FROM projects WHERE organization_id IS NULL;
DELETE FROM feature_requests WHERE organization_id IS NULL;
DELETE FROM feedback WHERE organization_id IS NULL;
DELETE FROM quotes WHERE organization_id IS NULL;
DELETE FROM crm_clients WHERE organization_id IS NULL;
DELETE FROM crm_leads WHERE organization_id IS NULL;

-- Also delete orphaned team members not linked to any organization
DELETE FROM team_members WHERE organization_id IS NULL;

-- 2. Create function to generate demo data for new organizations
CREATE OR REPLACE FUNCTION create_demo_data_for_org(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_ticket_id UUID;
BEGIN
  -- Create a demo project
  INSERT INTO projects (
    organization_id,
    display_id,
    name,
    description,
    status,
    priority,
    budget,
    progress
  )
  VALUES (
    p_org_id,
    'PRJ-DEMO-001',
    'Demo Project - Getting Started',
    'This is a demo project to help you understand how Soluly Business Suite works. Feel free to explore, edit, or delete this project.',
    'active',
    'medium',
    10000,
    25
  )
  RETURNING id INTO v_project_id;

  -- Create a demo ticket
  INSERT INTO tickets (
    organization_id,
    project_id,
    display_id,
    title,
    description,
    status,
    priority,
    category
  )
  VALUES (
    p_org_id,
    v_project_id,
    'TKT-DEMO-001',
    'Welcome to Soluly!',
    'This is a sample ticket showing how tickets work. You can create tickets to track tasks, bugs, and requests.',
    'open',
    'medium',
    'feature'
  );

  -- Create a demo feature request
  INSERT INTO feature_requests (
    organization_id,
    display_id,
    title,
    description,
    status,
    priority,
    customer_name,
    customer_email
  )
  VALUES (
    p_org_id,
    'FTR-DEMO-001',
    'Sample Feature Request',
    'This is an example feature request. Feature requests help you track what customers are asking for.',
    'backlog',
    'medium',
    'Demo Customer',
    'demo@example.com'
  );

  -- Link feature to project
  INSERT INTO feature_request_projects (feature_request_id, project_id)
  SELECT fr.id, v_project_id
  FROM feature_requests fr
  WHERE fr.organization_id = p_org_id AND fr.display_id = 'FTR-DEMO-001';

END;
$$;

GRANT EXECUTE ON FUNCTION create_demo_data_for_org(UUID) TO authenticated;

-- 3. Update the signup function to create demo data
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

  -- Create demo data for the new organization
  PERFORM create_demo_data_for_org(v_org_id);

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
