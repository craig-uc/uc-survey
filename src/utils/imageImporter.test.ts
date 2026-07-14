import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importAccountImage } from './imageImporter';
import * as imageLoader from './imageLoader';

vi.mock('./imageLoader', () => ({
  loadAccountImage: vi.fn(),
  loadDarkImage: vi.fn(),
}));

describe('importAccountImage', () => {
  beforeEach(() => {
    vi.mocked(imageLoader.loadAccountImage).mockRejectedValue(new Error('Asset not found'));
    vi.mocked(imageLoader.loadDarkImage).mockRejectedValue(new Error('Asset not found'));
  });

  it('returns a Promise', () => {
    const result = importAccountImage('some-account', 'logo.webp');
    expect(result).toBeInstanceOf(Promise);
  });

  it('returns the same Promise object for the same account and image (cache hit)', () => {
    const p1 = importAccountImage('cache-test-account', 'cache-test.webp');
    const p2 = importAccountImage('cache-test-account', 'cache-test.webp');
    expect(p1).toBe(p2);
  });

  it('returns different Promise objects for different keys', () => {
    const p1 = importAccountImage('account-alpha', 'img.webp');
    const p2 = importAccountImage('account-beta', 'img.webp');
    expect(p1).not.toBe(p2);
  });

  it('resolves to empty string when the account image does not exist', async () => {
    const result = await importAccountImage('nonexistent-account-xyz-123', 'nonexistent.webp');
    expect(result).toBe('');
  });

  it('resolves to empty string when account is empty and the dark fallback is also absent', async () => {
    const result = await importAccountImage('', 'also-nonexistent-xyz.webp');
    expect(result).toBe('');
  });

  it('resolves to the image URL when the account image exists', async () => {
    vi.mocked(imageLoader.loadAccountImage).mockResolvedValue({ default: '/assets/logo.webp' });
    const result = await importAccountImage('test-account', 'logo.webp');
    expect(result).toBe('/assets/logo.webp');
  });

  it('falls back to dark image when account image fails', async () => {
    vi.mocked(imageLoader.loadAccountImage).mockRejectedValue(new Error('Not found'));
    vi.mocked(imageLoader.loadDarkImage).mockResolvedValue({ default: '/assets/dark/logo.webp' });
    const result = await importAccountImage('missing-account', 'logo.webp');
    expect(result).toBe('/assets/dark/logo.webp');
  });
});
