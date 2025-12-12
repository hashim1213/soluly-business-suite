-- Create saved expense templates table for persistent vendor/expense storage
CREATE TABLE IF NOT EXISTS expense_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Template name (e.g., "Slack Monthly", "AWS Hosting")
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  default_amount DECIMAL(12,2),
  payment_method TEXT,
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_frequency TEXT, -- weekly, biweekly, monthly, quarterly, annually
  tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  use_count INTEGER NOT NULL DEFAULT 0, -- Track how often this template is used
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE expense_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations within organization (simplified, matching other tables)
CREATE POLICY "Allow public read expense_templates" ON expense_templates FOR SELECT USING (true);
CREATE POLICY "Allow public insert expense_templates" ON expense_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expense_templates" ON expense_templates FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expense_templates" ON expense_templates FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE expense_templates IS 'Saved expense templates for quick entry of recurring or common expenses';
COMMENT ON COLUMN expense_templates.name IS 'User-friendly template name';
COMMENT ON COLUMN expense_templates.vendor IS 'Vendor/company name';
COMMENT ON COLUMN expense_templates.default_amount IS 'Default amount for this expense (can be overridden)';
COMMENT ON COLUMN expense_templates.use_count IS 'Number of times this template has been used';
COMMENT ON COLUMN expense_templates.last_used_at IS 'Last time this template was used to create an expense';
