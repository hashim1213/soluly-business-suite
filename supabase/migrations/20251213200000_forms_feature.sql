-- Forms Feature Migration
-- Creates tables for custom forms, form fields, links, and responses

-- =============================================
-- ENUMS
-- =============================================

-- Form status enum
DO $$ BEGIN
    CREATE TYPE form_status AS ENUM ('draft', 'published', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Form field type enum
DO $$ BEGIN
    CREATE TYPE form_field_type AS ENUM (
        'text', 'textarea', 'select', 'multiselect', 'radio',
        'checkbox', 'rating', 'scale', 'date', 'email', 'number', 'yes_no'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Form link type enum
DO $$ BEGIN
    CREATE TYPE form_link_type AS ENUM ('public', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLES
-- =============================================

-- Forms table (main form metadata)
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    display_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status form_status NOT NULL DEFAULT 'draft',
    settings JSONB DEFAULT '{"allow_anonymous": true, "allow_multiple": false, "show_progress": true, "thank_you_message": "Thank you for your response!"}'::jsonb,
    published_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    response_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, display_id)
);

-- Form projects junction table (forms can be linked to multiple projects)
CREATE TABLE IF NOT EXISTS public.form_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, project_id)
);

-- Form fields table (questions/fields in a form)
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    field_type form_field_type NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    field_order INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB, -- For select/radio/multiselect: [{"value": "opt1", "label": "Option 1"}]
    validation JSONB, -- {min, max, pattern, min_length, max_length, etc.}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form links table (shareable links for form access)
CREATE TABLE IF NOT EXISTS public.form_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    link_type form_link_type NOT NULL DEFAULT 'public',
    recipient_name TEXT,
    recipient_email TEXT,
    recipient_company TEXT,
    custom_metadata JSONB,
    max_responses INTEGER, -- NULL = unlimited
    response_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form responses table (submitted responses)
CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    link_id UUID REFERENCES public.form_links(id) ON DELETE SET NULL,
    respondent_name TEXT,
    respondent_email TEXT,
    answers JSONB NOT NULL, -- {field_id: value, field_id: [values], ...}
    metadata JSONB, -- {ip_address, user_agent, submission_duration_seconds}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

-- Forms indexes
CREATE INDEX IF NOT EXISTS idx_forms_organization ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON public.forms(created_by);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON public.forms(created_at DESC);

-- Form projects indexes
CREATE INDEX IF NOT EXISTS idx_form_projects_form ON public.form_projects(form_id);
CREATE INDEX IF NOT EXISTS idx_form_projects_project ON public.form_projects(project_id);

-- Form fields indexes
CREATE INDEX IF NOT EXISTS idx_form_fields_form ON public.form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON public.form_fields(form_id, field_order);

-- Form links indexes
CREATE INDEX IF NOT EXISTS idx_form_links_form ON public.form_links(form_id);
CREATE INDEX IF NOT EXISTS idx_form_links_token ON public.form_links(token);
CREATE INDEX IF NOT EXISTS idx_form_links_active ON public.form_links(is_active) WHERE is_active = true;

-- Form responses indexes
CREATE INDEX IF NOT EXISTS idx_form_responses_form ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_link ON public.form_responses(link_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_created ON public.form_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON public.form_responses(respondent_email) WHERE respondent_email IS NOT NULL;

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated at triggers
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
    BEFORE UPDATE ON public.form_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "forms_select" ON public.forms
    FOR SELECT TO authenticated
    USING (organization_id = (SELECT public.auth_get_user_org_id()));

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

-- Form projects policies (inherit from form access)
CREATE POLICY "form_projects_select" ON public.form_projects
    FOR SELECT TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    );

CREATE POLICY "form_projects_insert" ON public.form_projects
    FOR INSERT TO authenticated
    WITH CHECK (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "form_projects_delete" ON public.form_projects
    FOR DELETE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

-- Form fields policies (inherit from form access)
CREATE POLICY "form_fields_select" ON public.form_fields
    FOR SELECT TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    );

