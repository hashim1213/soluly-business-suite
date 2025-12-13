-- ============================================
-- FIX MULTI-ORG RLS POLICIES
-- Allows users to see their own records across all organizations
-- ============================================

-- Drop and recreate the team_members SELECT policy to support multi-org
DROP POLICY IF EXISTS "team_select_org" ON team_members;

-- Users can view:
-- 1. Their own team_member records (across all orgs they belong to)
-- 2. All team members in their CURRENT organization (for team views)
CREATE POLICY "team_select_multi_org"
ON team_members FOR SELECT
TO authenticated
USING (
  -- Can always view own records (needed for org switcher)
  auth_user_id = auth.uid()
  -- Can view other team members in current org
  OR organization_id = auth_get_user_org_id()
);

-- Drop and recreate organizations SELECT policy for multi-org
DROP POLICY IF EXISTS "org_select_own" ON organizations;

-- Users can view any organization they belong to
CREATE POLICY "org_select_multi_org"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM team_members
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
);

-- Also need to allow viewing roles across organizations user belongs to
DROP POLICY IF EXISTS "roles_select_org" ON roles;

CREATE POLICY "roles_select_multi_org"
ON roles FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM team_members
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
