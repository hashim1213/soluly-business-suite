import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

export const authHandlers = [
  // Get current user
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    });
  }),

  // Sign in
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      });
    }

    return HttpResponse.json(
      { error: 'Invalid login credentials' },
      { status: 400 }
    );
  }),

  // Sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({ message: 'Logged out' });
  }),

  // Get team member for current user
  http.get(`${SUPABASE_URL}/rest/v1/team_members*`, ({ request }) => {
    const url = new URL(request.url);
    const authUserId = url.searchParams.get('auth_user_id');

    if (authUserId) {
      return HttpResponse.json([{
        id: 'member-123',
        organization_id: 'org-123',
        auth_user_id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role_id: 'role-123',
        status: 'active',
        allowed_project_ids: null,
        created_at: new Date().toISOString(),
      }]);
    }

    return HttpResponse.json([]);
  }),

  // Get organization
  http.get(`${SUPABASE_URL}/rest/v1/organizations*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json([{
        id: 'org-123',
        name: 'Test Organization',
        slug: 'test-org',
        created_at: new Date().toISOString(),
      }]);
    }

    return HttpResponse.json([]);
  }),

  // Get role with permissions
  http.get(`${SUPABASE_URL}/rest/v1/roles*`, ({ request }) => {
    const url = new URL(request.url);
    const roleId = url.searchParams.get('id');

    if (roleId === 'eq.role-123') {
      return HttpResponse.json([{
        id: 'role-123',
        organization_id: 'org-123',
        name: 'Admin',
        permissions: {
          dashboard: { view: true },
          projects: { view: true, create: true, edit: true, delete: true },
          tickets: { view: true, create: true, edit: true, delete: true },
          forms: { view: true, create: true, edit: true, delete: true },
          crm: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, manage_org: true, manage_users: true, manage_roles: true },
        },
        is_system: false,
        created_at: new Date().toISOString(),
      }]);
    }

    return HttpResponse.json([]);
  }),

  // Get invitations
  http.get(`${SUPABASE_URL}/rest/v1/invitations*`, () => {
    return HttpResponse.json([]);
  }),
];
