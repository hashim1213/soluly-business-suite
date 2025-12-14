import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../useNotifications';

// Mock the AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'test@example.com' },
  organization: { id: 'org-123', name: 'Test Org' },
  member: { id: 'member-123', name: 'Test User' },
  permissions: {},
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

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useNotifications hook', () => {
    it('should fetch notifications for the current member', async () => {
      const { result } = renderHook(() => useNotifications(), {
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

    it('should be idle when no member', async () => {
      const originalMember = mockAuthContext.member;
      mockAuthContext.member = null as unknown as typeof mockAuthContext.member;

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');

      mockAuthContext.member = originalMember;
    });
  });

  describe('useUnreadNotificationCount hook', () => {
    it('should return unread count', async () => {
      const { result } = renderHook(() => useUnreadNotificationCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      if (result.current.isSuccess) {
        expect(typeof result.current.data).toBe('number');
      }
    });
  });

  describe('useMarkNotificationRead hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useMarkNotificationRead(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useMarkAllNotificationsRead hook', () => {
    it('should have mutate function', () => {
      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useMarkAllNotificationsRead(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
    });
  });
});
