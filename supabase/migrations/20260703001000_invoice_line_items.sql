-- Invoice line items table for detailed invoices with PDF generation
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_sort ON invoice_line_items(invoice_id, sort_order);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_line_items_select"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM project_invoices WHERE organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active'
    )
  ));

CREATE POLICY "invoice_line_items_insert"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (invoice_id IN (
    SELECT id FROM project_invoices WHERE organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active'
    )
  ));

CREATE POLICY "invoice_line_items_update"
  ON invoice_line_items FOR UPDATE
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM project_invoices WHERE organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active'
    )
  ));

CREATE POLICY "invoice_line_items_delete"
  ON invoice_line_items FOR DELETE
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM project_invoices WHERE organization_id IN (
      SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid() AND status = 'active'
    )
  ));

-- Add tax and subtotal fields to project_invoices
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE project_invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2);
