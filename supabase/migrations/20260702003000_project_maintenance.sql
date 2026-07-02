-- Maintenance mode for completed projects
--
-- A project can move into 'maintenance' after delivery: the build is done
-- but the client pays a recurring amount (e.g. $300/month for 2 years) and
-- ongoing work (features, fixes) keeps being tracked and billed against it.
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'maintenance';

-- The maintenance term needs an end date alongside the existing
-- has_maintenance / maintenance_amount / maintenance_frequency /
-- maintenance_start_date / maintenance_notes columns.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS maintenance_end_date DATE;
