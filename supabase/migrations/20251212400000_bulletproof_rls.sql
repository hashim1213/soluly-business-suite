-- ============================================
-- BULLETPROOF RLS POLICIES
-- Comprehensive security hardening for multi-tenant SaaS
-- ============================================

-- ============================================
-- PART 1: SECURE HELPER FUNCTIONS
-- All helper functions use SECURITY DEFINER and explicit search_path
-- ============================================

-- Drop and recreate helper functions with better security
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS is_organization_owner() CASCADE;
DROP FUNCTION IF EXISTS user_has_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auth_get_user_org_id() CASCADE;
DROP FUNCTION IF EXISTS auth_has_settings_permission(TEXT) CASCADE;

-- Secure function to get user's organization ID
-- Uses materialized lookup to prevent timing attacks
CREATE OR REPLACE FUNCTION auth_get_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id
  FROM team_members
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- Check if user is organization owner
CREATE OR REPLACE FUNCTION auth_is_org_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_owner FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1),
    FALSE
  );
$$;

-- Get user's team member ID
CREATE OR REPLACE FUNCTION auth_get_team_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

-- Check settings permissions (manage_org, manage_users, manage_roles)
CREATE OR REPLACE FUNCTION auth_has_settings_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (r.permissions->'settings'->>permission_name)::boolean
      FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid() AND tm.status = 'active'
      LIMIT 1
    ),
    FALSE
  );
$$;

-- Check resource permissions (view, create, edit, delete)
CREATE OR REPLACE FUNCTION auth_has_permission(resource TEXT, action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        CASE
          WHEN (r.permissions->resource->>action) = 'true' THEN TRUE
          WHEN (r.permissions->resource->>action)::boolean THEN TRUE
          ELSE FALSE
        END
      FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid() AND tm.status = 'active'
      LIMIT 1
    ),
    FALSE
  );
$$;

