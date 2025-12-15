-- Add address field to contacts table for invoice support
-- This enables storing billing/mailing addresses for contacts

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;

-- Add a comment to document the field purpose
COMMENT ON COLUMN contacts.address IS 'Contact mailing/billing address for invoices';
