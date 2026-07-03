-- Allow reading invitations by token regardless of expiry (valid until accepted).
-- The old policy required expires_at > NOW() which broke links for expired invitations.

DROP POLICY IF EXISTS "invitations_select_by_token_secure" ON invitations;

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
  )
);

-- Extend any existing expired but unaccepted invitations
UPDATE invitations
SET expires_at = NOW() + INTERVAL '1 year'
WHERE accepted_at IS NULL
  AND expires_at < NOW();
