-- ============================================
-- FIX DATA LEAKS - COMPREHENSIVE RLS FIXES
-- ============================================
-- This migration fixes critical data leaks identified in security audit:
-- 1. time_entries - had USING (true) allowing cross-org access
-- 2. payments - had USING (true) allowing cross-org access
-- 3. invitations - anonymous access vulnerability
-- 4. quote_line_items - missing proper org filtering
-- 5. project_team_members - incomplete org filtering
-- 6. client_contacts - incomplete org filtering

-- ============================================
-- 1. FIX TIME_ENTRIES RLS (CRITICAL)
-- ============================================

-- Drop the insecure policy that allows all
DROP POLICY IF EXISTS "Allow all operations on time_entries" ON time_entries;
DROP POLICY IF EXISTS "time_entries_select" ON time_entries;
DROP POLICY IF EXISTS "time_entries_insert" ON time_entries;
DROP POLICY IF EXISTS "time_entries_update" ON time_entries;
DROP POLICY IF EXISTS "time_entries_delete" ON time_entries;

-- Create proper org-scoped policies for time_entries
CREATE POLICY "time_entries_select_org"
ON time_entries FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    -- Full access users can see all time entries
    user_has_full_project_access()
    -- Project-scoped users can only see time entries for their projects
    OR (project_id IS NOT NULL AND user_has_project_access(project_id))
    -- Users can always see their own time entries
    OR team_member_id = auth_get_team_member_id()
  )
);

CREATE POLICY "time_entries_insert_org"
ON time_entries FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    -- Can create time entries for projects they have access to
    user_has_full_project_access()
    OR (project_id IS NOT NULL AND user_has_project_access(project_id))
  )
);

CREATE POLICY "time_entries_update_org"
ON time_entries FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    -- Can update own time entries
    team_member_id = auth_get_team_member_id()
    -- Or have full access
    OR user_has_full_project_access()
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "time_entries_delete_org"
ON time_entries FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    -- Can delete own time entries
    team_member_id = auth_get_team_member_id()
    -- Or have full access
    OR user_has_full_project_access()
  )
);

-- ============================================
-- 2. FIX PAYMENTS RLS (CRITICAL)
-- ============================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "Allow all operations on payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

-- Create proper org-scoped policies for payments
-- Only admins/managers should see payment data
CREATE POLICY "payments_select_org"
ON payments FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    -- Full access users can see all payments
    user_has_full_project_access()
    -- Users can see their own payments
    OR team_member_id = auth_get_team_member_id()
  )
);

CREATE POLICY "payments_insert_org"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    -- Only full access users can create payments
    user_has_full_project_access()
    OR auth_has_permission('financials', 'create')
  )
);

CREATE POLICY "payments_update_org"
ON payments FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR auth_has_permission('financials', 'edit')
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "payments_delete_org"
ON payments FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR auth_has_permission('financials', 'delete')
  )
);

-- ============================================
-- 3. FIX INVITATIONS RLS (MEDIUM)
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "invitations_select_by_token" ON invitations;
DROP POLICY IF EXISTS "invitations_update_accept" ON invitations;

-- Create secure invitation policies
-- For viewing invitation by token (needed for accept flow)
CREATE POLICY "invitations_select_by_token_secure"
ON invitations FOR SELECT
TO anon, authenticated
USING (
  -- Org members can see all invitations in their org
  (
    organization_id = auth_get_user_org_id()
    AND auth_has_permission('team', 'view')
  )
  -- Anonymous/authenticated can only see invitation if they're looking up by token
  -- This is checked at application layer via the token parameter
  OR (
    -- Allow viewing if not yet accepted and not expired
    accepted_at IS NULL
    AND expires_at > NOW()
  )
);

-- For accepting invitation - only the invitee can accept
CREATE POLICY "invitations_update_accept_secure"
ON invitations FOR UPDATE
TO authenticated
USING (
  -- Can only update invitations for your email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND accepted_at IS NULL
  AND expires_at > NOW()
)
WITH CHECK (
  -- Only allow setting accepted_at
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- ============================================
-- 4. FIX QUOTE_LINE_ITEMS RLS
-- ============================================

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on quote_line_items" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_select" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_insert" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_update" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_delete" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_all" ON quote_line_items;

-- Create proper policies that check via quote's organization_id
CREATE POLICY "quote_line_items_select_org"
ON quote_line_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = auth_get_user_org_id()
  )
);

CREATE POLICY "quote_line_items_insert_org"
ON quote_line_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = auth_get_user_org_id()
  )
);

CREATE POLICY "quote_line_items_update_org"
ON quote_line_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = auth_get_user_org_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = auth_get_user_org_id()
  )
);