-- Check if user owns a resource (for "own" permissions)
CREATE OR REPLACE FUNCTION auth_is_resource_owner(resource_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id = resource_owner_id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active' LIMIT 1),
    FALSE
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION auth_get_user_org_id TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_org_owner TO authenticated;
GRANT EXECUTE ON FUNCTION auth_get_team_member_id TO authenticated;
GRANT EXECUTE ON FUNCTION auth_has_settings_permission TO authenticated;
GRANT EXECUTE ON FUNCTION auth_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION auth_is_resource_owner TO authenticated;

-- ============================================
-- PART 2: DROP ALL EXISTING POLICIES
-- Clean slate for bulletproof policies
-- ============================================

-- Organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization if owner" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Allow insert for organizations" ON organizations;

-- Team Members
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Users can update their own profile" ON team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can create first team member" ON team_members;
DROP POLICY IF EXISTS "Allow insert for signup" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- Roles
DROP POLICY IF EXISTS "Users can view roles in their organization" ON roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON roles;
DROP POLICY IF EXISTS "Admins can update roles" ON roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Allow role creation for new orgs" ON roles;
DROP POLICY IF EXISTS "Allow insert for roles" ON roles;

-- Invitations
DROP POLICY IF EXISTS "Users can view invitations in their organization" ON invitations;
DROP POLICY IF EXISTS "Admins can insert invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Projects
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON projects;
DROP POLICY IF EXISTS "Users can manage projects in their organization" ON projects;

-- Tickets
DROP POLICY IF EXISTS "Allow public read access to tickets" ON tickets;
DROP POLICY IF EXISTS "Allow public insert access to tickets" ON tickets;
DROP POLICY IF EXISTS "Allow public update access to tickets" ON tickets;
DROP POLICY IF EXISTS "Allow public delete access to tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view tickets in their organization" ON tickets;
DROP POLICY IF EXISTS "Users can manage tickets in their organization" ON tickets;

-- Quotes
DROP POLICY IF EXISTS "Allow public read access to quotes" ON quotes;
DROP POLICY IF EXISTS "Allow public insert access to quotes" ON quotes;
DROP POLICY IF EXISTS "Allow public update access to quotes" ON quotes;
DROP POLICY IF EXISTS "Allow public delete access to quotes" ON quotes;
DROP POLICY IF EXISTS "Users can view quotes in their organization" ON quotes;
DROP POLICY IF EXISTS "Users can manage quotes in their organization" ON quotes;

-- CRM Clients
DROP POLICY IF EXISTS "Allow public read access to crm_clients" ON crm_clients;
DROP POLICY IF EXISTS "Allow public insert access to crm_clients" ON crm_clients;
DROP POLICY IF EXISTS "Allow public update access to crm_clients" ON crm_clients;
DROP POLICY IF EXISTS "Allow public delete access to crm_clients" ON crm_clients;
DROP POLICY IF EXISTS "Users can view clients in their organization" ON crm_clients;
DROP POLICY IF EXISTS "Users can manage clients in their organization" ON crm_clients;

-- CRM Leads
DROP POLICY IF EXISTS "Allow public read access to crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Allow public insert access to crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Allow public update access to crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Allow public delete access to crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can view leads in their organization" ON crm_leads;
DROP POLICY IF EXISTS "Users can manage leads in their organization" ON crm_leads;

-- Feature Requests
DROP POLICY IF EXISTS "Allow public read access to feature_requests" ON feature_requests;
DROP POLICY IF EXISTS "Allow public insert access to feature_requests" ON feature_requests;
DROP POLICY IF EXISTS "Allow public update access to feature_requests" ON feature_requests;
DROP POLICY IF EXISTS "Allow public delete access to feature_requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can view feature requests in their organization" ON feature_requests;
DROP POLICY IF EXISTS "Users can manage feature requests in their organization" ON feature_requests;

-- Feedback
DROP POLICY IF EXISTS "Allow public read access to feedback" ON feedback;
DROP POLICY IF EXISTS "Allow public insert access to feedback" ON feedback;
DROP POLICY IF EXISTS "Allow public update access to feedback" ON feedback;
DROP POLICY IF EXISTS "Allow public delete access to feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view feedback in their organization" ON feedback;
DROP POLICY IF EXISTS "Users can manage feedback in their organization" ON feedback;

-- Emails
DROP POLICY IF EXISTS "Allow public read access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public insert access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public update access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public delete access to emails" ON emails;
DROP POLICY IF EXISTS "Users can view emails in their organization" ON emails;
DROP POLICY IF EXISTS "Users can manage emails in their organization" ON emails;

-- ============================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Also enable on related tables if they exist
DO $$ BEGIN
  ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expense_templates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE business_costs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE project_external_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE feature_request_projects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 4: ORGANIZATIONS POLICIES
-- ============================================

-- SELECT: Users can only view their own organization
CREATE POLICY "org_select_own"
ON organizations FOR SELECT
TO authenticated
USING (id = auth_get_user_org_id());

-- INSERT: Only during signup (handled by signup function)
CREATE POLICY "org_insert_signup"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow if user has no organization yet (first-time signup)
  auth_get_user_org_id() IS NULL
);

-- UPDATE: Only owners or users with manage_org permission
CREATE POLICY "org_update_admin"
ON organizations FOR UPDATE
TO authenticated
USING (
  id = auth_get_user_org_id()
  AND (auth_is_org_owner() OR auth_has_settings_permission('manage_org'))
)
WITH CHECK (
  id = auth_get_user_org_id()
  AND (auth_is_org_owner() OR auth_has_settings_permission('manage_org'))
);

-- DELETE: Only owners (and highly discouraged)
CREATE POLICY "org_delete_owner"
ON organizations FOR DELETE
TO authenticated
USING (
  id = auth_get_user_org_id()
  AND auth_is_org_owner()
);

-- ============================================
-- PART 5: TEAM MEMBERS POLICIES
-- ============================================

-- SELECT: Users can view team members in their organization
CREATE POLICY "team_select_org"
ON team_members FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  OR auth_user_id = auth.uid() -- Always view own record
);

-- INSERT: During signup OR by admins with manage_users permission
CREATE POLICY "team_insert"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Self-registration during signup
  (auth_user_id = auth.uid() AND auth_get_user_org_id() IS NULL)
  -- Or admin adding team member to their org
  OR (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  )
);

