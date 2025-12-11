-- ============================================
-- QUOTE LINE ITEMS TABLE
-- Stores individual line items for quotes
-- ============================================

-- Create quote_line_items table
CREATE TABLE public.quote_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by quote_id
CREATE INDEX idx_quote_line_items_quote_id ON public.quote_line_items(quote_id);

-- Create index for sorting
CREATE INDEX idx_quote_line_items_sort_order ON public.quote_line_items(quote_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on quote_line_items" ON public.quote_line_items
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_quote_line_items_updated_at
  BEFORE UPDATE ON public.quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.quote_line_items IS 'Stores individual line items for customer quotes';
COMMENT ON COLUMN public.quote_line_items.quote_id IS 'Reference to the parent quote';
COMMENT ON COLUMN public.quote_line_items.description IS 'Description of the line item';
COMMENT ON COLUMN public.quote_line_items.quantity IS 'Quantity of items';
COMMENT ON COLUMN public.quote_line_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN public.quote_line_items.total IS 'Auto-calculated total (quantity * unit_price)';
COMMENT ON COLUMN public.quote_line_items.sort_order IS 'Order of items in the quote';