CREATE POLICY "form_fields_insert" ON public.form_fields
    FOR INSERT TO authenticated
    WITH CHECK (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "form_fields_update" ON public.form_fields
    FOR UPDATE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    )
    WITH CHECK (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "form_fields_delete" ON public.form_fields
    FOR DELETE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

-- Form links policies
CREATE POLICY "form_links_select" ON public.form_links
    FOR SELECT TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    );

-- Allow anonymous users to select form links by token (for public form access)
CREATE POLICY "form_links_select_by_token" ON public.form_links
    FOR SELECT TO anon
    USING (is_active = true);

CREATE POLICY "form_links_insert" ON public.form_links
    FOR INSERT TO authenticated
    WITH CHECK (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "form_links_update" ON public.form_links
    FOR UPDATE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    )
    WITH CHECK (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'edit'))
    );

CREATE POLICY "form_links_delete" ON public.form_links
    FOR DELETE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'delete'))
    );

-- Form responses policies
CREATE POLICY "form_responses_select" ON public.form_responses
    FOR SELECT TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
    );

-- Public form submission is handled by edge function, but we need a policy for service role
CREATE POLICY "form_responses_insert_service" ON public.form_responses
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "form_responses_delete" ON public.form_responses
    FOR DELETE TO authenticated
    USING (
        form_id IN (SELECT id FROM public.forms WHERE organization_id = (SELECT public.auth_get_user_org_id()))
        AND (SELECT public.auth_has_permission('forms', 'delete'))
    );

-- =============================================
-- PUBLIC FORM ACCESS (for anonymous users)
-- =============================================

-- Allow anonymous users to read published forms via their link token
CREATE POLICY "forms_select_published" ON public.forms
    FOR SELECT TO anon
    USING (
        status = 'published'
        AND (closes_at IS NULL OR closes_at > now())
        AND id IN (SELECT form_id FROM public.form_links WHERE is_active = true)
    );

-- Allow anonymous users to read fields for published forms
CREATE POLICY "form_fields_select_published" ON public.form_fields
    FOR SELECT TO anon
    USING (
        form_id IN (
            SELECT id FROM public.forms
            WHERE status = 'published'
            AND (closes_at IS NULL OR closes_at > now())
        )
    );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate unique form display ID
CREATE OR REPLACE FUNCTION generate_form_display_id(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_display_id TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CASE
            WHEN display_id ~ '^FRM-[0-9]+$'
            THEN CAST(SUBSTRING(display_id FROM 5) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM forms
    WHERE organization_id = org_id;

    new_display_id := 'FRM-' || LPAD(next_num::TEXT, 3, '0');
    RETURN new_display_id;
END;
$$;

-- Generate unique form link token
CREATE OR REPLACE FUNCTION generate_form_link_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 10-character alphanumeric token
        new_token := substr(md5(random()::text || clock_timestamp()::text), 1, 10);

        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM form_links WHERE token = new_token) INTO token_exists;

        EXIT WHEN NOT token_exists;
    END LOOP;

    RETURN new_token;
END;
$$;

-- Update form response count (called by edge function after submission)
CREATE OR REPLACE FUNCTION increment_form_response_count(p_form_id UUID, p_link_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Increment form response count
    UPDATE forms
    SET response_count = response_count + 1,
        updated_at = now()
    WHERE id = p_form_id;

    -- Increment link response count if link_id provided
    IF p_link_id IS NOT NULL THEN
        UPDATE form_links
        SET response_count = response_count + 1
        WHERE id = p_link_id;
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_form_display_id TO authenticated;
GRANT EXECUTE ON FUNCTION generate_form_link_token TO authenticated;
GRANT EXECUTE ON FUNCTION increment_form_response_count TO service_role;

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE forms;
ALTER PUBLICATION supabase_realtime ADD TABLE form_responses;
