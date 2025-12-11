-- =============================================
-- Fix demo data function - use correct feature_requests columns
-- The table has: client_name, requested_by (not customer_name, customer_email)
-- =============================================

CREATE OR REPLACE FUNCTION create_demo_data_for_org(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Create a demo project with correct column names
  INSERT INTO projects (
    organization_id,
    display_id,
    name,
    client_name,
    description,
    status,
    value,
    progress,
    start_date
  )
  VALUES (
    p_org_id,
    'PRJ-DEMO-001',
    'Demo Project - Getting Started',
    'Demo Client',
    'This is a demo project to help you understand how Soluly Business Suite works. Feel free to explore, edit, or delete this project.',
    'active',
    10000,
    25,
    NOW()
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

  -- Create a demo feature request with CORRECT column names
  -- Table has: client_name, requested_by (NOT customer_name, customer_email)
  INSERT INTO feature_requests (
    organization_id,
    display_id,
    title,
    description,
    status,
    priority,
    client_name,
    requested_by
  )
  VALUES (
    p_org_id,
    'FTR-DEMO-001',
    'Sample Feature Request',
    'This is an example feature request. Feature requests help you track what customers are asking for.',
    'backlog',
    'medium',
    'Demo Client',
    'Demo User'
  );

  -- Link feature to project
  INSERT INTO feature_request_projects (feature_request_id, project_id)
  SELECT fr.id, v_project_id
  FROM feature_requests fr
  WHERE fr.organization_id = p_org_id AND fr.display_id = 'FTR-DEMO-001';

END;
$$;
