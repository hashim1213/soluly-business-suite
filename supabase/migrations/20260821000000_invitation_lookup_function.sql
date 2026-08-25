-- Public function to look up invitation details by token.
-- SECURITY DEFINER bypasses RLS so anon/unauthenticated users can
-- view invitation details (org name, role) on the accept page.
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'email', i.email,
    'expires_at', i.expires_at,
    'organization', json_build_object('name', o.name, 'slug', o.slug),
    'role', json_build_object('name', r.name)
  ) INTO result
  FROM invitations i
  JOIN organizations o ON o.id = i.organization_id
  JOIN roles r ON r.id = i.role_id
  WHERE i.token = p_token
  AND i.accepted_at IS NULL;

  RETURN result;
END;
$$;

-- Allow anon and authenticated to call this function
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
