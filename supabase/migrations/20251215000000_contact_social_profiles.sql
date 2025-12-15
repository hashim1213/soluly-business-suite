-- Migration: Add social profiles to contacts table
-- Description: Add JSONB column for storing social media profile URLs

-- Add social_profiles column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN contacts.social_profiles IS 'Social media profiles: linkedin_url, twitter_url, facebook_url, website_url';

-- Create index for potential JSONB queries
CREATE INDEX IF NOT EXISTS idx_contacts_social_profiles ON contacts USING GIN (social_profiles);
