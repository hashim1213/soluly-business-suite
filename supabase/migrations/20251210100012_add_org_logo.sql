-- Add logo_url column to organizations table for custom logo uploads
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN organizations.logo_url IS 'URL to custom logo image stored in Supabase storage';

-- Create storage bucket for organization logos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload org logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    INNER JOIN team_members tm ON tm.organization_id = o.id
    WHERE tm.auth_user_id = auth.uid()
  )
);

-- Allow anyone to view org logos (they're public)
CREATE POLICY "Org logos are publicly viewable" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'org-logos');

-- Allow org members to update/delete their org's logos
CREATE POLICY "Users can update org logos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'org-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    INNER JOIN team_members tm ON tm.organization_id = o.id
    WHERE tm.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete org logos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'org-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    INNER JOIN team_members tm ON tm.organization_id = o.id
    WHERE tm.auth_user_id = auth.uid()
  )
);
