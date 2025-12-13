-- Migration: Add comments table for feedback and feature requests
-- This creates a polymorphic comments table that can be used for multiple entity types

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Polymorphic reference - one of these should be set
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE,
  feature_request_id UUID REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Author
  author_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure at least one entity reference is set
  CONSTRAINT comments_entity_check CHECK (
    (feedback_id IS NOT NULL)::int +
    (feature_request_id IS NOT NULL)::int +
    (ticket_id IS NOT NULL)::int = 1
  )
);

-- Create indexes
CREATE INDEX idx_comments_feedback ON public.comments(feedback_id) WHERE feedback_id IS NOT NULL;
CREATE INDEX idx_comments_feature_request ON public.comments(feature_request_id) WHERE feature_request_id IS NOT NULL;
CREATE INDEX idx_comments_ticket ON public.comments(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_comments_organization ON public.comments(organization_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: Users can view comments in their organization
CREATE POLICY "comments_select"
ON public.comments FOR SELECT
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
);

-- INSERT: Users with appropriate permissions can add comments
CREATE POLICY "comments_insert"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    -- For feedback comments
    (feedback_id IS NOT NULL AND (SELECT auth_has_permission('feedback', 'create')))
    OR
    -- For feature request comments
    (feature_request_id IS NOT NULL AND (SELECT auth_has_permission('features', 'create')))
    OR
    -- For ticket comments
    (ticket_id IS NOT NULL AND (SELECT auth_has_permission('tickets', 'create')))
  )
);

-- UPDATE: Users can update their own comments
CREATE POLICY "comments_update"
ON public.comments FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND author_id = (SELECT auth_get_team_member_id())
)
WITH CHECK (
  organization_id = (SELECT auth_get_user_org_id())
);

-- DELETE: Users can delete their own comments, or admins can delete any
CREATE POLICY "comments_delete"
ON public.comments FOR DELETE
TO authenticated
USING (
  organization_id = (SELECT auth_get_user_org_id())
  AND (
    author_id = (SELECT auth_get_team_member_id())
    OR (SELECT auth_has_settings_permission('manage_users'))
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
