-- Add "maintenance" as a valid recurring charge category
-- This unifies the project-level maintenance fields with the recurring_charges table

ALTER TABLE recurring_charges DROP CONSTRAINT IF EXISTS recurring_charges_category_check;
ALTER TABLE recurring_charges ADD CONSTRAINT recurring_charges_category_check
  CHECK (category IN ('hosting', 'database', 'subscription', 'domain', 'license', 'maintenance', 'other'));
