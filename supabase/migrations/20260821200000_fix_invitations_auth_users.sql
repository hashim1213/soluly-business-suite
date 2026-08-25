-- The invitations_update_accept_secure policy queries auth.users directly,
-- which the authenticated role cannot access. Replace with auth.email().

DROP POLICY IF EXISTS "invitations_update_accept_secure" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_accept" ON public.invitations;

-- Allow the invited user to accept their own invitation
CREATE POLICY "invitations_update_accept"
ON public.invitations FOR UPDATE
TO authenticated
USING (
  lower(email) = lower((SELECT auth.email()))
  AND accepted_at IS NULL
)
WITH CHECK (
  lower(email) = lower((SELECT auth.email()))
);
