-- Add notification preferences to team_members table
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"comments": true, "tickets": true, "features": true, "feedback": true}'::jsonb;

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipient_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('comment', 'ticket', 'feature_request', 'feedback', 'mention', 'assignment')),
    title text NOT NULL,
    message text NOT NULL,
    entity_type text CHECK (entity_type IN ('ticket', 'feature_request', 'feedback', 'project')),
    entity_id uuid,
    entity_display_id text,
    actor_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
    read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = auth.uid()
    )
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = auth.uid()
    )
);

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.team_members
        WHERE auth_user_id = auth.uid()
    )
);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = auth.uid()
    )
);
