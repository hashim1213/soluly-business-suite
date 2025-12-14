import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

const mockClients = [
  {
    id: 'client-123',
    organization_id: 'org-123',
    display_id: 'CLT-001',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0100',
    company: 'Acme Corp',
    status: 'active',
    notes: 'Key enterprise client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'client-456',
    organization_id: 'org-123',
    display_id: 'CLT-002',
    name: 'Tech Startup Inc',
    email: 'hello@techstartup.com',
    phone: '+1-555-0200',
    company: 'Tech Startup',
    status: 'active',
    notes: 'Growing startup client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockLeads = [
  {
    id: 'lead-123',
    organization_id: 'org-123',
    display_id: 'LED-001',
    name: 'John Prospect',
    email: 'john@prospect.com',
    phone: '+1-555-0300',
    company: 'Prospect Co',
    status: 'new',
    source: 'website',
    estimated_value: 5000,
    notes: 'Interested in our services',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-456',
    organization_id: 'org-123',
    display_id: 'LED-002',
    name: 'Jane Contact',
    email: 'jane@contact.com',
    phone: '+1-555-0400',
    company: 'Contact LLC',
    status: 'qualified',
    source: 'referral',
    estimated_value: 10000,
    notes: 'Referred by existing client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockContacts = [
  {
    id: 'contact-123',
    organization_id: 'org-123',
    client_id: 'client-123',
    name: 'Bob Smith',
    email: 'bob@acme.com',
    phone: '+1-555-0101',
    role: 'CTO',
    is_primary: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'contact-456',
    organization_id: 'org-123',
    client_id: 'client-123',
    name: 'Alice Johnson',
    email: 'alice@acme.com',
    phone: '+1-555-0102',
    role: 'Project Manager',
    is_primary: false,
    created_at: new Date().toISOString(),
  },
];

const mockQuotes = [
  {
    id: 'quote-123',
    organization_id: 'org-123',
    display_id: 'QTE-001',
    client_id: 'client-123',
    title: 'Website Redesign Proposal',
    status: 'sent',
    total_amount: 15000,
    valid_until: '2024-12-31',
    notes: 'Comprehensive website redesign',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockQuoteLineItems = [
  {
    id: 'line-123',
    quote_id: 'quote-123',
    description: 'Design Phase',
    quantity: 1,
    unit_price: 5000,
    total: 5000,
    order_index: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'line-456',
    quote_id: 'quote-123',
    description: 'Development Phase',
    quantity: 1,
    unit_price: 10000,
    total: 10000,
    order_index: 1,
    created_at: new Date().toISOString(),
  },
];

export const crmHandlers = [
  // List clients
  http.get(`${SUPABASE_URL}/rest/v1/crm_clients*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockClients);
    }

    return HttpResponse.json([]);
  }),

  // Create client
  http.post(`${SUPABASE_URL}/rest/v1/crm_clients`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newClient = {
      id: `client-${Date.now()}`,
      display_id: 'CLT-003',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newClient], { status: 201 });
  }),

  // Update client
  http.patch(`${SUPABASE_URL}/rest/v1/crm_clients*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const clientId = url.searchParams.get('id')?.replace('eq.', '');

    const client = mockClients.find(c => c.id === clientId);
    if (client) {
      const updated = { ...client, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete client
  http.delete(`${SUPABASE_URL}/rest/v1/crm_clients*`, () => {
    return HttpResponse.json([]);
  }),

  // List leads
  http.get(`${SUPABASE_URL}/rest/v1/crm_leads*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockLeads);
    }

    return HttpResponse.json([]);
  }),

  // Create lead
  http.post(`${SUPABASE_URL}/rest/v1/crm_leads`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newLead = {
      id: `lead-${Date.now()}`,
      display_id: 'LED-003',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newLead], { status: 201 });
  }),

  // Update lead
  http.patch(`${SUPABASE_URL}/rest/v1/crm_leads*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const leadId = url.searchParams.get('id')?.replace('eq.', '');

    const lead = mockLeads.find(l => l.id === leadId);
    if (lead) {
      const updated = { ...lead, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete lead
  http.delete(`${SUPABASE_URL}/rest/v1/crm_leads*`, () => {
    return HttpResponse.json([]);
  }),

  // List contacts
  http.get(`${SUPABASE_URL}/rest/v1/client_contacts*`, ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const orgId = url.searchParams.get('organization_id');

    if (clientId) {
      const contacts = mockContacts.filter(c => c.client_id === clientId.replace('eq.', ''));
      return HttpResponse.json(contacts);
    }

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockContacts);
    }

    return HttpResponse.json([]);
  }),

  // Create contact
  http.post(`${SUPABASE_URL}/rest/v1/client_contacts`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newContact = {
      id: `contact-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([newContact], { status: 201 });
  }),

  // Update contact
  http.patch(`${SUPABASE_URL}/rest/v1/client_contacts*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const contactId = url.searchParams.get('id')?.replace('eq.', '');

    const contact = mockContacts.find(c => c.id === contactId);
    if (contact) {
      const updated = { ...contact, ...body };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete contact
  http.delete(`${SUPABASE_URL}/rest/v1/client_contacts*`, () => {
    return HttpResponse.json([]);
  }),

  // List quotes
  http.get(`${SUPABASE_URL}/rest/v1/quotes*`, ({ request }) => {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('organization_id');
    const clientId = url.searchParams.get('client_id');

    if (clientId) {
      const quotes = mockQuotes.filter(q => q.client_id === clientId.replace('eq.', ''));
      return HttpResponse.json(quotes);
    }

    if (orgId === 'eq.org-123') {
      return HttpResponse.json(mockQuotes);
    }

    return HttpResponse.json([]);
  }),

  // Create quote
  http.post(`${SUPABASE_URL}/rest/v1/quotes`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newQuote = {
      id: `quote-${Date.now()}`,
      display_id: 'QTE-002',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newQuote], { status: 201 });
  }),

  // Update quote
  http.patch(`${SUPABASE_URL}/rest/v1/quotes*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const quoteId = url.searchParams.get('id')?.replace('eq.', '');

    const quote = mockQuotes.find(q => q.id === quoteId);
    if (quote) {
      const updated = { ...quote, ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete quote
  http.delete(`${SUPABASE_URL}/rest/v1/quotes*`, () => {
    return HttpResponse.json([]);
  }),

  // List quote line items
  http.get(`${SUPABASE_URL}/rest/v1/quote_line_items*`, ({ request }) => {
    const url = new URL(request.url);
    const quoteId = url.searchParams.get('quote_id');

    if (quoteId) {
      const items = mockQuoteLineItems.filter(i => i.quote_id === quoteId.replace('eq.', ''));
      return HttpResponse.json(items);
    }

    return HttpResponse.json([]);
  }),

  // Create quote line item
  http.post(`${SUPABASE_URL}/rest/v1/quote_line_items`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newItem = {
      id: `line-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([newItem], { status: 201 });
  }),

  // Update quote line item
  http.patch(`${SUPABASE_URL}/rest/v1/quote_line_items*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const itemId = url.searchParams.get('id')?.replace('eq.', '');

    const item = mockQuoteLineItems.find(i => i.id === itemId);
    if (item) {
      const updated = { ...item, ...body };
      return HttpResponse.json([updated]);
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete quote line item
  http.delete(`${SUPABASE_URL}/rest/v1/quote_line_items*`, () => {
    return HttpResponse.json([]);
  }),
];
