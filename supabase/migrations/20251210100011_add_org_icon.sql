-- Add icon column to organizations table
-- This allows organizations to set a custom icon/emoji for branding

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN organizations.icon IS 'Custom icon or emoji for organization branding displayed in sidebar';
