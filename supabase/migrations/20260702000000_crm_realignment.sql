-- CRM data-model realignment
--
-- 1) The app's lead funnel (new → contacted → qualified → converted/lost)
--    never matched the lead_status enum created in the initial migration
--    (cold/warm/hot), so creating a lead or changing its status failed at
--    the database. Replace the enum with the funnel the app implements and
--    map any existing temperature values onto it.
ALTER TABLE crm_leads ALTER COLUMN status DROP DEFAULT;
ALTER TYPE lead_status RENAME TO lead_status_old;
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
ALTER TABLE crm_leads
  ALTER COLUMN status TYPE lead_status
  USING (
    CASE status::text
      WHEN 'cold' THEN 'new'
      WHEN 'warm' THEN 'contacted'
      WHEN 'hot' THEN 'qualified'
      ELSE 'new'
    END
  )::lead_status;
ALTER TABLE crm_leads ALTER COLUMN status SET DEFAULT 'new';
DROP TYPE lead_status_old;

-- 2) The CRM "New Task" dialog collects a description, but crm_tasks never
--    had the column, so those inserts failed. Persist it.
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS description TEXT;

-- 3) The "New Lead" dialog collects notes, but crm_leads never had the
--    column, so lead creation failed. Persist it.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4) Companies (crm_clients) are created inline from the contact dialogs
--    with only a name, but contact_email was NOT NULL, so those inserts
--    failed. A company doesn't require an email address.
ALTER TABLE crm_clients ALTER COLUMN contact_email DROP NOT NULL;

-- 5) The project edit/status UI has always offered On Hold and Cancelled,
--    but the project_status enum only had active/pending/completed, so
--    those lifecycle transitions failed at the database.
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'cancelled';
