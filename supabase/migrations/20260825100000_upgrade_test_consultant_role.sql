-- Upgrade test consultant from Viewer to Admin role
UPDATE team_members
SET role_id = '88fe0dc0-d024-41eb-a9b9-e6c70f79cab8'
WHERE email = 'testconsultant@soluly.com'
  AND organization_id = '485134ca-81e5-4a10-a116-06bf0368455b';
