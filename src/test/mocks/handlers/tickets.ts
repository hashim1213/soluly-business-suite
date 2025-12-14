import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

const mockTickets = [
  {
    id: 'ticket-123',
    organization_id: 'org-123',
    display_id: 'TKT-001',
    title: 'Test Ticket',
    description: 'A test ticket description',
    status: 'open',
    priority: 'medium',
    project_id: 'project-123',
    assigned_to: 'member-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ticket-456',
    organization_id: 'org-123',
    display_id: 'TKT-002',
    title: 'High Priority Ticket',
    description: 'An urgent ticket',
    status: 'in_progress',
    priority: 'high',
    project_id: 'project-123',
    assigned_to: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockFeatureRequests = [
  {
    id: 'feature-123',
    organization_id: 'org-123',
    display_id: 'FTR-001',
    title: 'New Feature Request',
    description: 'A feature request',
    status: 'pending',
    priority: 'medium',
    category: 'enhancement',
    votes: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockFeedback = [
  {
    id: 'feedback-123',
    organization_id: 'org-123',
    display_id: 'FBK-001',
    title: 'Customer Feedback',
    content: 'Great product!',
    status: 'new',
    sentiment: 'positive',
    project_id: 'project-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const ticketHandlers = [
  // List tickets
  http.get(`${SUPABASE_URL}/rest/v1/tickets*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockTickets);
    }

    return HttpResponse.json([]);
  }),

  // Create ticket
  http.post(`${SUPABASE_URL}/rest/v1/tickets`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTicket = {
      id: `ticket-${Date.now()}`,
      display_id: 'TKT-003',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newTicket], { status: 201 });
  }),

  // Update ticket
  http.patch(`${SUPABASE_URL}/rest/v1/tickets*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const ticketId = url.searchParams.get('id')?.replace('eq.', '');

    const ticket = mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      const updated = { ...ticket, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete ticket
  http.delete(`${SUPABASE_URL}/rest/v1/tickets*`, () => {
    return HttpResponse.json([]);
  }),

  // List feature requests
  http.get(`${SUPABASE_URL}/rest/v1/feature_requests*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockFeatureRequests);
    }

    return HttpResponse.json([]);
  }),

  // Create feature request
  http.post(`${SUPABASE_URL}/rest/v1/feature_requests`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newFeature = {
      id: `feature-${Date.now()}`,
      display_id: 'FTR-002',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newFeature], { status: 201 });
  }),

  // List feedback
  http.get(`${SUPABASE_URL}/rest/v1/feedback*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockFeedback);
    }

    return HttpResponse.json([]);
  }),

  // Create feedback
  http.post(`${SUPABASE_URL}/rest/v1/feedback`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newFeedback = {
      id: `feedback-${Date.now()}`,
      display_id: 'FBK-002',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newFeedback], { status: 201 });
  }),

  // Comments
  http.get(`${SUPABASE_URL}/rest/v1/comments*`, ({ request }) => {
    const url = new URL(request.url);
    const ticketId = url.searchParams.get('ticket_id');
    const feedbackId = url.searchParams.get('feedback_id');
    const featureId = url.searchParams.get('feature_request_id');

    if (ticketId || feedbackId || featureId) {
      return HttpResponse.json([
        {
          id: 'comment-123',
          organization_id: 'org-123',
          ticket_id: ticketId?.replace('eq.', '') || null,
          feedback_id: feedbackId?.replace('eq.', '') || null,
          feature_request_id: featureId?.replace('eq.', '') || null,
          content: 'This is a test comment',
          author_id: 'member-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    return HttpResponse.json([]);
  }),

  // Create comment
  http.post(`${SUPABASE_URL}/rest/v1/comments`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newComment = {
      id: `comment-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newComment], { status: 201 });
  }),
];
