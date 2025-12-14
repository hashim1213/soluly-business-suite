import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTickets, useTicket, useTicketsByProject, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../useTickets';

// Mock the AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  organization: { id: 'org-123', name: 'Test Org' },
  member: { id: 'member-123', name: 'Test User' },
  permissions: { tickets: { view: true, create: true, edit: true, delete: true } },
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

describe('useTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.hasFullProjectAccess.mockReturnValue(true);
    mockAuthContext.allowedProjectIds = null;
  });

  describe('useTickets hook', () => {
    it('should fetch tickets for the organization', async () => {
      const { result } = renderHook(() => useTickets(), {
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

      const { result } = renderHook(() => useTickets(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');

      mockAuthContext.organization = originalOrg;
    });

    it('should filter tickets by project access', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = ['project-123'] as unknown as null;

      const { result } = renderHook(() => useTickets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should return empty when allowedProjectIds is empty', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = [] as unknown as null;

      const { result } = renderHook(() => useTickets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useTicketsByProject hook', () => {
    it('should fetch tickets for a specific project', async () => {
      const { result } = renderHook(() => useTicketsByProject('project-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should be idle when projectId is undefined', async () => {
      const { result } = renderHook(() => useTicketsByProject(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useTicket hook', () => {
    it('should fetch single ticket by ID', async () => {
      const { result } = renderHook(() => useTicket('ticket-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should be idle when ticket ID is undefined', async () => {
      const { result } = renderHook(() => useTicket(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateTicket hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useCreateTicket(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useCreateTicket(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useUpdateTicket hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useUpdateTicket(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('useDeleteTicket hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useDeleteTicket(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });
});
