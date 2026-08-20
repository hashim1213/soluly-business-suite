-- Composio-backed email accounts (Gmail, Outlook, and other providers)
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS composio_connected_account_id TEXT,
ADD COLUMN IF NOT EXISTS provider_slug TEXT;

COMMENT ON COLUMN email_accounts.composio_connected_account_id IS 'Composio connected account nanoid (ca_...) when oauth_provider = composio';
COMMENT ON COLUMN email_accounts.provider_slug IS 'Composio toolkit slug (gmail, outlook, ...)';

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_composio_ca
  ON email_accounts(composio_connected_account_id)
  WHERE composio_connected_account_id IS NOT NULL;
