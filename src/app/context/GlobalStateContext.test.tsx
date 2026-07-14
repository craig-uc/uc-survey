import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { GlobalStateProvider, useGlobalState } from './GlobalStateContext';

function TestConsumer() {
  const { user, isHydrated, logout } = useGlobalState();
  return (
    <div>
      <span data-testid="user">{user ?? 'null'}</span>
      <span data-testid="hydrated">{isHydrated ? 'yes' : 'no'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('GlobalStateContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <GlobalStateProvider>
        <div data-testid="child">hello</div>
      </GlobalStateProvider>
    );
    expect(screen.getByTestId('child').textContent).toBe('hello');
  });

  it('sets isHydrated to true after mount', async () => {
    render(
      <GlobalStateProvider>
        <TestConsumer />
      </GlobalStateProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId('hydrated').textContent).toBe('yes');
  });

  it('hydrates user from localStorage on mount', async () => {
    localStorage.setItem('user', 'jane@example.com');

    render(
      <GlobalStateProvider>
        <TestConsumer />
      </GlobalStateProvider>
    );
    await act(async () => {});

    expect(screen.getByTestId('user').textContent).toBe('jane@example.com');
  });

  it('logout clears user state and removes localStorage keys', async () => {
    localStorage.setItem('user', 'jane@example.com');

    render(
      <GlobalStateProvider>
        <TestConsumer />
      </GlobalStateProvider>
    );
    await act(async () => {});

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('throws when useGlobalState is called outside GlobalStateProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const BadConsumer = () => {
      useGlobalState();
      return <div />;
    };

    expect(() => render(<BadConsumer />)).toThrow(
      'useGlobalState must be used within a GlobalStateProvider'
    );

    consoleSpy.mockRestore();
  });
});