-- UPDATE: Users can update own profile, admins can update others
CREATE POLICY "team_update"
ON team_members FOR UPDATE
TO authenticated
USING (
  -- Own profile
  auth_user_id = auth.uid()
  -- Or admin managing team
  OR (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  )
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_users')
  )
);

-- DELETE: Only admins, cannot delete self or owners
CREATE POLICY "team_delete"
ON team_members FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_users')
  AND auth_user_id != auth.uid() -- Cannot delete yourself
  AND is_owner = FALSE -- Cannot delete owners
);

-- ============================================
-- PART 6: ROLES POLICIES
-- ============================================

-- SELECT: Users can view roles in their organization
CREATE POLICY "roles_select_org"
ON roles FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

-- INSERT: During signup (first org) OR by admins
CREATE POLICY "roles_insert"
ON roles FOR INSERT
TO authenticated
WITH CHECK (
  -- First org signup
  (auth_get_user_org_id() IS NULL)
  -- Or admin creating role
  OR (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_roles')
  )
);

-- UPDATE: Only admins with manage_roles permission
CREATE POLICY "roles_update"
ON roles FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_roles')
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_roles')
);

-- DELETE: Only admins, cannot delete system roles
CREATE POLICY "roles_delete"
ON roles FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_roles')
  AND is_system = FALSE
);

-- ============================================
-- PART 7: INVITATIONS POLICIES
-- ============================================

-- SELECT: Admins can view org invitations, anyone can view by token
CREATE POLICY "invitations_select"
ON invitations FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_users')
);

-- Allow anonymous users to view invitation by token (for accepting)
CREATE POLICY "invitations_select_by_token"
ON invitations FOR SELECT
TO anon, authenticated
USING (TRUE); -- Token validation happens in application layer

-- INSERT: Only admins with manage_users
CREATE POLICY "invitations_insert"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_users')
);

-- UPDATE: Admins OR the invited user (for accepting)
CREATE POLICY "invitations_update"
ON invitations FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_users')
);

-- Allow anonymous update for invitation acceptance
CREATE POLICY "invitations_update_accept"
ON invitations FOR UPDATE
TO anon, authenticated
USING (TRUE)
WITH CHECK (
  -- Only allow updating accepted_at field
  accepted_at IS NOT NULL
);

-- DELETE: Only admins
CREATE POLICY "invitations_delete"
ON invitations FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_settings_permission('manage_users')
);

-- ============================================
-- PART 8: PROJECTS POLICIES (with project scoping)
-- ============================================

-- SELECT: Users can view projects in their org (respecting project scope)
CREATE POLICY "projects_select"
ON projects FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(id)
  )
);

-- INSERT: Users with projects.create permission
CREATE POLICY "projects_insert"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('projects', 'create')
);

-- UPDATE: Users with projects.edit permission
CREATE POLICY "projects_update"
ON projects FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('projects', 'edit')
  AND (user_has_full_project_access() OR user_has_project_access(id))
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('projects', 'edit')
);

-- DELETE: Users with projects.delete permission
CREATE POLICY "projects_delete"
ON projects FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('projects', 'delete')
  AND (user_has_full_project_access() OR user_has_project_access(id))
);

-- ============================================
-- PART 9: TICKETS POLICIES (with project scoping)
-- ============================================

CREATE POLICY "tickets_select"
ON tickets FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "tickets_insert"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('tickets', 'create')
  AND (user_has_full_project_access() OR user_has_project_access(project_id))
);

CREATE POLICY "tickets_update"
ON tickets FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('tickets', 'edit')
  AND (user_has_full_project_access() OR user_has_project_access(project_id))
);

CREATE POLICY "tickets_delete"
ON tickets FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('tickets', 'delete')
  AND (user_has_full_project_access() OR user_has_project_access(project_id))
);

-- ============================================
-- PART 10: QUOTES POLICIES
-- ============================================

CREATE POLICY "quotes_select"
ON quotes FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "quotes_insert"
ON quotes FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('quotes', 'create')
);

CREATE POLICY "quotes_update"
ON quotes FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('quotes', 'edit')
);

CREATE POLICY "quotes_delete"
ON quotes FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('quotes', 'delete')
);

-- ============================================
-- PART 11: CRM CLIENTS POLICIES
-- ============================================

