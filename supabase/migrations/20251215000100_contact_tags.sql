-- Migration: Create tags system for contacts
-- Description: Tags table for organization-level definitions and junction table for contact-tag relationships

-- Tags definition table (organization-level)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Junction table for contact-tag relationships
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_organization ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON contact_tags(tag_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags table
CREATE POLICY "Users can view tags in their organization" ON tags
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their organization" ON tags
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in their organization" ON tags
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their organization" ON tags
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for contact_tags table
CREATE POLICY "Users can view contact_tags in their organization" ON contact_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_tags.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contact_tags in their organization" ON contact_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_tags.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contact_tags in their organization" ON contact_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_tags.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on tags
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tags_updated_at();
