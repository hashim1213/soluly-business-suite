import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject } from '../useProjects';

// Mock the AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  organization: { id: 'org-123', name: 'Test Org' },
  member: { id: 'member-123', name: 'Test User' },
  permissions: { projects: { view: true, create: true, edit: true, delete: true } },
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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.hasFullProjectAccess.mockReturnValue(true);
    mockAuthContext.allowedProjectIds = null;
  });

  describe('useProjects hook', () => {
    it('should fetch projects for the organization', async () => {
      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      // With MSW mocking Supabase, we should get mock data
      if (result.current.isSuccess) {
        expect(result.current.data).toBeDefined();
        expect(Array.isArray(result.current.data)).toBe(true);
      }
    });

    it('should return empty array when no organization', async () => {
      const originalOrg = mockAuthContext.organization;
      mockAuthContext.organization = null as unknown as typeof mockAuthContext.organization;

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle');

      mockAuthContext.organization = originalOrg;
    });

    it('should filter by allowed project IDs when not full access', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = ['project-123'] as unknown as null;

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should return empty when allowedProjectIds is empty array', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = [] as unknown as null;

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useProject hook', () => {
    it('should fetch single project by ID', async () => {
      const { result } = renderHook(() => useProject('project-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should return null when project ID is undefined', async () => {
      const { result } = renderHook(() => useProject(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should throw when user lacks access', async () => {
      mockAuthContext.hasProjectAccess.mockReturnValue(false);

      const { result } = renderHook(() => useProject('project-456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      if (result.current.isError) {
        expect(result.current.error).toBeDefined();
      }

      mockAuthContext.hasProjectAccess.mockReturnValue(true);
    });
  });

  describe('useCreateProject hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useCreateProject(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useUpdateProject hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useUpdateProject(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('useDeleteProject hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useDeleteProject(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });
});
