import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { BreadcrumbBar } from './BreadcrumbBar';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const ITEMS = [
  { label: 'Home', href: '/home' },
  { label: 'Dashboard', href: '/dashboard', active: true },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe('BreadcrumbBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all breadcrumb labels', async () => {
    render(<BreadcrumbBar items={ITEMS} />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Home')).not.toBeNull();
    expect(screen.getByText('Dashboard')).not.toBeNull();
  });

  it('renders links with correct href attributes', async () => {
    render(<BreadcrumbBar items={ITEMS} />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Home').closest('a')?.getAttribute('href')).toBe('/home');
    expect(screen.getByText('Dashboard').closest('a')?.getAttribute('href')).toBe('/dashboard');
  });

  it('active item receives primary text styling', async () => {
    const { container } = render(<BreadcrumbBar items={ITEMS} />, { wrapper: Wrapper });
    await act(async () => {});
    const activeLink = container.querySelector('a[href="/dashboard"]');
    expect(activeLink?.className).toContain('text-primary');
  });

  it('non-active items do not have primary text styling', async () => {
    const { container } = render(<BreadcrumbBar items={ITEMS} />, { wrapper: Wrapper });
    await act(async () => {});
    const homeLink = container.querySelector('a[href="/home"]');
    expect(homeLink?.className).not.toContain('text-primary');
  });

  it('renders a separator between items', async () => {
    const { container } = render(<BreadcrumbBar items={ITEMS} />, { wrapper: Wrapper });
    await act(async () => {});
    const separators = container.querySelectorAll('nav ol li span');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('renders a single item without a separator', async () => {
    const { container } = render(
      <BreadcrumbBar items={[{ label: 'Home', href: '/home', active: true }]} />,
      { wrapper: Wrapper }
    );
    await act(async () => {});
    expect(screen.getByText('Home')).not.toBeNull();
    expect(container.querySelectorAll('nav ol li span').length).toBe(0);
  });
});
