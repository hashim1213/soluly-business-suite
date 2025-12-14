import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

const mockForms = [
  {
    id: 'form-123',
    organization_id: 'org-123',
    display_id: 'FRM-001',
    name: 'Contact Form',
    description: 'A contact form for inquiries',
    status: 'published',
    is_public: true,
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'form-456',
    organization_id: 'org-123',
    display_id: 'FRM-002',
    name: 'Feedback Survey',
    description: 'Customer feedback survey',
    status: 'draft',
    is_public: false,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockFormFields = [
  {
    id: 'field-123',
    form_id: 'form-123',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your name',
    required: true,
    order_index: 0,
    settings: {},
    created_at: new Date().toISOString(),
  },
  {
    id: 'field-456',
    form_id: 'form-123',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
    order_index: 1,
    settings: {},
    created_at: new Date().toISOString(),
  },
  {
    id: 'field-789',
    form_id: 'form-123',
    type: 'textarea',
    label: 'Message',
    placeholder: 'Enter your message',
    required: false,
    order_index: 2,
    settings: { rows: 4 },
    created_at: new Date().toISOString(),
  },
];

const mockFormLinks = [
  {
    id: 'link-123',
    form_id: 'form-123',
    organization_id: 'org-123',
    token: 'abc123token',
    is_active: true,
    expires_at: null,
    max_responses: null,
    response_count: 5,
    created_at: new Date().toISOString(),
  },
];

const mockFormResponses = [
  {
    id: 'response-123',
    form_id: 'form-123',
    form_link_id: 'link-123',
    organization_id: 'org-123',
    data: {
      'field-123': 'John Doe',
      'field-456': 'john@example.com',
      'field-789': 'This is a test message',
    },
    submitted_at: new Date().toISOString(),
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
  },
  {
    id: 'response-456',
    form_id: 'form-123',
    form_link_id: 'link-123',
    organization_id: 'org-123',
    data: {
      'field-123': 'Jane Smith',
      'field-456': 'jane@example.com',
      'field-789': 'Another test message',
    },
    submitted_at: new Date().toISOString(),
    ip_address: '127.0.0.2',
    user_agent: 'Mozilla/5.0',
  },
];

export const formHandlers = [
  // List forms
  http.get(`${SUPABASE_URL}/rest/v1/forms*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockForms);
    }

    return HttpResponse.json([]);
  }),

  // Create form
  http.post(`${SUPABASE_URL}/rest/v1/forms`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newForm = {
      id: `form-${Date.now()}`,
      display_id: 'FRM-003',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newForm], { status: 201 });
  }),

  // Update form
  http.patch(`${SUPABASE_URL}/rest/v1/forms*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const formId = url.searchParams.get('id')?.replace('eq.', '');

    const form = mockForms.find(f => f.id === formId);
    if (form) {
      const updated = { ...form, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete form
  http.delete(`${SUPABASE_URL}/rest/v1/forms*`, () => {
    return HttpResponse.json([]);
  }),

  // List form fields
  http.get(`${SUPABASE_URL}/rest/v1/form_fields*`, ({ request }) => {
    const url = new URL(request.url);
    const formId = url.searchParams.get('form_id');

    if (formId) {
      const fields = mockFormFields.filter(f => f.form_id === formId.replace('eq.', ''));
      return HttpResponse.json(fields);
    }

    return HttpResponse.json([]);
  }),

  // Create form field
  http.post(`${SUPABASE_URL}/rest/v1/form_fields`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newField = {
      id: `field-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([newField], { status: 201 });
  }),

  // Update form field
  http.patch(`${SUPABASE_URL}/rest/v1/form_fields*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const fieldId = url.searchParams.get('id')?.replace('eq.', '');

    const field = mockFormFields.find(f => f.id === fieldId);
    if (field) {
      const updated = { ...field, ...body };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete form field
  http.delete(`${SUPABASE_URL}/rest/v1/form_fields*`, () => {
    return HttpResponse.json([]);
  }),

  // List form links
  http.get(`${SUPABASE_URL}/rest/v1/form_links*`, ({ request }) => {
    const url = new URL(request.url);
    const formId = url.searchParams.get('form_id');

    if (formId) {
      const links = mockFormLinks.filter(l => l.form_id === formId.replace('eq.', ''));
      return HttpResponse.json(links);
    }

    return HttpResponse.json([]);
  }),

  // Create form link
  http.post(`${SUPABASE_URL}/rest/v1/form_links`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newLink = {
      id: `link-${Date.now()}`,
      token: `token-${Date.now()}`,
      ...body,
      is_active: true,
      response_count: 0,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([newLink], { status: 201 });
  }),

  // Update form link
  http.patch(`${SUPABASE_URL}/rest/v1/form_links*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const linkId = url.searchParams.get('id')?.replace('eq.', '');

    const link = mockFormLinks.find(l => l.id === linkId);
    if (link) {
      const updated = { ...link, ...body };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // List form responses
  http.get(`${SUPABASE_URL}/rest/v1/form_responses*`, ({ request }) => {
    const url = new URL(request.url);
    const formId = url.searchParams.get('form_id');
    const orgId = url.searchParams.get('organization_id');

    if (formId || orgId) {
      return HttpResponse.json(mockFormResponses);
    }

    return HttpResponse.json([]);
  }),

  // Delete form response
  http.delete(`${SUPABASE_URL}/rest/v1/form_responses*`, () => {
    return HttpResponse.json([]);
  }),
];
