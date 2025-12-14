import React, { createContext } from 'react';
import { vi } from 'vitest';

// Mock auth context values
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
};

export const mockOrganization = {
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  created_at: new Date().toISOString(),
};

export const mockMember = {
  id: 'member-123',
  organization_id: 'org-123',
  auth_user_id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role_id: 'role-123',
  status: 'active' as const,
  allowed_project_ids: null,
  created_at: new Date().toISOString(),
};

export const mockPermissions = {
  dashboard: { view: true },
  projects: { view: true, create: true, edit: true, delete: true },
  tickets: { view: true, create: true, edit: true, delete: true },
  forms: { view: true, create: true, edit: true, delete: true },
  crm: { view: true, create: true, edit: true, delete: true },
  settings: { view: true, manage_org: true, manage_users: true, manage_roles: true },
};

export const createMockAuthContext = (overrides = {}) => ({
  user: mockUser,
  organization: mockOrganization,
  member: mockMember,
  permissions: mockPermissions,
  allowedProjectIds: null,
  loading: false,
  hasPermission: vi.fn((module: string, action: string) => {
    const perms = mockPermissions as Record<string, Record<string, boolean>>;
    return perms[module]?.[action] ?? false;
  }),
  hasProjectAccess: vi.fn(() => true),
  hasFullProjectAccess: vi.fn(() => true),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  switchOrganization: vi.fn(),
  ...overrides,
});

// Create a mock AuthContext for testing
export const MockAuthContext = createContext(createMockAuthContext());

// Mock AuthContext provider
export const MockAuthProvider: React.FC<{
  children: React.ReactNode;
  value?: ReturnType<typeof createMockAuthContext>;
}> = ({ children, value = createMockAuthContext() }) => {
  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Mock the useAuth hook module
export const mockUseAuth = vi.fn(() => createMockAuthContext());
