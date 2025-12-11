-- =============================================
-- Fix email unique constraint and RLS policies
-- =============================================

-- 1. Drop the old unique constraint on email (it should be per-organization now)
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_email_key;

-- 2. Add composite unique constraint (email unique within organization)
ALTER TABLE team_members ADD CONSTRAINT team_members_org_email_unique UNIQUE (organization_id, email);

-- 3. Update the get_user_organization_id function to handle edge cases
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM team_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 4. Add a policy to allow users to read their own team_member record by auth_user_id
-- This is needed for the initial data fetch after login
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;

CREATE POLICY "Users can view own record or org members" ON team_members
  FOR SELECT USING (
    auth_user_id = auth.uid()  -- Can always view own record
    OR organization_id = get_user_organization_id()  -- Can view org members
  );

-- 5. Ensure organizations can be viewed if user is a member
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
  );

-- 6. Ensure roles can be viewed if user is a member of the org
DROP POLICY IF EXISTS "Users can view roles in their organization" ON roles;

CREATE POLICY "Users can view roles in their organization" ON roles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE auth_user_id = auth.uid())
  );
