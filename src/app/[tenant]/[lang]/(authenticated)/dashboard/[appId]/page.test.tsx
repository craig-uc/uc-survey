import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import DashboardPage from './page';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';
import * as NextNavigation from 'next/navigation';
import { useTenant } from '@/features/tenant';

const defaultParams = new URLSearchParams({ name: 'My App', application_id: 'aid-123' });
const mockSearchParams = defaultParams;

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
  })),
  graphic: {
    LinearGradient: vi.fn(function LinearGradient() {}),
  },
}));

vi.mock('@/features/tenant', () => ({
  useTenant: vi.fn(),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useTenant).mockReturnValue({ tenant: 'acme', tenantCode: 'acme', setTenant: vi.fn() });
    vi.mocked(NextNavigation.useSearchParams).mockReturnValue(
      defaultParams as ReturnType<typeof NextNavigation.useSearchParams>
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the app name as the page heading', async () => {
    render(<DashboardPage params={{ appId: 'test-app' }} />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getAllByText('My App').length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs with Home and the app name', async () => {
    render(<DashboardPage params={{ appId: 'test-app' }} />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getByText('Home')).not.toBeNull();
    const appLabel = screen.getAllByText('My App');
    expect(appLabel.length).toBeGreaterThan(0);
  });

  it('does not call the timeline API when application_id is absent', async () => {
    vi.mocked(NextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams({ name: 'My App' }) as ReturnType<typeof NextNavigation.useSearchParams>
    );

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<DashboardPage params={{ appId: 'test-app' }} />, { wrapper: Wrapper });
    await act(async () => {});

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows the appId in the dashboard details section', async () => {
    render(<DashboardPage params={{ appId: 'my-unique-app-id' }} />, { wrapper: Wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByText(/my-unique-app-id/i)).not.toBeNull();
    });
  });
});
