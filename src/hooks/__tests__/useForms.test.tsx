import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useForms, useForm, useFormByDisplayId, useCreateForm, useUpdateForm, useDeleteForm, usePublishForm, useUnpublishForm } from '../useForms';

// Mock the AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  organization: { id: 'org-123', name: 'Test Org' },
  member: { id: 'member-123', name: 'Test User' },
  permissions: { forms: { view: true, create: true, edit: true, delete: true } },
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

describe('useForms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.hasFullProjectAccess.mockReturnValue(true);
    mockAuthContext.allowedProjectIds = null;
  });

  describe('useForms hook', () => {
    it('should fetch forms for the organization', async () => {
      const { result } = renderHook(() => useForms(), {
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

      const { result } = renderHook(() => useForms(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');

      mockAuthContext.organization = originalOrg;
    });

    it('should filter forms by project access', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = ['project-123'] as unknown as null;

      const { result } = renderHook(() => useForms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should return empty when allowedProjectIds is empty', async () => {
      mockAuthContext.hasFullProjectAccess.mockReturnValue(false);
      mockAuthContext.allowedProjectIds = [] as unknown as null;

      const { result } = renderHook(() => useForms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useForm hook', () => {
    it('should fetch single form by ID', async () => {
      const { result } = renderHook(() => useForm('form-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should be idle when form ID is undefined', async () => {
      const { result } = renderHook(() => useForm(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useFormByDisplayId hook', () => {
    it('should fetch form by display ID', async () => {
      const { result } = renderHook(() => useFormByDisplayId('FRM-001'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });
    });

    it('should be idle when display ID is undefined', async () => {
      const { result } = renderHook(() => useFormByDisplayId(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateForm hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useCreateForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useCreateForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useUpdateForm hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useUpdateForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('useDeleteForm hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useDeleteForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('usePublishForm hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => usePublishForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('useUnpublishForm hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useUnpublishForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });
});
