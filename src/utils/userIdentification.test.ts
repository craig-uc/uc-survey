import { describe, it, expect, beforeEach } from 'vitest';
import { getAnonymousUserId } from './userIdentification';

describe('getAnonymousUserId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a non-empty UUID and persists it to localStorage', () => {
    const id = getAnonymousUserId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(localStorage.getItem('instance')).toBe(id);
  });

  it('returns the same ID on repeated calls', () => {
    const id1 = getAnonymousUserId();
    const id2 = getAnonymousUserId();
    expect(id1).toBe(id2);
  });

  it('returns existing ID from localStorage without overwriting it', () => {
    const existing = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    localStorage.setItem('instance', existing);
    expect(getAnonymousUserId()).toBe(existing);
  });

  it('returns empty string when window is undefined (SSR context)', () => {
    const originalWindow = global.window;
    // @ts-expect-error — simulate SSR environment
    delete global.window;
    expect(getAnonymousUserId()).toBe('');
    global.window = originalWindow;
  });
});
