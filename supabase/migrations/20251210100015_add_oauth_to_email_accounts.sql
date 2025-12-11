-- Add OAuth columns to email_accounts table
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS oauth_provider TEXT,
ADD COLUMN IF NOT EXISTS oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_token_expires_at TIMESTAMPTZ;

-- Add comment to explain OAuth fields
COMMENT ON COLUMN email_accounts.oauth_provider IS 'OAuth provider name (e.g., google)';
COMMENT ON COLUMN email_accounts.oauth_access_token IS 'OAuth access token for API access';
COMMENT ON COLUMN email_accounts.oauth_refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN email_accounts.oauth_token_expires_at IS 'When the access token expires';