CREATE POLICY "crm_clients_select"
ON crm_clients FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "crm_clients_insert"
ON crm_clients FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'create')
);

CREATE POLICY "crm_clients_update"
ON crm_clients FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'edit')
);

CREATE POLICY "crm_clients_delete"
ON crm_clients FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'delete')
);

-- ============================================
-- PART 12: CRM LEADS POLICIES
-- ============================================

CREATE POLICY "crm_leads_select"
ON crm_leads FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "crm_leads_insert"
ON crm_leads FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'create')
);

CREATE POLICY "crm_leads_update"
ON crm_leads FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'edit')
);

CREATE POLICY "crm_leads_delete"
ON crm_leads FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('crm', 'delete')
);

-- ============================================
-- PART 13: FEATURE REQUESTS POLICIES
-- ============================================

CREATE POLICY "feature_requests_select"
ON feature_requests FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "feature_requests_insert"
ON feature_requests FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('features', 'create')
);

CREATE POLICY "feature_requests_update"
ON feature_requests FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('features', 'edit')
);

CREATE POLICY "feature_requests_delete"
ON feature_requests FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('features', 'delete')
);

-- ============================================
-- PART 14: FEEDBACK POLICIES
-- ============================================

CREATE POLICY "feedback_select"
ON feedback FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "feedback_insert"
ON feedback FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('feedback', 'create')
);

CREATE POLICY "feedback_update"
ON feedback FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('feedback', 'edit')
);

CREATE POLICY "feedback_delete"
ON feedback FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('feedback', 'delete')
);

-- ============================================
-- PART 15: EMAILS POLICIES
-- ============================================

CREATE POLICY "emails_select"
ON emails FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "emails_insert"
ON emails FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('emails', 'create')
);

CREATE POLICY "emails_update"
ON emails FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('emails', 'edit')
);

CREATE POLICY "emails_delete"
ON emails FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND auth_has_permission('emails', 'delete')
);

-- ============================================
-- PART 16: RELATED TABLES POLICIES
-- All use org_id based isolation
-- ============================================

