import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ProfileEntry } from './ProfileEntry';
import { GlobalStateProvider } from '@/app/context/GlobalStateContext';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: 'dark' })),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe('ProfileEntry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows "Profile" label when showPersonName is false', async () => {
    render(<ProfileEntry />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('Profile')).not.toBeNull();
  });

  it('shows full name (fn) when showPersonName is true', async () => {
    localStorage.setItem('personName', '1');
    localStorage.setItem('fn', 'Jane Smith');

    render(<ProfileEntry />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getByText('Jane Smith')).not.toBeNull();
  });

  it('falls back to first + last name when fn is not set', async () => {
    localStorage.setItem('personName', '1');
    localStorage.setItem('f', 'John');
    localStorage.setItem('l', 'Doe');

    render(<ProfileEntry />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getByText('John Doe')).not.toBeNull();
  });

  it('always renders the profile SVG icon', async () => {
    const { container } = render(<ProfileEntry />, { wrapper: Wrapper });
    await act(async () => {});
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the "-Role-" label', async () => {
    render(<ProfileEntry />, { wrapper: Wrapper });
    await act(async () => {});
    expect(screen.getByText('-Role-')).not.toBeNull();
  });
});
