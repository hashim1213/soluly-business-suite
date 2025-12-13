-- ============================================
-- SECURITY AND PERFORMANCE FIXES
-- ============================================
-- This migration fixes:
-- 1. Functions with mutable search_path (security vulnerability)
-- 2. RLS policies that re-evaluate auth functions per row (performance issue)
-- ============================================

-- ============================================
-- 1. FIX TRIGGER FUNCTIONS WITH MUTABLE SEARCH_PATH
-- Add SET search_path = public to prevent search_path attacks
-- ============================================

-- Fix set_time_entry_organization_id
CREATE OR REPLACE FUNCTION public.set_time_entry_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.team_members
    WHERE id = NEW.team_member_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_payment_organization_id
CREATE OR REPLACE FUNCTION public.set_payment_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.team_members
    WHERE id = NEW.team_member_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_quote_line_item_organization_id
CREATE OR REPLACE FUNCTION public.set_quote_line_item_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.quotes
    WHERE id = NEW.quote_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_project_team_member_organization_id
CREATE OR REPLACE FUNCTION public.set_project_team_member_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_feature_request_project_organization_id
CREATE OR REPLACE FUNCTION public.set_feature_request_project_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.feature_requests
    WHERE id = NEW.feature_request_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_client_contact_organization_id
CREATE OR REPLACE FUNCTION public.set_client_contact_organization_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.crm_clients
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. DROP AND RECREATE RLS POLICIES WITH OPTIMIZED AUTH FUNCTION CALLS
-- Using (SELECT auth_function()) pattern to avoid per-row re-evaluation
-- ============================================

-- =============================================
-- 2.1 FIX MULTI-ORG RLS POLICIES (from 20251212600000)
-- =============================================

DROP POLICY IF EXISTS "team_select_multi_org" ON team_members;
CREATE POLICY "team_select_multi_org"
ON team_members FOR SELECT
TO authenticated
USING (
  auth_user_id = (SELECT auth.uid())
  OR organization_id = (SELECT auth_get_user_org_id())
);

DROP POLICY IF EXISTS "org_select_multi_org" ON organizations;
CREATE POLICY "org_select_multi_org"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM team_members
    WHERE auth_user_id = (SELECT auth.uid())
    AND status = 'active'
  )
);

DROP POLICY IF EXISTS "roles_select_multi_org" ON roles;
CREATE POLICY "roles_select_multi_org"
ON roles FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM team_members
    WHERE auth_user_id = (SELECT auth.uid())
    AND status = 'active'
  )
);

-- =============================================
-- 2.2 FIX TIME_ENTRIES RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "time_entries_select_org" ON time_entries;
DROP POLICY IF EXISTS "time_entries_insert_org" ON time_entries;
DROP POLICY IF EXISTS "time_entries_update_org" ON time_entries;
DROP POLICY IF EXISTS "time_entries_delete_org" ON time_entries;
DROP POLICY IF EXISTS "Allow public read time_entries" ON time_entries;
DROP POLICY IF EXISTS "Allow public insert time_entries" ON time_entries;
DROP POLICY IF EXISTS "Allow public update time_entries" ON time_entries;
DROP POLICY IF EXISTS "Allow public delete time_entries" ON time_entries;

CREATE POLICY "time_entries_select_org"
ON time_entries FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (project_id IS NOT NULL AND user_has_project_access(project_id))
    OR team_member_id = (SELECT auth_get_team_member_id())
  )
);

CREATE POLICY "time_entries_insert_org"
ON time_entries FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (project_id IS NOT NULL AND user_has_project_access(project_id))
  )
);

CREATE POLICY "time_entries_update_org"
ON time_entries FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    team_member_id = (SELECT auth_get_team_member_id())
    OR (SELECT user_has_full_project_access())
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "time_entries_delete_org"
ON time_entries FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    team_member_id = (SELECT auth_get_team_member_id())
    OR (SELECT user_has_full_project_access())
  )
);

-- =============================================
-- 2.3 FIX PAYMENTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "payments_select_org" ON payments;
DROP POLICY IF EXISTS "payments_insert_org" ON payments;
DROP POLICY IF EXISTS "payments_update_org" ON payments;
DROP POLICY IF EXISTS "payments_delete_org" ON payments;
DROP POLICY IF EXISTS "Allow public read payments" ON payments;
DROP POLICY IF EXISTS "Allow public insert payments" ON payments;
DROP POLICY IF EXISTS "Allow public update payments" ON payments;
DROP POLICY IF EXISTS "Allow public delete payments" ON payments;

