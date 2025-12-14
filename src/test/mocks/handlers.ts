import { authHandlers } from './handlers/auth';
import { projectHandlers } from './handlers/projects';
import { ticketHandlers } from './handlers/tickets';
import { formHandlers } from './handlers/forms';
import { crmHandlers } from './handlers/crm';
import { notificationHandlers } from './handlers/notifications';

export const handlers = [
  ...authHandlers,
  ...projectHandlers,
  ...ticketHandlers,
  ...formHandlers,
  ...crmHandlers,
  ...notificationHandlers,
];
