-- Add sender filtering to email_accounts
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS filter_mode TEXT DEFAULT 'all' CHECK (filter_mode IN ('all', 'whitelist', 'blacklist')),
ADD COLUMN IF NOT EXISTS allowed_senders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS blocked_senders JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN email_accounts.filter_mode IS 'all: process all emails, whitelist: only from allowed_senders, blacklist: exclude blocked_senders';
COMMENT ON COLUMN email_accounts.allowed_senders IS 'Array of email addresses or domains (e.g., ["user@example.com", "@company.com"])';
COMMENT ON COLUMN email_accounts.blocked_senders IS 'Array of email addresses or domains to exclude';
