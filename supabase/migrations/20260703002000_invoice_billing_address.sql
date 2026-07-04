-- Store client billing address per invoice for PDF generation
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_city TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_state TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS client_postal_code TEXT;
