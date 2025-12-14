import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

// Create a new QueryClient for each test to avoid shared state
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper to create a wrapper with custom query client
export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

// Mock data factories
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

export const mockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  created_at: new Date().toISOString(),
};

export const mockTeamMember = {
  id: 'member-123',
  organization_id: 'org-123',
  auth_user_id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role_id: 'role-123',
  status: 'active',
  created_at: new Date().toISOString(),
};

export const mockProject = {
  id: 'project-123',
  organization_id: 'org-123',
  display_id: 'PRJ-001',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  project_value: 10000,
  progress: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockTicket = {
  id: 'ticket-123',
  organization_id: 'org-123',
  display_id: 'TKT-001',
  title: 'Test Ticket',
  description: 'A test ticket',
  status: 'open',
  priority: 'medium',
  project_id: 'project-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockForm = {
  id: 'form-123',
  organization_id: 'org-123',
  display_id: 'FRM-001',
  title: 'Test Form',
  description: 'A test form',
  status: 'draft',
  response_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockFormField = {
  id: 'field-123',
  form_id: 'form-123',
  field_type: 'text',
  label: 'Name',
  description: null,
  placeholder: 'Enter your name',
  field_order: 0,
  required: true,
  options: null,
  validation: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockNotification = {
  id: 'notif-123',
  organization_id: 'org-123',
  recipient_id: 'member-123',
  type: 'comment',
  title: 'New Comment',
  message: 'Someone commented on your ticket',
  entity_type: 'ticket',
  entity_id: 'ticket-123',
  entity_display_id: 'TKT-001',
  is_read: false,
  created_at: new Date().toISOString(),
};

// Helper to wait for async updates
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
