-- Business Costs Table
-- Stores general business expenses not tied to specific projects
-- Comprehensive categories for all types of business expenses

CREATE TABLE IF NOT EXISTS business_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT, -- Company/person paid
  reference TEXT, -- Invoice number, receipt number, etc.
  payment_method TEXT, -- credit_card, bank_transfer, cash, check, etc.
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_frequency TEXT, -- monthly, quarterly, annually
  tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  attachment_url TEXT, -- URL to receipt/invoice file
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, display_id)
);

-- Enable RLS
ALTER TABLE business_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_costs
CREATE POLICY "Users can view business costs in their organization" ON business_costs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create business costs in their organization" ON business_costs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update business costs in their organization" ON business_costs
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete business costs in their organization" ON business_costs
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_costs_organization ON business_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_costs_category ON business_costs(category);
CREATE INDEX IF NOT EXISTS idx_business_costs_date ON business_costs(date DESC);
CREATE INDEX IF NOT EXISTS idx_business_costs_recurring ON business_costs(recurring) WHERE recurring = TRUE;

-- Comments for documentation
COMMENT ON TABLE business_costs IS 'General business expenses not tied to specific projects';
COMMENT ON COLUMN business_costs.category IS 'Main category: software, legal, accounting, taxes, insurance, marketing, office, utilities, travel, equipment, professional_services, subscriptions, banking, licenses, training, other';
COMMENT ON COLUMN business_costs.subcategory IS 'Optional subcategory for more detailed categorization';
COMMENT ON COLUMN business_costs.recurring IS 'Whether this is a recurring expense';
COMMENT ON COLUMN business_costs.recurring_frequency IS 'How often: monthly, quarterly, annually';
COMMENT ON COLUMN business_costs.tax_deductible IS 'Whether this expense is tax deductible';
