import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { PermissionGuard, Can, CanOwn } from '../../auth/PermissionGuard';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const ProtectedContent = () => <div>Protected Content</div>;
const FallbackContent = () => <div>Fallback Content</div>;
const RedirectPage = () => <div>Redirect Page</div>;

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing while loading', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => true),
      isLoading: true,
    });

    const { container } = render(
      <PermissionGuard resource="projects" action="view">
        <ProtectedContent />
      </PermissionGuard>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render children when user has permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => true),
      isLoading: false,
    });

    render(
      <PermissionGuard resource="projects" action="view">
        <ProtectedContent />
      </PermissionGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render default access denied when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
      isLoading: false,
    });

    render(
      <PermissionGuard resource="projects" action="view">
        <ProtectedContent />
      </PermissionGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this feature.")).toBeInTheDocument();
  });

  it('should render custom fallback when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
      isLoading: false,
    });

    render(
      <PermissionGuard resource="projects" action="view" fallback={<FallbackContent />}>
        <ProtectedContent />
      </PermissionGuard>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect when redirectTo is specified and user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PermissionGuard resource="projects" action="view" redirectTo="/redirect">
                <ProtectedContent />
              </PermissionGuard>
            }
          />
          <Route path="/redirect" element={<RedirectPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Redirect Page')).toBeInTheDocument();
  });

  it('should call hasPermission with correct arguments', () => {
    const hasPermissionMock = vi.fn(() => true);
    mockUseAuth.mockReturnValue({
      hasPermission: hasPermissionMock,
      isLoading: false,
    });

    render(
      <PermissionGuard resource="projects" action="create">
        <ProtectedContent />
      </PermissionGuard>
    );

    expect(hasPermissionMock).toHaveBeenCalledWith('projects', 'create');
  });
});

describe('Can', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user has permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => true),
    });

    render(
      <Can resource="tickets" action="create">
        <ProtectedContent />
      </Can>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
    });

    render(
      <Can resource="tickets" action="create">
        <ProtectedContent />
      </Can>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render fallback when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
    });

    render(
      <Can resource="tickets" action="create" fallback={<FallbackContent />}>
        <ProtectedContent />
      </Can>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });
});

describe('CanOwn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user has full view permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => true),
      canViewOwn: vi.fn(() => false),
      member: { id: 'member-123' },
    });

    render(
      <CanOwn resource="tickets" ownerId="other-member">
        <ProtectedContent />
      </CanOwn>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children when user can only view own and is owner', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => true),
      canViewOwn: vi.fn(() => true),
      member: { id: 'member-123' },
    });

    render(
      <CanOwn resource="tickets" ownerId="member-123">
        <ProtectedContent />
      </CanOwn>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user can only view own and is not owner', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
      canViewOwn: vi.fn(() => true),
      member: { id: 'member-123' },
    });

    render(
      <CanOwn resource="tickets" ownerId="other-member">
        <ProtectedContent />
      </CanOwn>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render fallback when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn(() => false),
      canViewOwn: vi.fn(() => true),
      member: { id: 'member-123' },
    });

    render(
      <CanOwn resource="tickets" ownerId="other-member" fallback={<FallbackContent />}>
        <ProtectedContent />
      </CanOwn>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });
});
