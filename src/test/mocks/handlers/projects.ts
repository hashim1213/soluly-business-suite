import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

const mockProjects = [
  {
    id: 'project-123',
    organization_id: 'org-123',
    display_id: 'PRJ-001',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    project_value: 10000,
    progress: 50,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'project-456',
    organization_id: 'org-123',
    display_id: 'PRJ-002',
    name: 'Another Project',
    description: 'Another test project',
    status: 'pending',
    project_value: 5000,
    progress: 0,
    start_date: '2024-06-01',
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const projectHandlers = [
  // List projects
  http.get(`${SUPABASE_URL}/rest/v1/projects*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockProjects);
    }

    return HttpResponse.json([]);
  }),

  // Create project
  http.post(`${SUPABASE_URL}/rest/v1/projects`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newProject = {
      id: `project-${Date.now()}`,
      display_id: 'PRJ-003',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newProject], { status: 201 });
  }),

  // Update project
  http.patch(`${SUPABASE_URL}/rest/v1/projects*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('id')?.replace('eq.', '');

    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      const updated = { ...project, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete project
  http.delete(`${SUPABASE_URL}/rest/v1/projects*`, () => {
    return HttpResponse.json([]);
  }),

  // Project costs
  http.get(`${SUPABASE_URL}/rest/v1/project_costs*`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (projectId) {
      return HttpResponse.json([
        {
          id: 'cost-123',
          project_id: projectId.replace('eq.', ''),
          category: 'labor',
          description: 'Development work',
          amount: 1000,
          date: '2024-01-15',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  // Project tasks
  http.get(`${SUPABASE_URL}/rest/v1/project_tasks*`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (projectId) {
      return HttpResponse.json([
        {
          id: 'task-123',
          project_id: projectId.replace('eq.', ''),
          title: 'Test Task',
          description: 'A test task',
          status: 'pending',
          due_date: '2024-06-01',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  // Project milestones
  http.get(`${SUPABASE_URL}/rest/v1/project_milestones*`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (projectId) {
      return HttpResponse.json([
        {
          id: 'milestone-123',
          project_id: projectId.replace('eq.', ''),
          title: 'Phase 1 Complete',
          description: 'First phase completion',
          due_date: '2024-03-01',
          is_completed: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  // Project team members
  http.get(`${SUPABASE_URL}/rest/v1/project_team_members*`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (projectId) {
      return HttpResponse.json([
        {
          id: 'ptm-123',
          project_id: projectId.replace('eq.', ''),
          team_member_id: 'member-123',
          role: 'lead',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return HttpResponse.json([]);
  }),
];
