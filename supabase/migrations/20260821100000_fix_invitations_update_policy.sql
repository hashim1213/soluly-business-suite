-- The invitations_update policy was dropped in 20251215130000 and never recreated.
-- This restores it so admins can resend/update invitations.

-- Admin update: users with manage_users permission can update invitations in their org
CREATE POLICY "invitations_update_admin"
ON public.invitations FOR UPDATE
TO authenticated
USING (
  organization_id = (SELECT public.auth_get_user_org_id())
  AND (SELECT public.auth_has_settings_permission('manage_users'))
)
WITH CHECK (
  organization_id = (SELECT public.auth_get_user_org_id())
  AND (SELECT public.auth_has_settings_permission('manage_users'))
);
