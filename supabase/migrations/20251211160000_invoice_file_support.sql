-- Add file support to project_invoices
-- Allows uploading invoice PDFs/documents

ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT; -- External invoice number
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN project_invoices.file_url IS 'URL to the uploaded invoice file';
COMMENT ON COLUMN project_invoices.file_name IS 'Original filename of the uploaded invoice';
COMMENT ON COLUMN project_invoices.invoice_number IS 'External invoice number (e.g., client-facing number)';
COMMENT ON COLUMN project_invoices.notes IS 'Additional notes about the invoice';
