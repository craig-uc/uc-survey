import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import RootPage from './page';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';
import { useTenant } from '@/features/tenant';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/tenant', () => ({
  useTenant: vi.fn(),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

const APPS = [
  { appId: 'a1', name: 'Analytics', application_id: 'aid-1' },
  { appId: 'a2', name: 'Reports', application_id: 'aid-2' },
];

describe('Home page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useTenant).mockReturnValue({ tenant: 'acme', tenantCode: 'acme', setTenant: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the Welcome heading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(APPS) })
    );

    render(<RootPage />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getByText(/Welcome to/i)).not.toBeNull();
  });

  it('renders application cards after a successful API fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(APPS) })
    );

    render(<RootPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Analytics')).not.toBeNull();
      expect(screen.getByText('Reports')).not.toBeNull();
    });
  });

  it('handles an applications object with an "applications" property', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ applications: APPS }),
      })
    );

    render(<RootPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Analytics')).not.toBeNull();
    });
  });

  it('shows an error message when the API call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) })
    );

    render(<RootPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Could not load applications/i)).not.toBeNull();
    });
  });

  it('shows an empty state message when no applications are returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    );

    render(<RootPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No applications available/i)).not.toBeNull();
    });
  });

  it('does not call the API when there is no tenant', async () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: 'urup', setTenant: vi.fn() });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<RootPage />, { wrapper: Wrapper });
    await act(async () => {});

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
