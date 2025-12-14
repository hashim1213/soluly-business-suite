import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://mmifqnourkxczyiyupoi.supabase.co';

const mockNotifications = [
  {
    id: 'notif-123',
    organization_id: 'org-123',
    recipient_id: 'member-123',
    type: 'comment',
    title: 'New Comment',
    message: 'Someone commented on your ticket',
    data: {
      ticket_id: 'ticket-123',
      comment_id: 'comment-123',
    },
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-456',
    organization_id: 'org-123',
    recipient_id: 'member-123',
    type: 'assignment',
    title: 'Ticket Assigned',
    message: 'You have been assigned a new ticket',
    data: {
      ticket_id: 'ticket-456',
    },
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'notif-789',
    organization_id: 'org-123',
    recipient_id: 'member-123',
    type: 'project_update',
    title: 'Project Updated',
    message: 'Test Project has been updated',
    data: {
      project_id: 'project-123',
    },
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockNotificationPreferences = [
  {
    id: 'pref-123',
    team_member_id: 'member-123',
    organization_id: 'org-123',
    email_enabled: true,
    push_enabled: false,
    comment_notifications: true,
    assignment_notifications: true,
    project_notifications: true,
    ticket_notifications: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const notificationHandlers = [
  // List notifications
  http.get(`${SUPABASE_URL}/rest/v1/notifications*`, ({ request }) => {
    const url = new URL(request.url);
    const recipientId = url.searchParams.get('recipient_id');
    const orgId = url.searchParams.get('organization_id');

    if (recipientId === 'eq.member-123' || orgId === 'eq.org-123') {
      return HttpResponse.json(mockNotifications);
    }

    return HttpResponse.json([]);
  }),

  // Create notification
  http.post(`${SUPABASE_URL}/rest/v1/notifications`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newNotification = {
      id: `notif-${Date.now()}`,
      ...body,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([newNotification], { status: 201 });
  }),

  // Update notification (mark as read)
  http.patch(`${SUPABASE_URL}/rest/v1/notifications*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const url = new URL(request.url);
    const notifId = url.searchParams.get('id')?.replace('eq.', '');

    const notification = mockNotifications.find(n => n.id === notifId);
    if (notification) {
      const updated = { ...notification, ...body };
      return HttpResponse.json([updated]);
    }

    // For bulk updates (mark all as read)
    if (url.searchParams.get('recipient_id')) {
      return HttpResponse.json(mockNotifications.map(n => ({ ...n, ...body })));
    }

    return HttpResponse.json([], { status: 404 });
  }),

  // Delete notification
  http.delete(`${SUPABASE_URL}/rest/v1/notifications*`, () => {
    return HttpResponse.json([]);
  }),

  // Get notification preferences
  http.get(`${SUPABASE_URL}/rest/v1/notification_preferences*`, ({ request }) => {
    const url = new URL(request.url);
    const memberId = url.searchParams.get('team_member_id');

    if (memberId === 'eq.member-123') {
      return HttpResponse.json(mockNotificationPreferences);
    }

    return HttpResponse.json([]);
  }),

  // Create notification preferences
  http.post(`${SUPABASE_URL}/rest/v1/notification_preferences`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newPrefs = {
      id: `pref-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([newPrefs], { status: 201 });
  }),

  // Update notification preferences
  http.patch(`${SUPABASE_URL}/rest/v1/notification_preferences*`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const updated = {
      ...mockNotificationPreferences[0],
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json([updated]);
  }),

  // Edge function: send-comment-notification
  http.post(`${SUPABASE_URL}/functions/v1/send-comment-notification`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (!body.commentId || !body.organizationId) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ success: true, notificationsSent: 1 });
  }),

  // Edge function: create-notification
  http.post(`${SUPABASE_URL}/functions/v1/create-notification`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (!body.type || !body.title || !body.recipientIds) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      notificationsCreated: (body.recipientIds as string[]).length
    });
  }),
];
