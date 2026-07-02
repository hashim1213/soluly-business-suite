-- Recurring client charges (hosting, database, subscriptions, domains, …)
-- attached to a project. Together with the maintenance fee these feed
-- generated invoices that can be sent to the client.
CREATE TABLE IF NOT EXISTS recurring_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('hosting', 'database', 'subscription', 'domain', 'license', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_charges_org ON recurring_charges(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_charges_project ON recurring_charges(project_id);

ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring charges in their organization"
  ON recurring_charges FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create recurring charges in their organization"
  ON recurring_charges FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update recurring charges in their organization"
  ON recurring_charges FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete recurring charges in their organization"
  ON recurring_charges FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid()
  ));

-- Keep the audit trail complete for billing data
DROP TRIGGER IF EXISTS audit_recurring_charges ON recurring_charges;
CREATE TRIGGER audit_recurring_charges
  AFTER INSERT OR UPDATE OR DELETE ON recurring_charges
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();
