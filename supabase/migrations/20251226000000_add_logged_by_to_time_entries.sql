-- ============================================
-- ADD LOGGED_BY TO TIME ENTRIES
-- Tracks who logged the time entry (self or admin)
-- ============================================

-- Add logged_by column to time_entries table
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS logged_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL;

-- Add organization_id to time_entries for RLS
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for logged_by lookups
CREATE INDEX IF NOT EXISTS idx_time_entries_logged_by ON public.time_entries(logged_by);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization ON public.time_entries(organization_id);

-- Update existing entries to set logged_by = team_member_id (self-logged assumption for existing data)
UPDATE public.time_entries
SET logged_by = team_member_id
WHERE logged_by IS NULL;

-- Update existing entries to set organization_id from team_member
UPDATE public.time_entries te
SET organization_id = tm.organization_id
FROM public.team_members tm
WHERE te.team_member_id = tm.id
AND te.organization_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.time_entries.logged_by IS 'The team member who logged this time entry. If same as team_member_id, it was self-logged. Otherwise, an admin logged it.';
COMMENT ON COLUMN public.time_entries.organization_id IS 'Organization this time entry belongs to for RLS purposes.';
