-- =============================================
-- SOC2 Security Enhancements
-- =============================================

-- 1. Session management table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_org ON user_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(expires_at) WHERE revoked_at IS NULL;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can revoke their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Password policy tracking
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL, -- Store hash for comparison, never plain text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- No direct access to password history from client
CREATE POLICY "No direct access" ON password_history
  FOR ALL USING (FALSE);

-- 3. Login attempts tracking for brute force protection
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- Index for efficient cleanup queries (no partial index with NOW() - not immutable)
-- Cleanup should be done via scheduled job: DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days'

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view login attempts for their org members
CREATE POLICY "Admins can view org login attempts" ON login_attempts
  FOR SELECT USING (
    email IN (
      SELECT tm.email FROM team_members tm
      WHERE tm.organization_id = auth_get_user_org_id()
    )
    AND auth_has_settings_permission('manage_users')
  );

-- 4. API access tokens for integrations
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES team_members(id),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL, -- SHA-256 hash of the token
  token_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes JSONB NOT NULL DEFAULT '[]', -- Array of allowed scopes
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_org ON api_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_prefix ON api_tokens(token_prefix);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API tokens" ON api_tokens
  FOR ALL USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_org')
  );

-- 5. Data retention policy table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'audit_logs', 'login_attempts', etc.
  retention_days INTEGER NOT NULL DEFAULT 365,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, resource_type)
);

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
  FOR ALL USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_org')
  );

-- 6. Security event types for audit logging
CREATE TYPE security_event_type AS ENUM (
  'login_success',
  'login_failure',
  'logout',
  'password_change',
  'password_reset_request',
  'password_reset_complete',
  'mfa_enabled',
  'mfa_disabled',
  'api_token_created',
  'api_token_revoked',
  'role_assigned',
  'role_removed',
  'permission_changed',
  'member_invited',
  'member_removed',
  'organization_settings_changed',
  'data_export_requested',
  'suspicious_activity_detected'
);

-- 7. Security events table (separate from general audit logs)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  team_member_id UUID REFERENCES team_members(id),
  event_type security_event_type NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_org ON security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON security_events(risk_level) WHERE risk_level IN ('high', 'critical');

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events" ON security_events
  FOR SELECT USING (
    organization_id = auth_get_user_org_id()
    AND auth_has_settings_permission('manage_org')
  );

-- 8. Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type security_event_type,
  p_event_details JSONB DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_org_id UUID;
  v_member_id UUID;
BEGIN
  SELECT organization_id, id INTO v_org_id, v_member_id
  FROM team_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  INSERT INTO security_events (
    organization_id,
    user_id,
    team_member_id,
    event_type,
    event_details,
    risk_level
  )
  VALUES (
    v_org_id,
    auth.uid(),
    v_member_id,
    p_event_type,
    p_event_details,
    p_risk_level
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;

-- 9. Add MFA fields to team_members if not exists
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS mfa_backup_codes_encrypted TEXT;

-- 10. Account lockout tracking
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_ip INET;

-- 11. Create function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT locked_until > NOW()
      FROM team_members
      WHERE email = lower(p_email)
      LIMIT 1
    ),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION is_account_locked TO anon;
GRANT EXECUTE ON FUNCTION is_account_locked TO authenticated;

-- 12. Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockout_threshold INTEGER := 5;
  v_lockout_duration INTERVAL := '15 minutes';
BEGIN
  -- Record the attempt
  INSERT INTO login_attempts (email, success, failure_reason)
  VALUES (lower(p_email), p_success, p_failure_reason);

  IF p_success THEN
    -- Reset failed attempts on successful login
    UPDATE team_members
    SET
      failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = NOW()
    WHERE email = lower(p_email);
  ELSE
    -- Increment failed attempts
    UPDATE team_members
    SET
      failed_login_attempts = failed_login_attempts + 1,
      locked_until = CASE
        WHEN failed_login_attempts + 1 >= v_lockout_threshold
        THEN NOW() + v_lockout_duration
        ELSE locked_until
      END
    WHERE email = lower(p_email);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION record_login_attempt TO anon;
GRANT EXECUTE ON FUNCTION record_login_attempt TO authenticated;

-- 13. Data classification labels
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'internal';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'internal';
ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'confidential';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'confidential';

-- Add check constraint for valid classifications
-- 'public', 'internal', 'confidential', 'restricted'
