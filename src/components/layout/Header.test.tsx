import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { Header } from './Header';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';
import { useTenant } from '@/features/tenant';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/features/tenant', () => ({
  useTenant: vi.fn(),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useTenant).mockReturnValue({ tenant: 'urup', tenantCode: 'urup', setTenant: vi.fn() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: 'Logout' }) }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders nothing when no user is authenticated', async () => {
    const { container } = render(<Header />, { wrapper: Wrapper });
    await act(async () => {});
    expect(container.querySelector('header')).toBeNull();
  });

  it('renders the header element when a user is present', async () => {
    localStorage.setItem('user', 'john@example.com');

    render(<Header />, { wrapper: Wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByRole('banner')).not.toBeNull();
    });
  });

  it('displays the app title from localStorage', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('title', 'My Analytics App');

    render(<Header />, { wrapper: Wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByText('My Analytics App')).not.toBeNull();
    });
  });

  it('falls back to "UC Survey" when no title is in localStorage', async () => {
    localStorage.setItem('user', 'john@example.com');

    render(<Header />, { wrapper: Wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByText('UC Survey')).not.toBeNull();
    });
  });

  it('renders the Logout button when authenticated', async () => {
    localStorage.setItem('user', 'john@example.com');

    render(<Header />, { wrapper: Wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).not.toBeNull();
    });
  });
});
