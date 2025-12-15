-- Add 'issue' to ticket_category enum
ALTER TYPE public.ticket_category ADD VALUE IF NOT EXISTS 'issue';

-- Add issues permission to the permissions type (if using JSONB permissions)
COMMENT ON TYPE public.ticket_category IS 'Ticket categories: feature requests, quotes, feedback, and issues';
