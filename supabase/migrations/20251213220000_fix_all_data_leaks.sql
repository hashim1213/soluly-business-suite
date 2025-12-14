-- =============================================
-- COMPREHENSIVE DATA LEAK FIX MIGRATION
-- Fixes project-scoped access control for:
-- 1. feedback table
-- 2. feature_requests table
-- 3. quotes table
-- 4. crm_clients table
-- 5. crm_leads table
-- =============================================

-- =============================================
-- 1. FIX FEEDBACK TABLE RLS
-- =============================================

-- Drop existing feedback policies
DROP POLICY IF EXISTS "feedback_select" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update" ON public.feedback;
DROP POLICY IF EXISTS "feedback_delete" ON public.feedback;

-- Create new feedback policies with project access control
CREATE POLICY "feedback_select" ON public.feedback
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (
            (SELECT public.user_has_full_project_access())
            OR project_id IS NULL  -- Org-level feedback (no project)
            OR (SELECT public.user_has_project_access(project_id))
        )
    );

CREATE POLICY "feedback_insert" ON public.feedback
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('feedback', 'create'))
        AND (
            (SELECT public.user_has_full_project_access())
            OR project_id IS NULL
            OR (SELECT public.user_has_project_access(project_id))
        )
    );

CREATE POLICY "feedback_update" ON public.feedback
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('feedback', 'edit'))
        AND (
            (SELECT public.user_has_full_project_access())
            OR project_id IS NULL
            OR (SELECT public.user_has_project_access(project_id))
        )
    );

CREATE POLICY "feedback_delete" ON public.feedback
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('feedback', 'delete'))
        AND (
            (SELECT public.user_has_full_project_access())
            OR project_id IS NULL
            OR (SELECT public.user_has_project_access(project_id))
        )
    );

-- =============================================
-- 2. FIX FEATURE_REQUESTS TABLE RLS
-- Feature requests can be linked to multiple projects via feature_request_projects
-- =============================================

-- Drop existing feature_requests policies
DROP POLICY IF EXISTS "feature_requests_select" ON public.feature_requests;
DROP POLICY IF EXISTS "feature_requests_insert" ON public.feature_requests;
DROP POLICY IF EXISTS "feature_requests_update" ON public.feature_requests;
DROP POLICY IF EXISTS "feature_requests_delete" ON public.feature_requests;

-- Helper function to check if user has access to a feature request
CREATE OR REPLACE FUNCTION public.user_has_feature_request_access(feature_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        -- Full project access = can see all
        public.user_has_full_project_access()
        OR
        -- Feature request has no project links = org-level, everyone can see
        NOT EXISTS (
            SELECT 1 FROM feature_request_projects frp
            WHERE frp.feature_request_id = $1
        )
        OR
        -- Feature request is linked to at least one project user has access to
        EXISTS (
            SELECT 1 FROM feature_request_projects frp
            WHERE frp.feature_request_id = $1
            AND public.user_has_project_access(frp.project_id)
        );
$$;

-- Create new feature_requests policies with project access control
CREATE POLICY "feature_requests_select" ON public.feature_requests
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.user_has_feature_request_access(id))
    );

CREATE POLICY "feature_requests_insert" ON public.feature_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('features', 'create'))
    );

CREATE POLICY "feature_requests_update" ON public.feature_requests
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('features', 'edit'))
    );

CREATE POLICY "feature_requests_delete" ON public.feature_requests
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('features', 'delete'))
    );

-- =============================================
-- 3. FIX QUOTES TABLE RLS
-- Quotes are org-level (no project_id column)
-- Just ensure proper permission checks
-- =============================================

-- Drop existing quotes policies
DROP POLICY IF EXISTS "quotes_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_update" ON public.quotes;
DROP POLICY IF EXISTS "quotes_delete" ON public.quotes;

-- Create new quotes policies with permission checks
CREATE POLICY "quotes_select" ON public.quotes
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('quotes', 'view'))
    );

CREATE POLICY "quotes_insert" ON public.quotes
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('quotes', 'create'))
    );

CREATE POLICY "quotes_update" ON public.quotes
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('quotes', 'edit'))
    );

CREATE POLICY "quotes_delete" ON public.quotes
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('quotes', 'delete'))
    );

-- =============================================
-- 4. FIX CRM_CLIENTS TABLE RLS
-- CRM clients can be linked to projects via crm_leads
-- For now, treat CRM as org-level (not project-scoped)
-- but respect the principle that restricted users shouldn't see CRM
-- =============================================

-- Drop existing crm_clients policies
DROP POLICY IF EXISTS "crm_clients_select" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_insert" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_update" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_delete" ON public.crm_clients;

-- CRM clients: only users with CRM permission can access
-- Project-restricted users should still see CRM if they have permission
CREATE POLICY "crm_clients_select" ON public.crm_clients
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'view'))
    );

CREATE POLICY "crm_clients_insert" ON public.crm_clients
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'create'))
    );

CREATE POLICY "crm_clients_update" ON public.crm_clients
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'edit'))
    );

CREATE POLICY "crm_clients_delete" ON public.crm_clients
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'delete'))
    );

