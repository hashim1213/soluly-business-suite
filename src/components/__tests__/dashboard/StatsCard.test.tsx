import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { Activity } from 'lucide-react';
import { StatsCard } from '../../dashboard/StatsCard';

// Mock the useOrgNavigation hook
vi.mock('@/hooks/useOrgNavigation', () => ({
  useOrgNavigation: () => ({
    getOrgPath: (path: string) => `/test-org${path}`,
    currentOrgSlug: 'test-org',
  }),
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('StatsCard', () => {
  it('should render title and value', () => {
    renderWithRouter(
      <StatsCard title="Total Projects" value={42} icon={Activity} />
    );

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render string value', () => {
    renderWithRouter(
      <StatsCard title="Revenue" value="$10,000" icon={Activity} />
    );

    expect(screen.getByText('$10,000')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    renderWithRouter(
      <StatsCard
        title="Total Projects"
        value={42}
        icon={Activity}
        description="Active projects this month"
      />
    );

    expect(screen.getByText('Active projects this month')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    renderWithRouter(
      <StatsCard title="Total Projects" value={42} icon={Activity} />
    );

    expect(screen.queryByText('Active projects this month')).not.toBeInTheDocument();
  });

  it('should render positive trend', () => {
    renderWithRouter(
      <StatsCard
        title="Total Projects"
        value={42}
        icon={Activity}
        trend={{ value: 12, isPositive: true }}
      />
    );

    expect(screen.getByText('↑ 12% from last month')).toBeInTheDocument();
  });

  it('should render negative trend', () => {
    renderWithRouter(
      <StatsCard
        title="Total Projects"
        value={42}
        icon={Activity}
        trend={{ value: 8, isPositive: false }}
      />
    );

    expect(screen.getByText('↓ 8% from last month')).toBeInTheDocument();
  });

  it('should render as a link when href is provided', () => {
    renderWithRouter(
      <StatsCard
        title="Total Projects"
        value={42}
        icon={Activity}
        href="/projects"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test-org/projects');
  });

  it('should not render as a link when href is not provided', () => {
    renderWithRouter(
      <StatsCard title="Total Projects" value={42} icon={Activity} />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = renderWithRouter(
      <StatsCard title="Total Projects" value={42} icon={Activity} />
    );

    // Check that SVG icon is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