CREATE POLICY "payments_select_org"
ON payments FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR team_member_id = (SELECT auth_get_team_member_id())
  )
);

CREATE POLICY "payments_insert_org"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'create'))
  )
);

CREATE POLICY "payments_update_org"
ON payments FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'edit'))
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "payments_delete_org"
ON payments FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'delete'))
  )
);

-- =============================================
-- 2.4 FIX QUOTE_LINE_ITEMS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "quote_line_items_select_org" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_insert_org" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_update_org" ON quote_line_items;
DROP POLICY IF EXISTS "quote_line_items_delete_org" ON quote_line_items;
DROP POLICY IF EXISTS "Allow public read quote_line_items" ON quote_line_items;
DROP POLICY IF EXISTS "Allow public insert quote_line_items" ON quote_line_items;
DROP POLICY IF EXISTS "Allow public update quote_line_items" ON quote_line_items;
DROP POLICY IF EXISTS "Allow public delete quote_line_items" ON quote_line_items;

CREATE POLICY "quote_line_items_select_org"
ON quote_line_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = (SELECT auth_get_user_org_id())
  )
);

CREATE POLICY "quote_line_items_insert_org"
ON quote_line_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = (SELECT auth_get_user_org_id())
  )
);

CREATE POLICY "quote_line_items_update_org"
ON quote_line_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = (SELECT auth_get_user_org_id())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = (SELECT auth_get_user_org_id())
  )
);

CREATE POLICY "quote_line_items_delete_org"
ON quote_line_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.id = quote_line_items.quote_id
    AND q.organization_id = (SELECT auth_get_user_org_id())
  )
);

-- =============================================
-- 2.5 FIX PROJECT_TEAM_MEMBERS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_team_members_select_org" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_insert_org" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_update_org" ON project_team_members;
DROP POLICY IF EXISTS "project_team_members_delete_org" ON project_team_members;

CREATE POLICY "project_team_members_select_org"
ON project_team_members FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_team_members_insert_org"
ON project_team_members FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_team_members_update_org"
ON project_team_members FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_team_members_delete_org"
ON project_team_members FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
);

-- =============================================
-- 2.6 FIX CLIENT_CONTACTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "client_contacts_select_org" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_insert_org" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_update_org" ON client_contacts;
DROP POLICY IF EXISTS "client_contacts_delete_org" ON client_contacts;

CREATE POLICY "client_contacts_select_org"
ON client_contacts FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "client_contacts_insert_org"
ON client_contacts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "client_contacts_update_org"
ON client_contacts FOR UPDATE
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()))
WITH CHECK (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "client_contacts_delete_org"
ON client_contacts FOR DELETE
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()));

-- =============================================
-- 2.7 FIX PROJECT_EXTERNAL_MEMBERS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_external_members_select_org" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_insert_org" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_update_org" ON project_external_members;
DROP POLICY IF EXISTS "project_external_members_delete_org" ON project_external_members;

CREATE POLICY "project_external_members_select_org"
ON project_external_members FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_external_members_insert_org"
ON project_external_members FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_external_members_update_org"
ON project_external_members FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_external_members_delete_org"
ON project_external_members FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

-- =============================================
-- 2.8 FIX PROJECT_CONTRACTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_contracts_select_org" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_insert_org" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_update_org" ON project_contracts;
DROP POLICY IF EXISTS "project_contracts_delete_org" ON project_contracts;

CREATE POLICY "project_contracts_select_org"
ON project_contracts FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_contracts_insert_org"
ON project_contracts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_contracts_update_org"
ON project_contracts FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_contracts_delete_org"
ON project_contracts FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
);

-- =============================================
-- 2.9 FIX PROJECT_TASKS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_tasks_select_org" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_insert_org" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_update_org" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_delete_org" ON project_tasks;

CREATE POLICY "project_tasks_select_org"
ON project_tasks FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_tasks_insert_org"
ON project_tasks FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_tasks_update_org"
ON project_tasks FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
    OR assignee_id = (SELECT auth_get_team_member_id())
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_tasks_delete_org"
ON project_tasks FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

-- =============================================
-- 2.10 FIX PROJECT_MILESTONES RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_milestones_select_org" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_insert_org" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_update_org" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_delete_org" ON project_milestones;

CREATE POLICY "project_milestones_select_org"
ON project_milestones FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_milestones_insert_org"
ON project_milestones FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_milestones_update_org"
ON project_milestones FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_milestones_delete_org"
ON project_milestones FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
);

