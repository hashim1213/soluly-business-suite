-- Migration: Fix invitation select policies
-- The issue is that multiple conflicting SELECT policies exist on invitations table
-- This migration drops all SELECT policies and creates clean ones

-- Drop all existing SELECT policies on invitations
DROP POLICY IF EXISTS "invitations_select" ON invitations;
DROP POLICY IF EXISTS "invitations_select_by_token" ON invitations;
DROP POLICY IF EXISTS "invitations_select_by_token_secure" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations in their organization" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Create a single clean SELECT policy that handles both cases:
-- 1. Org members with manage_users can see all org invitations
-- 2. Anyone (including anon) can view an unexpired, unaccepted invitation (for accepting)
CREATE POLICY "invitations_select_policy"
ON invitations FOR SELECT
TO anon, authenticated
USING (
  -- Case 1: Authenticated user with manage_users permission in the org
  (
    auth.uid() IS NOT NULL
    AND organization_id = (SELECT auth_get_user_org_id())
    AND (SELECT auth_has_settings_permission('manage_users'))
  )
  OR
  -- Case 2: Invitation is not yet accepted and not expired (for viewing invite details)
  (
    accepted_at IS NULL
    AND expires_at > NOW()
  )
);
