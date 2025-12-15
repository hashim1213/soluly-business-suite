-- Add billing-related fields to quotes table for invoice generation
-- These fields allow per-quote customization of billing details

-- Bill-to address (client billing address)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Invoice-specific fields
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS po_number TEXT;

-- Tax and totals
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);

-- Terms and notes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- Payment tracking
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

-- Add comments
COMMENT ON COLUMN quotes.billing_address IS 'Client billing address for this quote/invoice';
COMMENT ON COLUMN quotes.invoice_number IS 'Invoice number (generated when creating invoice)';
COMMENT ON COLUMN quotes.invoice_date IS 'Date when invoice was created';
COMMENT ON COLUMN quotes.due_date IS 'Payment due date';
COMMENT ON COLUMN quotes.po_number IS 'Client purchase order number';
COMMENT ON COLUMN quotes.tax_rate IS 'Tax rate percentage (e.g., 5 for 5%)';
COMMENT ON COLUMN quotes.tax_amount IS 'Calculated tax amount';
COMMENT ON COLUMN quotes.total_amount IS 'Total including tax';
COMMENT ON COLUMN quotes.terms IS 'Payment terms for this invoice';
COMMENT ON COLUMN quotes.invoice_notes IS 'Notes specific to this invoice';
COMMENT ON COLUMN quotes.amount_paid IS 'Amount already paid';
COMMENT ON COLUMN quotes.payment_status IS 'Payment status: unpaid, partial, or paid';

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_quotes_invoice_number ON quotes(invoice_number);
