-- Make contact fields nullable on crm_clients and crm_leads
-- Since contacts are now managed via the contacts table and client_contacts junction table

-- Make contact_email nullable on crm_clients
ALTER TABLE crm_clients ALTER COLUMN contact_email DROP NOT NULL;

-- Make contact_email nullable on crm_leads
ALTER TABLE crm_leads ALTER COLUMN contact_email DROP NOT NULL;
