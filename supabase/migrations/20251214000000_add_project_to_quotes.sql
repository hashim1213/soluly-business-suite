-- Add project_id field to quotes table for project-based invoicing
-- This enables creating invoices/quotes for existing projects

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotes_project ON quotes(project_id);

-- Add a comment to document the field purpose
COMMENT ON COLUMN quotes.project_id IS 'Optional link to a project for project-based invoices';
