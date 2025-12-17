-- =============================================
-- Add end_date column to projects table
-- =============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
