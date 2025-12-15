-- =============================================
-- Fix remaining duplicate policies on team_members table
-- =============================================

-- Drop the duplicate INSERT policy (signup function uses SECURITY DEFINER so bypasses RLS)
DROP POLICY IF EXISTS "Allow signup function to insert team_members" ON public.team_members;

-- Drop both UPDATE policies to replace with a single consolidated one
DROP POLICY IF EXISTS "team_members_update_own" ON public.team_members;
DROP POLICY IF EXISTS "team_update" ON public.team_members;

-- Create a single consolidated UPDATE policy that allows:
-- 1. Users to update their own team_member record
-- 2. Users with team edit permission to update any team member in their org
CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE
USING (
    -- User can update their own record
    auth_user_id = (SELECT auth.uid())
    OR
    -- Or user has team edit permission for their org
    (
        organization_id = (SELECT public.auth_get_user_org_id())
        AND (SELECT public.auth_has_permission('team', 'edit'))
    )
);
