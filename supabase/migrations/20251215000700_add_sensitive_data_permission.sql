-- Add sensitive_data permission to all existing roles
-- This controls visibility of financial amounts (budgets, contract values, salaries, etc.)

-- Add sensitive_data with view_amounts: true for all existing roles (admin-level by default)
UPDATE public.roles
SET permissions = permissions || '{"sensitive_data": {"view_amounts": true}}'::jsonb
WHERE permissions IS NOT NULL
AND NOT (permissions ? 'sensitive_data');
