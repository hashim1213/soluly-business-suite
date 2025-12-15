-- Migration: Create custom fields system for contacts
-- Description: Custom field definitions and values for flexible contact data

-- Custom field type enum
DO $$ BEGIN
  CREATE TYPE custom_field_type AS ENUM (
    'text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email', 'phone'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Custom field definitions (organization-level)
CREATE TABLE IF NOT EXISTS contact_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type custom_field_type NOT NULL DEFAULT 'text',
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Custom field values (contact-level)
CREATE TABLE IF NOT EXISTS contact_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES contact_custom_fields(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, field_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_organization ON contact_custom_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_contact ON contact_custom_field_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON contact_custom_field_values(field_id);

-- Enable RLS
ALTER TABLE contact_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_custom_fields table
CREATE POLICY "Users can view custom_fields in their organization" ON contact_custom_fields
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create custom_fields in their organization" ON contact_custom_fields
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update custom_fields in their organization" ON contact_custom_fields
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom_fields in their organization" ON contact_custom_fields
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for contact_custom_field_values table
CREATE POLICY "Users can view custom_field_values in their organization" ON contact_custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_custom_field_values.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create custom_field_values in their organization" ON contact_custom_field_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_custom_field_values.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update custom_field_values in their organization" ON contact_custom_field_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_custom_field_values.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom_field_values in their organization" ON contact_custom_field_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN team_members tm ON tm.organization_id = c.organization_id
      WHERE c.id = contact_custom_field_values.contact_id AND tm.auth_user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_fields_updated_at
  BEFORE UPDATE ON contact_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();

CREATE TRIGGER trigger_custom_field_values_updated_at
  BEFORE UPDATE ON contact_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();