-- =============================================
-- 5. FIX CRM_LEADS TABLE RLS
-- Leads are org-level (no project_id column)
-- Just ensure proper permission checks
-- =============================================

-- Drop existing crm_leads policies
DROP POLICY IF EXISTS "crm_leads_select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_insert" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_update" ON public.crm_leads;
DROP POLICY IF EXISTS "crm_leads_delete" ON public.crm_leads;

-- Create new crm_leads policies with permission checks
CREATE POLICY "crm_leads_select" ON public.crm_leads
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'view'))
    );

CREATE POLICY "crm_leads_insert" ON public.crm_leads
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'create'))
    );

CREATE POLICY "crm_leads_update" ON public.crm_leads
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'edit'))
    );

CREATE POLICY "crm_leads_delete" ON public.crm_leads
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('crm', 'delete'))
    );

-- =============================================
-- 6. FIX COMMENTS TABLE RLS
-- Comments use polymorphic references (feedback_id, feature_request_id, ticket_id)
-- Should respect project access of their parent entity
-- =============================================

-- Helper function to check if user has access to a comment based on its parent entity
CREATE OR REPLACE FUNCTION public.user_has_comment_access_v2(
    p_feedback_id UUID,
    p_feature_request_id UUID,
    p_ticket_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_project_id UUID;
BEGIN
    -- Full project access = can see all
    IF public.user_has_full_project_access() THEN
        RETURN TRUE;
    END IF;

    -- Check ticket access
    IF p_ticket_id IS NOT NULL THEN
        SELECT project_id INTO v_project_id FROM tickets WHERE id = p_ticket_id;
        IF v_project_id IS NULL THEN
            RETURN TRUE; -- No project = org-level
        END IF;
        RETURN public.user_has_project_access(v_project_id);
    END IF;

    -- Check feedback access
    IF p_feedback_id IS NOT NULL THEN
        SELECT project_id INTO v_project_id FROM feedback WHERE id = p_feedback_id;
        IF v_project_id IS NULL THEN
            RETURN TRUE; -- No project = org-level
        END IF;
        RETURN public.user_has_project_access(v_project_id);
    END IF;

    -- Check feature request access
    IF p_feature_request_id IS NOT NULL THEN
        -- Feature requests can have multiple projects via junction table
        RETURN EXISTS (
            SELECT 1 FROM feature_request_projects frp
            WHERE frp.feature_request_id = p_feature_request_id
            AND public.user_has_project_access(frp.project_id)
        ) OR NOT EXISTS (
            -- Or if feature request has no projects (org-level)
            SELECT 1 FROM feature_request_projects frp
            WHERE frp.feature_request_id = p_feature_request_id
        );
    END IF;

    -- No entity reference = allow access
    RETURN TRUE;
END;
$$;

-- Drop existing comments policies
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

-- Create new comments policies with entity access control
CREATE POLICY "comments_select" ON public.comments
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.user_has_comment_access_v2(feedback_id, feature_request_id, ticket_id))
    );

CREATE POLICY "comments_insert" ON public.comments
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.user_has_comment_access_v2(feedback_id, feature_request_id, ticket_id))
    );

CREATE POLICY "comments_update" ON public.comments
    FOR UPDATE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND author_id = (SELECT public.auth_get_team_member_id())
    )
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
    );

CREATE POLICY "comments_delete" ON public.comments
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND author_id = (SELECT public.auth_get_team_member_id())
    );

-- =============================================
-- 7. FIX FORMS TABLE RLS - Add project access control
-- Forms can be linked to projects via form_projects
-- =============================================

-- Helper function to check if user has access to a form
CREATE OR REPLACE FUNCTION public.user_has_form_access(form_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        -- Full project access = can see all
        public.user_has_full_project_access()
        OR
        -- Form has no project links = org-level, everyone can see
        NOT EXISTS (
            SELECT 1 FROM form_projects fp
            WHERE fp.form_id = $1
        )
        OR
        -- Form is linked to at least one project user has access to
        EXISTS (
            SELECT 1 FROM form_projects fp
            WHERE fp.form_id = $1
            AND public.user_has_project_access(fp.project_id)
        );
$$;

-- Drop existing forms policies (we'll recreate with project access)
DROP POLICY IF EXISTS "forms_select" ON public.forms;
DROP POLICY IF EXISTS "forms_insert" ON public.forms;
DROP POLICY IF EXISTS "forms_update" ON public.forms;
DROP POLICY IF EXISTS "forms_delete" ON public.forms;

-- Create new forms policies with project access control
CREATE POLICY "forms_select" ON public.forms
    FOR SELECT TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.user_has_form_access(id))
    );

CREATE POLICY "forms_insert" ON public.forms
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('forms', 'create'))
    );

CREATE POLICY "forms_update" ON public.forms
    FOR UPDATE TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()))
    WITH CHECK (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "forms_delete" ON public.forms
    FOR DELETE TO authenticated
    USING (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('forms', 'delete'))
    );

-- Keep the public access policy for anonymous form submission
-- (Already exists: forms_select_published)

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.user_has_feature_request_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_comment_access_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_form_access TO authenticated;