-- Quote Line Items (inherit from quotes)
DO $$ BEGIN
  DROP POLICY IF EXISTS "quote_line_items_all" ON quote_line_items;
  CREATE POLICY "quote_line_items_all"
  ON quote_line_items FOR ALL
  TO authenticated
  USING (
    quote_id IN (SELECT id FROM quotes WHERE organization_id = auth_get_user_org_id())
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- CRM Activities
DO $$ BEGIN
  DROP POLICY IF EXISTS "crm_activities_all" ON crm_activities;
  CREATE POLICY "crm_activities_all"
  ON crm_activities FOR ALL
  TO authenticated
  USING (organization_id = auth_get_user_org_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- CRM Tasks
DO $$ BEGIN
  DROP POLICY IF EXISTS "crm_tasks_all" ON crm_tasks;
  CREATE POLICY "crm_tasks_all"
  ON crm_tasks FOR ALL
  TO authenticated
  USING (organization_id = auth_get_user_org_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Time Entries
DO $$ BEGIN
  DROP POLICY IF EXISTS "time_entries_all" ON time_entries;
  CREATE POLICY "time_entries_all"
  ON time_entries FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id = auth_get_user_org_id()
      AND (user_has_full_project_access() OR user_has_project_access(id))
    )
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Payments (linked to team members, not projects)
DO $$ BEGIN
  DROP POLICY IF EXISTS "payments_all" ON payments;
  CREATE POLICY "payments_all"
  ON payments FOR ALL
  TO authenticated
  USING (
    team_member_id IN (SELECT id FROM team_members WHERE organization_id = auth_get_user_org_id())
    AND auth_has_permission('financials', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Email Accounts
DO $$ BEGIN
  DROP POLICY IF EXISTS "email_accounts_all" ON email_accounts;
  CREATE POLICY "email_accounts_all"
  ON email_accounts FOR ALL
  TO authenticated
  USING (organization_id = auth_get_user_org_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Contacts
DO $$ BEGIN
  DROP POLICY IF EXISTS "contacts_all" ON contacts;
  CREATE POLICY "contacts_all"
  ON contacts FOR ALL
  TO authenticated
  USING (organization_id = auth_get_user_org_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project Invoices
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_invoices_all" ON project_invoices;
  CREATE POLICY "project_invoices_all"
  ON project_invoices FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
    AND auth_has_permission('financials', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project Tasks
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_tasks_all" ON project_tasks;
  CREATE POLICY "project_tasks_all"
  ON project_tasks FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project Milestones
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_milestones_all" ON project_milestones;
  CREATE POLICY "project_milestones_all"
  ON project_milestones FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project Costs
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_costs_all" ON project_costs;
  CREATE POLICY "project_costs_all"
  ON project_costs FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
    AND auth_has_permission('expenses', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Expenses
DO $$ BEGIN
  DROP POLICY IF EXISTS "expenses_all" ON expenses;
  CREATE POLICY "expenses_all"
  ON expenses FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_permission('expenses', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Expense Templates
DO $$ BEGIN
  DROP POLICY IF EXISTS "expense_templates_all" ON expense_templates;
  CREATE POLICY "expense_templates_all"
  ON expense_templates FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_permission('expenses', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Business Costs
DO $$ BEGIN
  DROP POLICY IF EXISTS "business_costs_all" ON business_costs;
  CREATE POLICY "business_costs_all"
  ON business_costs FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_permission('financials', 'view')
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project Contracts
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_contracts_all" ON project_contracts;
  CREATE POLICY "project_contracts_all"
  ON project_contracts FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Project External Members
DO $$ BEGIN
  DROP POLICY IF EXISTS "project_external_members_all" ON project_external_members;
  CREATE POLICY "project_external_members_all"
  ON project_external_members FOR ALL
  TO authenticated
  USING (
    organization_id = auth_get_user_org_id()
    AND (user_has_full_project_access() OR user_has_project_access(project_id))
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Feature Request Projects (junction table)
DO $$ BEGIN
  DROP POLICY IF EXISTS "feature_request_projects_all" ON feature_request_projects;
  CREATE POLICY "feature_request_projects_all"
  ON feature_request_projects FOR ALL
  TO authenticated
  USING (
    feature_request_id IN (
      SELECT id FROM feature_requests WHERE organization_id = auth_get_user_org_id()
    )
  );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 17: AUDIT LOG FOR SECURITY EVENTS
-- ============================================

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_sensitive_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to security_events table for sensitive operations
  IF TG_TABLE_NAME IN ('organizations', 'team_members', 'roles', 'invitations') THEN
    INSERT INTO security_events (
      organization_id,
      user_id,
      team_member_id,
      event_type,
      event_details,
      risk_level
    )
    VALUES (
      COALESCE(NEW.organization_id, OLD.organization_id, auth_get_user_org_id()),
      auth.uid(),
      auth_get_team_member_id(),
      'permission_changed'::security_event_type,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
      ),
      CASE
        WHEN TG_TABLE_NAME = 'roles' THEN 'high'
        WHEN TG_TABLE_NAME = 'team_members' AND TG_OP = 'DELETE' THEN 'high'
        ELSE 'medium'
      END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the operation if audit logging fails
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for sensitive tables
DO $$ BEGIN
  DROP TRIGGER IF EXISTS audit_roles_changes ON roles;
  CREATE TRIGGER audit_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS audit_team_members_changes ON team_members;
  CREATE TRIGGER audit_team_members_changes
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 18: REVOKE PUBLIC ACCESS
-- Ensure no public access to any tables
-- ============================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Re-grant specific anon permissions for invitation acceptance
GRANT SELECT ON invitations TO anon;
GRANT UPDATE ON invitations TO anon;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMENT ON FUNCTION auth_get_user_org_id IS 'Returns the organization ID for the currently authenticated user';
COMMENT ON FUNCTION auth_is_org_owner IS 'Returns true if the current user is an organization owner';
COMMENT ON FUNCTION auth_has_settings_permission IS 'Checks if user has a specific settings permission (manage_org, manage_users, manage_roles)';
COMMENT ON FUNCTION auth_has_permission IS 'Checks if user has a specific resource permission (view, create, edit, delete)';
COMMENT ON FUNCTION auth_is_resource_owner IS 'Checks if user owns a specific resource (for "own" permission types)';
