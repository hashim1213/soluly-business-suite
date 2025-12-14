-- Add forms permission to existing roles
-- This updates all roles that have full admin permissions (likely Owner/Admin roles)
-- to also include forms permission

-- Update roles that have all permissions (admin-like roles)
UPDATE public.roles
SET permissions = permissions || '{"forms": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
WHERE permissions->>'dashboard' IS NOT NULL
  AND permissions->'forms' IS NULL;

-- For any roles that somehow still don't have forms, add a default (view only)
UPDATE public.roles
SET permissions = permissions || '{"forms": {"view": true, "create": false, "edit": false, "delete": false}}'::jsonb
WHERE permissions->'forms' IS NULL;
