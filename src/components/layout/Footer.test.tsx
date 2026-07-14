import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { Footer } from './Footer';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe('Footer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when there is no authenticated user', async () => {
    const { container } = render(<Footer />, { wrapper: Wrapper });
    await act(async () => {});
    expect(container.querySelector('footer')).toBeNull();
  });

  it('renders nothing when user exists but showFooter is false', async () => {
    localStorage.setItem('user', 'john@example.com');
    // footer not set → showFooter remains false

    const { container } = render(<Footer />, { wrapper: Wrapper });
    await act(async () => {});
    expect(container.querySelector('footer')).toBeNull();
  });

  it('renders footer when user is authenticated and showFooter is true', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');

    const { container } = render(<Footer />, { wrapper: Wrapper });
    await act(async () => {});
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('displays default copyright text', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');

    render(<Footer copyright="© 2025 Test Corp" />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('© 2025 Test Corp')).not.toBeNull();
  });

  it('displays default poweredBy text', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');

    render(<Footer poweredBy="Powered by URUP" />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Powered by URUP')).not.toBeNull();
  });

  it('shows tagline text when showTag is true', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');
    localStorage.setItem('tagLine', '1');
    localStorage.setItem('tag', 'Data-driven decisions');

    render(<Footer />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Data-driven decisions')).not.toBeNull();
  });

  it('hides tagline text when showTag is false', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');
    // tagLine not set → showTag remains false

    render(<Footer tagline="Hidden tagline" />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.queryByText('Hidden tagline')).toBeNull();
  });

  it('renders navigation links when provided', async () => {
    localStorage.setItem('user', 'john@example.com');
    localStorage.setItem('footer', '1');
    const links = [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ];

    render(<Footer links={links} />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Privacy')).not.toBeNull();
    expect(screen.getByText('Terms')).not.toBeNull();
  });
});
