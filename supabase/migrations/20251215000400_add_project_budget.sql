-- Add budget column to projects table
-- This allows users to set a budget separate from contracted value
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0;

-- Add a comment explaining the difference
COMMENT ON COLUMN public.projects.budget IS 'The allocated budget for the project, may differ from contracted value';
COMMENT ON COLUMN public.projects.value IS 'The contracted/revenue value of the project';
