-- =============================================
-- Fix admin delete to cascade through all related data
-- =============================================

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

    -- If this was the only member, delete the entire organization and ALL its data
    IF v_org_member_count = 1 AND v_org_id IS NOT NULL THEN
      -- Delete project-related data first (deepest level)
      DELETE FROM project_tasks WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_milestones WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_costs WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_invoices WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_contracts WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_team_members WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM project_external_members WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);
      DELETE FROM time_entries WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);

      -- Delete tickets related to projects
      DELETE FROM tickets WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);

      -- Delete feature request project associations
      DELETE FROM feature_request_projects WHERE project_id IN (SELECT id FROM projects WHERE organization_id = v_org_id);

      -- Now delete projects
      DELETE FROM projects WHERE organization_id = v_org_id;

      -- Delete CRM data
      DELETE FROM crm_activities WHERE organization_id = v_org_id;
      DELETE FROM crm_tasks WHERE organization_id = v_org_id;
      DELETE FROM contact_activities WHERE organization_id = v_org_id;
      DELETE FROM contact_custom_field_values WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = v_org_id);
      DELETE FROM contact_tags WHERE contact_id IN (SELECT id FROM contacts WHERE organization_id = v_org_id);
      DELETE FROM contacts WHERE organization_id = v_org_id;
      DELETE FROM contact_custom_fields WHERE organization_id = v_org_id;
      DELETE FROM tags WHERE organization_id = v_org_id;
      DELETE FROM client_contacts WHERE client_id IN (SELECT id FROM crm_clients WHERE organization_id = v_org_id);
      DELETE FROM crm_leads WHERE organization_id = v_org_id;
      DELETE FROM crm_clients WHERE organization_id = v_org_id;

      -- Delete quotes
      DELETE FROM quotes WHERE organization_id = v_org_id;

      -- Delete tickets (org level)
      DELETE FROM tickets WHERE organization_id = v_org_id;

      -- Delete feature requests
      DELETE FROM feature_requests WHERE organization_id = v_org_id;

      -- Delete feedback
      DELETE FROM feedback WHERE organization_id = v_org_id;

      -- Delete forms and responses
      DELETE FROM form_responses WHERE form_id IN (SELECT id FROM forms WHERE organization_id = v_org_id);
      DELETE FROM forms WHERE organization_id = v_org_id;

      -- Delete emails
      DELETE FROM emails WHERE organization_id = v_org_id;
      DELETE FROM email_accounts WHERE organization_id = v_org_id;

      -- Delete financial data
      DELETE FROM payments WHERE organization_id = v_org_id;
      DELETE FROM business_costs WHERE organization_id = v_org_id;
      DELETE FROM expense_templates WHERE organization_id = v_org_id;

      -- Delete invitations and roles
      DELETE FROM invitations WHERE organization_id = v_org_id;
      DELETE FROM roles WHERE organization_id = v_org_id;

      -- Finally delete the organization
      DELETE FROM organizations WHERE id = v_org_id;
    END IF;
  ELSE
    -- No team member, just clean up auth-related data
    DELETE FROM user_sessions WHERE user_id = v_user_id;
  END IF;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', v_user_id,
    'deleted_member_id', v_member_id,
    'deleted_org_id', CASE WHEN v_org_member_count = 1 THEN v_org_id ELSE NULL END
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Only allow service role to execute this
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_by_email(TEXT) FROM authenticated;
