-- Create email_accounts table for IMAP email connections
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email_address TEXT NOT NULL,

  -- IMAP Configuration
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_username TEXT NOT NULL,
  imap_password TEXT NOT NULL,
  imap_use_ssl BOOLEAN NOT NULL DEFAULT TRUE,

  -- Sync Configuration
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'syncing')),
  auto_categorize BOOLEAN NOT NULL DEFAULT TRUE,
  auto_create_records BOOLEAN NOT NULL DEFAULT FALSE,
  sync_folder TEXT NOT NULL DEFAULT 'INBOX',
  last_sync_at TIMESTAMPTZ,
  last_sync_uid TEXT,
  last_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, email_address)
);

-- Indexes
CREATE INDEX idx_email_accounts_org ON email_accounts(organization_id);
CREATE INDEX idx_email_accounts_status ON email_accounts(status);

-- RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view email accounts in their organization
CREATE POLICY "Users can view email accounts in their org" ON email_accounts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Users with email permission can manage email accounts
CREATE POLICY "Users can insert email accounts" ON email_accounts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'emails'->>'create')::boolean = TRUE
    )
  );

CREATE POLICY "Users can update email accounts" ON email_accounts
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'emails'->>'edit')::boolean = TRUE
    )
  );

CREATE POLICY "Users can delete email accounts" ON email_accounts
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      JOIN roles r ON tm.role_id = r.id
      WHERE tm.auth_user_id = auth.uid()
      AND (r.permissions->'emails'->>'delete')::boolean = TRUE
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_email_accounts_updated_at();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE email_accounts;
