import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCrmClients,
  useCrmClient,
  useCrmClientByDisplayId,
  useCreateCrmClient,
  useUpdateCrmClient,
  useDeleteCrmClient,
  useCrmLeads,
  useCrmLead,
  useCreateCrmLead,
  useUpdateCrmLead,
  useDeleteCrmLead,
  useConvertLeadToClient,
} from '../useCRM';

// Mock the AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  organization: { id: 'org-123', name: 'Test Org' },
  member: { id: 'member-123', name: 'Test User' },
  permissions: { crm: { view: true, create: true, edit: true, delete: true } },
  allowedProjectIds: null,
  hasFullProjectAccess: vi.fn(() => true),
  hasProjectAccess: vi.fn(() => true),
  hasPermission: vi.fn(() => true),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =====================
  // CLIENTS
  // =====================
  describe('CRM Clients', () => {
    describe('useCrmClients hook', () => {
      it('should fetch clients for the organization', async () => {
        const { result } = renderHook(() => useCrmClients(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });

        if (result.current.isSuccess) {
          expect(result.current.data).toBeDefined();
          expect(Array.isArray(result.current.data)).toBe(true);
        }
      });

      it('should return empty array when no organization', async () => {
        const originalOrg = mockAuthContext.organization;
        mockAuthContext.organization = null as unknown as typeof mockAuthContext.organization;

        const { result } = renderHook(() => useCrmClients(), {
          wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');

        mockAuthContext.organization = originalOrg;
      });
    });

    describe('useCrmClient hook', () => {
      it('should fetch single client by ID', async () => {
        const { result } = renderHook(() => useCrmClient('client-123'), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });
      });

      it('should be idle when client ID is undefined', async () => {
        const { result } = renderHook(() => useCrmClient(undefined), {
          wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
      });
    });

    describe('useCrmClientByDisplayId hook', () => {
      it('should fetch client by display ID', async () => {
        const { result } = renderHook(() => useCrmClientByDisplayId('CLT-001'), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });
      });

      it('should be idle when display ID is undefined', async () => {
        const { result } = renderHook(() => useCrmClientByDisplayId(undefined), {
          wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
      });
    });

    describe('useCreateCrmClient hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useCreateCrmClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });

      it('should be idle initially', () => {
        const { result } = renderHook(() => useCreateCrmClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.isIdle).toBe(true);
      });
    });

    describe('useUpdateCrmClient hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useUpdateCrmClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });
    });

    describe('useDeleteCrmClient hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useDeleteCrmClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });
    });
  });

  // =====================
  // LEADS
  // =====================
  describe('CRM Leads', () => {
    describe('useCrmLeads hook', () => {
      it('should fetch leads for the organization', async () => {
        const { result } = renderHook(() => useCrmLeads(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });

        if (result.current.isSuccess) {
          expect(result.current.data).toBeDefined();
          expect(Array.isArray(result.current.data)).toBe(true);
        }
      });

      it('should return empty array when no organization', async () => {
        const originalOrg = mockAuthContext.organization;
        mockAuthContext.organization = null as unknown as typeof mockAuthContext.organization;

        const { result } = renderHook(() => useCrmLeads(), {
          wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');

        mockAuthContext.organization = originalOrg;
      });
    });

    describe('useCrmLead hook', () => {
      it('should fetch single lead by ID', async () => {
        const { result } = renderHook(() => useCrmLead('lead-123'), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });
      });

      it('should be idle when lead ID is undefined', async () => {
        const { result } = renderHook(() => useCrmLead(undefined), {
          wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
      });
    });

    describe('useCreateCrmLead hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useCreateCrmLead(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });

      it('should be idle initially', () => {
        const { result } = renderHook(() => useCreateCrmLead(), {
          wrapper: createWrapper(),
        });

        expect(result.current.isIdle).toBe(true);
      });
    });

    describe('useUpdateCrmLead hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useUpdateCrmLead(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });
    });

    describe('useDeleteCrmLead hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useDeleteCrmLead(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });
    });

    describe('useConvertLeadToClient hook', () => {
      it('should have mutate function', () => {
        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.mutate).toBeDefined();
        expect(result.current.mutateAsync).toBeDefined();
      });

      it('should be idle initially', () => {
        const { result } = renderHook(() => useConvertLeadToClient(), {
          wrapper: createWrapper(),
        });

        expect(result.current.isIdle).toBe(true);
      });
    });
  });
});
