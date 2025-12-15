-- =============================================
-- Check Slug Availability Function
-- Allows anonymous users to check if an org slug is available
-- =============================================

-- Create a secure function to check slug availability
CREATE OR REPLACE FUNCTION check_slug_availability(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Normalize slug
  v_slug := lower(regexp_replace(COALESCE(p_slug, ''), '[^a-z0-9-]', '-', 'g'));

  -- Validate input
  IF v_slug IS NULL OR length(v_slug) < 3 THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Slug must be at least 3 characters'
    );
  END IF;

  -- Check if slug exists
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE slug = v_slug
  ) INTO v_exists;

  RETURN jsonb_build_object(
    'available', NOT v_exists,
    'slug', v_slug
  );
END;
$$;

-- Grant execute to anonymous users (for signup flow)
GRANT EXECUTE ON FUNCTION check_slug_availability(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_slug_availability(TEXT) TO authenticated;
