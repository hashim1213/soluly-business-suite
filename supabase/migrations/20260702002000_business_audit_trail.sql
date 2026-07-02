-- Business-data audit trail
--
-- audit_logs and log_audit_event() have existed since the robust-auth
-- migration, but nothing populated them automatically: only auth/security
-- events were captured (security_events). This migration makes every write
-- to business tables auditable at the database level, so the trail is
-- complete regardless of which UI path (or API client) made the change.

CREATE OR REPLACE FUNCTION audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_org UUID;
  v_resource UUID;
  v_member UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Skip no-op updates so the trail stays meaningful
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;
  ELSE
    v_old := to_jsonb(OLD);
  END IF;

  v_org := COALESCE((v_new->>'organization_id')::uuid, (v_old->>'organization_id')::uuid);
  v_resource := COALESCE((v_new->>'id')::uuid, (v_old->>'id')::uuid);

  SELECT id INTO v_member
  FROM team_members
  WHERE auth_user_id = auth.uid()
    AND (v_org IS NULL OR organization_id = v_org)
  LIMIT 1;

  INSERT INTO audit_logs (
    organization_id,
    user_id,
    team_member_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    v_org,
    auth.uid(),
    v_member,
    lower(TG_OP),
    TG_TABLE_NAME,
    v_resource,
    v_old,
    v_new
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to every business table that exists. The existence
-- check keeps this migration safe across environments.
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'projects',
    'project_tasks',
    'project_milestones',
    'project_costs',
    'project_invoices',
    'project_contracts',
    'project_team_members',
    'tickets',
    'sprints',
    'quotes',
    'quote_line_items',
    'crm_clients',
    'crm_leads',
    'crm_tasks',
    'crm_activities',
    'contacts',
    'contact_activities',
    'client_contacts',
    'time_entries',
    'team_members',
    'team_payments',
    'business_costs',
    'forms',
    'feature_requests',
    'feedback'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION audit_row_change()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- The Audit Log page needs member names alongside entries; audit_logs has
-- only a SELECT policy (admins), which stays as the single read path.
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(organization_id, resource_type, created_at DESC);
