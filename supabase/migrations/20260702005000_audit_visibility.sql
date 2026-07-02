-- Make the audit trail actually visible
--
-- Both audit views were gated on auth_get_user_org_id(), which returns an
-- ARBITRARY membership's org for users in multiple organizations (LIMIT 1,
-- no ordering). RLS could therefore scope rows to a different org than the
-- one the app queries, yielding zero rows forever. Scope visibility to
-- every org where the user's role grants settings.manage_org instead.

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id
      FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
        AND COALESCE((r.permissions->'settings'->>'manage_org')::boolean, FALSE)
    )
  );

DROP POLICY IF EXISTS "Admins can view security events" ON security_events;
CREATE POLICY "Admins can view security events" ON security_events
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id
      FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
        AND COALESCE((r.permissions->'settings'->>'manage_org')::boolean, FALSE)
    )
  );
