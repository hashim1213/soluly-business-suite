-- Client-Contact Many-to-Many Relationship
-- Creates a junction table to link clients with multiple contacts

-- ============================================
-- 1. Create client_contacts junction table
-- ============================================
CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, contact_id)
);

-- Enable RLS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_contacts
CREATE POLICY "Users can view client_contacts via their organization" ON client_contacts
  FOR SELECT USING (
    client_id IN (
      SELECT cc.id FROM crm_clients cc
      JOIN team_members tm ON cc.organization_id = tm.organization_id
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create client_contacts in their organization" ON client_contacts
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT cc.id FROM crm_clients cc
      JOIN team_members tm ON cc.organization_id = tm.organization_id
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update client_contacts in their organization" ON client_contacts
  FOR UPDATE USING (
    client_id IN (
      SELECT cc.id FROM crm_clients cc
      JOIN team_members tm ON cc.organization_id = tm.organization_id
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client_contacts in their organization" ON client_contacts
  FOR DELETE USING (
    client_id IN (
      SELECT cc.id FROM crm_clients cc
      JOIN team_members tm ON cc.organization_id = tm.organization_id
      WHERE tm.auth_user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_contact ON client_contacts(contact_id);
