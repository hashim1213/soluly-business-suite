-- Update emails table with additional columns for email inbox system

-- Add email_account_id reference
ALTER TABLE emails ADD COLUMN IF NOT EXISTS email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;

-- Add display_id for user-friendly identifier (EML-001 format)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Add message_id for deduplication (Email Message-ID header)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS message_id TEXT;

-- Add uid for IMAP tracking
ALTER TABLE emails ADD COLUMN IF NOT EXISTS imap_uid TEXT;

-- Add linked record columns
ALTER TABLE emails ADD COLUMN IF NOT EXISTS linked_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS linked_feature_request_id UUID REFERENCES feature_requests(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS linked_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS linked_feedback_id UUID REFERENCES feedback(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add review status for manual review workflow
ALTER TABLE emails ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'dismissed'));
ALTER TABLE emails ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add AI processing fields
ALTER TABLE emails ADD COLUMN IF NOT EXISTS ai_suggested_title TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(email_account_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_review_status ON emails(review_status);
CREATE INDEX IF NOT EXISTS idx_emails_linked_ticket ON emails(linked_ticket_id);
CREATE INDEX IF NOT EXISTS idx_emails_linked_feature ON emails(linked_feature_request_id);
CREATE INDEX IF NOT EXISTS idx_emails_linked_quote ON emails(linked_quote_id);
CREATE INDEX IF NOT EXISTS idx_emails_linked_feedback ON emails(linked_feedback_id);
CREATE INDEX IF NOT EXISTS idx_emails_linked_project ON emails(linked_project_id);

-- Create sequence for display_id generation
CREATE SEQUENCE IF NOT EXISTS email_display_id_seq START 1;

-- Function to generate display_id
CREATE OR REPLACE FUNCTION generate_email_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'EML-' || LPAD(nextval('email_display_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for display_id
DROP TRIGGER IF EXISTS set_email_display_id ON emails;
CREATE TRIGGER set_email_display_id
  BEFORE INSERT ON emails
  FOR EACH ROW EXECUTE FUNCTION generate_email_display_id();
