-- Create enum for email categories
CREATE TYPE email_category AS ENUM ('feature_request', 'customer_quote', 'feedback', 'other');

-- Create enum for email status
CREATE TYPE email_status AS ENUM ('pending', 'processed', 'failed');

-- Create emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  body TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status email_status NOT NULL DEFAULT 'pending',
  category email_category,
  confidence_score DECIMAL(3,2),
  ai_summary TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- For now, allow public read/write (we'll add auth later)
CREATE POLICY "Allow public read" ON public.emails FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.emails FOR UPDATE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;