-- =============================================
-- 2.11 FIX PROJECT_COSTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_costs_select_org" ON project_costs;
DROP POLICY IF EXISTS "project_costs_insert_org" ON project_costs;
DROP POLICY IF EXISTS "project_costs_update_org" ON project_costs;
DROP POLICY IF EXISTS "project_costs_delete_org" ON project_costs;

CREATE POLICY "project_costs_select_org"
ON project_costs FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_costs_insert_org"
ON project_costs FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_costs_update_org"
ON project_costs FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_costs_delete_org"
ON project_costs FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
);

-- =============================================
-- 2.12 FIX PROJECT_INVOICES RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "project_invoices_select_org" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_insert_org" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_update_org" ON project_invoices;
DROP POLICY IF EXISTS "project_invoices_delete_org" ON project_invoices;

CREATE POLICY "project_invoices_select_org"
ON project_invoices FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_invoices_insert_org"
ON project_invoices FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
);

CREATE POLICY "project_invoices_update_org"
ON project_invoices FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR user_has_project_access(project_id)
  )
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

CREATE POLICY "project_invoices_delete_org"
ON project_invoices FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (SELECT user_has_full_project_access())
);

-- =============================================
-- 2.13 FIX BUSINESS_COSTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "business_costs_select_org" ON business_costs;
DROP POLICY IF EXISTS "business_costs_insert_org" ON business_costs;
DROP POLICY IF EXISTS "business_costs_update_org" ON business_costs;
DROP POLICY IF EXISTS "business_costs_delete_org" ON business_costs;

CREATE POLICY "business_costs_select_org"
ON business_costs FOR SELECT
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "business_costs_insert_org"
ON business_costs FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'create'))
  )
);

CREATE POLICY "business_costs_update_org"
ON business_costs FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'edit'))
  )
)
WITH CHECK (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "business_costs_delete_org"
ON business_costs FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    (SELECT user_has_full_project_access())
    OR (SELECT auth_has_permission('financials', 'delete'))
  )
);

-- =============================================
-- 2.14 FIX EXPENSE_TEMPLATES RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "expense_templates_select_org" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_insert_org" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_update_org" ON expense_templates;
DROP POLICY IF EXISTS "expense_templates_delete_org" ON expense_templates;

CREATE POLICY "expense_templates_select_org"
ON expense_templates FOR SELECT
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "expense_templates_insert_org"
ON expense_templates FOR INSERT
TO authenticated
WITH CHECK (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "expense_templates_update_org"
ON expense_templates FOR UPDATE
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()))
WITH CHECK (organization_id = (SELECT auth_get_user_org_id()));

CREATE POLICY "expense_templates_delete_org"
ON expense_templates FOR DELETE
TO authenticated
USING (organization_id = (SELECT auth_get_user_org_id()));

-- =============================================
-- 2.15 FIX FEATURE_REQUEST_PROJECTS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "feature_request_projects_select_org" ON feature_request_projects;
DROP POLICY IF EXISTS "feature_request_projects_insert_org" ON feature_request_projects;
DROP POLICY IF EXISTS "feature_request_projects_delete_org" ON feature_request_projects;

CREATE POLICY "feature_request_projects_select_org"
ON feature_request_projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = (SELECT auth_get_user_org_id())
  )
);

CREATE POLICY "feature_request_projects_insert_org"
ON feature_request_projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = (SELECT auth_get_user_org_id())
  )
);

CREATE POLICY "feature_request_projects_delete_org"
ON feature_request_projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM feature_requests fr
    WHERE fr.id = feature_request_projects.feature_request_id
    AND fr.organization_id = (SELECT auth_get_user_org_id())
  )
);

-- =============================================
-- 2.16 FIX INVITATIONS RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "invitations_select_by_token_secure" ON invitations;
DROP POLICY IF EXISTS "invitations_update_accept_secure" ON invitations;

CREATE POLICY "invitations_select_by_token_secure"
ON invitations FOR SELECT
TO anon, authenticated
USING (
  (
    organization_id = (SELECT auth_get_user_org_id())
    AND (SELECT auth_has_permission('team', 'view'))
  )
  OR (
    accepted_at IS NULL
    AND expires_at > NOW()
  )
);

CREATE POLICY "invitations_update_accept_secure"
ON invitations FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  AND accepted_at IS NULL
  AND expires_at > NOW()
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
