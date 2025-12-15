-- Add issues permission to all existing roles
-- This updates the JSONB permissions column to include issues permission

UPDATE public.roles
SET permissions = permissions || '{"issues": {"view": true, "create": true, "edit": true, "delete": true}}'::jsonb
WHERE permissions IS NOT NULL
AND NOT (permissions ? 'issues');

-- For roles that might have issues permission but incomplete, ensure full structure
UPDATE public.roles
SET permissions = jsonb_set(
  permissions,
  '{issues}',
  '{"view": true, "create": true, "edit": true, "delete": true}'::jsonb
)
WHERE permissions IS NOT NULL;