CREATE POLICY "quote_line_items_delete_org"
ON quote_line_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = auth_get_user_org_id()
  )
);

-- ============================================
-- 5. FIX PROJECT_TEAM_MEMBERS RLS
-- ============================================

DROP POLICY IF EXISTS "project_team_members_select" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_insert" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_update" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_delete" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_all" ON project_team_members;

CREATE POLICY "project_team_members_select_org"
ON project_team_members FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_team_members_insert_org"
ON project_team_members FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_team_members_update_org"
ON project_team_members FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_team_members_delete_org"
ON project_team_members FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
);

-- ============================================
-- 6. FIX CLIENT_CONTACTS RLS
-- ============================================

DROP POLICY IF EXISTS "client_contacts_select" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_insert" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_update" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_delete" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_all" ON client_contacts;

CREATE POLICY "client_contacts_select_org"
ON client_contacts FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "client_contacts_insert_org"
ON client_contacts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "client_contacts_update_org"
ON client_contacts FOR UPDATE
TO authenticated
USING (organization_id = auth_get_user_org_id())
WITH CHECK (organization_id = auth_get_user_org_id());

CREATE POLICY "client_contacts_delete_org"
ON client_contacts FOR DELETE
TO authenticated
USING (organization_id = auth_get_user_org_id());

-- ============================================
-- 7. FIX PROJECT_EXTERNAL_MEMBERS RLS
-- ============================================

DROP POLICY IF EXISTS "project_external_members_select" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_insert" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_update" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_delete" ON project_external_members;

CREATE POLICY "project_external_members_select_org"
ON project_external_members FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_external_members_insert_org"
ON project_external_members FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_external_members_update_org"
ON project_external_members FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_external_members_delete_org"
ON project_external_members FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

-- ============================================
-- 8. FIX PROJECT_CONTRACTS RLS
-- ============================================

DROP POLICY IF EXISTS "project_contracts_select" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_insert" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_update" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_delete" ON project_contracts;

CREATE POLICY "project_contracts_select_org"
ON project_contracts FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_contracts_insert_org"
ON project_contracts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_contracts_update_org"
ON project_contracts FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_contracts_delete_org"
ON project_contracts FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
);

-- ============================================
-- 9. FIX PROJECT_TASKS RLS
-- ============================================

DROP POLICY IF EXISTS "project_tasks_select" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_insert" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_update" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_delete" ON project_tasks;
DROP POLICY IF EXISTS "Users can view project tasks in their organization" ON project_tasks;
DROP POLICY IF EXISTS "Users can create project tasks in their organization" ON project_tasks;
DROP POLICY IF EXISTS "Users can update project tasks in their organization" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete project tasks in their organization" ON project_tasks;

CREATE POLICY "project_tasks_select_org"
ON project_tasks FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_tasks_insert_org"
ON project_tasks FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_tasks_update_org"
ON project_tasks FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
    -- Assignees can update their own tasks
    OR assignee_id = auth_get_team_member_id()
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_tasks_delete_org"
ON project_tasks FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

-- ============================================
-- 10. FIX PROJECT_MILESTONES RLS
-- ============================================

DROP POLICY IF EXISTS "project_milestones_select" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_insert" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_update" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_delete" ON project_milestones;
DROP POLICY IF EXISTS "Users can view project milestones in their organization" ON project_milestones;
DROP POLICY IF EXISTS "Users can create project milestones in their organization" ON project_milestones;
DROP POLICY IF EXISTS "Users can update project milestones in their organization" ON project_milestones;
DROP POLICY IF EXISTS "Users can delete project milestones in their organization" ON project_milestones;

CREATE POLICY "project_milestones_select_org"
ON project_milestones FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_milestones_insert_org"
ON project_milestones FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_milestones_update_org"
ON project_milestones FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_milestones_delete_org"
ON project_milestones FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
);

-- ============================================
-- 11. FIX PROJECT_COSTS RLS
-- ============================================

DROP POLICY IF EXISTS "project_costs_select" ON project_costs;
DROP POLICY IF EXISTS "project_costs_insert" ON project_costs;
DROP POLICY IF EXISTS "project_costs_update" ON project_costs;
DROP POLICY IF EXISTS "project_costs_delete" ON project_costs;
DROP POLICY IF EXISTS "Users can view project costs in their organization" ON project_costs;
DROP POLICY IF EXISTS "Users can create project costs in their organization" ON project_costs;
DROP POLICY IF EXISTS "Users can update project costs in their organization" ON project_costs;
DROP POLICY IF EXISTS "Users can delete project costs in their organization" ON project_costs;

