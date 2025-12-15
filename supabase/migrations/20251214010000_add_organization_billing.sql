-- Add billing information fields to organizations table for invoices
-- These fields will be used when generating PDF invoices

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_state TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'Canada';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_number TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_invoice_terms TEXT DEFAULT 'Payment is due within 30 days of receipt of this invoice. Please make payment via bank transfer or cheque to the details provided.';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_invoice_notes TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN organizations.billing_name IS 'Company name to display on invoices (defaults to org name if not set)';
COMMENT ON COLUMN organizations.billing_address IS 'Street address for billing/invoices';
COMMENT ON COLUMN organizations.billing_city IS 'City for billing address';
COMMENT ON COLUMN organizations.billing_state IS 'State/Province for billing address';
COMMENT ON COLUMN organizations.billing_postal_code IS 'Postal/ZIP code for billing address';
COMMENT ON COLUMN organizations.billing_country IS 'Country for billing address';
COMMENT ON COLUMN organizations.billing_phone IS 'Phone number to display on invoices';
COMMENT ON COLUMN organizations.billing_email IS 'Email to display on invoices';
COMMENT ON COLUMN organizations.tax_number IS 'Tax ID / GST / VAT number for invoices';
COMMENT ON COLUMN organizations.default_invoice_terms IS 'Default payment terms for invoices';
COMMENT ON COLUMN organizations.default_invoice_notes IS 'Default notes to include on invoices';