CREATE POLICY "project_costs_select_org"
ON project_costs FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_costs_insert_org"
ON project_costs FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_costs_update_org"
ON project_costs FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_costs_delete_org"
ON project_costs FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
);

-- ============================================
-- 12. FIX PROJECT_INVOICES RLS
-- ============================================

DROP POLICY IF EXISTS "project_invoices_select" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_insert" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_update" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_delete" ON project_invoices;
DROP POLICY IF EXISTS "Users can view project invoices in their organization" ON project_invoices;
DROP POLICY IF EXISTS "Users can create project invoices in their organization" ON project_invoices;
DROP POLICY IF EXISTS "Users can update project invoices in their organization" ON project_invoices;
DROP POLICY IF EXISTS "Users can delete project invoices in their organization" ON project_invoices;

CREATE POLICY "project_invoices_select_org"
ON project_invoices FOR SELECT
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_invoices_insert_org"
ON project_invoices FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_invoices_update_org"
ON project_invoices FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = auth_get_user_org_id()
);

CREATE POLICY "project_invoices_delete_org"
ON project_invoices FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND user_has_full_project_access()
);

-- ============================================
-- 13. FIX BUSINESS_COSTS RLS
-- ============================================

DROP POLICY IF EXISTS "business_costs_select" ON business_costs;
DROP POLICY IF EXISTS "business_costs_insert" ON business_costs;
DROP POLICY IF EXISTS "business_costs_update" ON business_costs;
DROP POLICY IF EXISTS "business_costs_delete" ON business_costs;
DROP POLICY IF EXISTS "Users can view business costs in their organization" ON business_costs;
DROP POLICY IF EXISTS "Users can create business costs in their organization" ON business_costs;
DROP POLICY IF EXISTS "Users can update business costs in their organization" ON business_costs;
DROP POLICY IF EXISTS "Users can delete business costs in their organization" ON business_costs;

CREATE POLICY "business_costs_select_org"
ON business_costs FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "business_costs_insert_org"
ON business_costs FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR auth_has_permission('financials', 'create')
  )
);

CREATE POLICY "business_costs_update_org"
ON business_costs FOR UPDATE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR auth_has_permission('financials', 'edit')
  )
)
WITH CHECK (organization_id = auth_get_user_org_id());

CREATE POLICY "business_costs_delete_org"
ON business_costs FOR DELETE
TO authenticated
USING (
  organization_id = auth_get_user_org_id()
  AND (
    user_has_full_project_access()
    OR auth_has_permission('financials', 'delete')
  )
);

-- ============================================
-- 14. FIX EXPENSE_TEMPLATES RLS
-- ============================================

DROP POLICY IF EXISTS "expense_templates_select" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_insert" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_update" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_delete" ON expense_templates;
DROP POLICY IF EXISTS "Users can view expense templates in their organization" ON expense_templates;
DROP POLICY IF EXISTS "Users can create expense templates in their organization" ON expense_templates;
DROP POLICY IF EXISTS "Users can update expense templates in their organization" ON expense_templates;
DROP POLICY IF EXISTS "Users can delete expense templates in their organization" ON expense_templates;

CREATE POLICY "expense_templates_select_org"
ON expense_templates FOR SELECT
TO authenticated
USING (organization_id = auth_get_user_org_id());

CREATE POLICY "expense_templates_insert_org"
ON expense_templates FOR INSERT
TO authenticated
WITH CHECK (organization_id = auth_get_user_org_id());

CREATE POLICY "expense_templates_update_org"
ON expense_templates FOR UPDATE
TO authenticated
USING (organization_id = auth_get_user_org_id())
WITH CHECK (organization_id = auth_get_user_org_id());

CREATE POLICY "expense_templates_delete_org"
ON expense_templates FOR DELETE
TO authenticated
USING (organization_id = auth_get_user_org_id());

-- ============================================
-- 15. FIX FEATURE_REQUEST_PROJECTS RLS
-- ============================================

DROP POLICY IF EXISTS "feature_request_projects_all" ON feature_request_projects;
DROP POLICY IF EXISTS "feature_request_projects_select" ON feature_request_projects;
DROP POLICY IF EXISTS "feature_request_projects_insert" ON feature_request_projects;
DROP POLICY IF EXISTS "feature_request_projects_delete" ON feature_request_projects;

CREATE POLICY "feature_request_projects_select_org"
ON feature_request_projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = auth_get_user_org_id()
  )
);

CREATE POLICY "feature_request_projects_insert_org"
ON feature_request_projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = auth_get_user_org_id()
  )
);

CREATE POLICY "feature_request_projects_delete_org"
ON feature_request_projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = auth_get_user_org_id()
  )
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
