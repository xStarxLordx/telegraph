import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, getBrowserStorage } from './storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getBrowserStorage', () => {
  it('returns window.localStorage when it works', () => {
    const localStorage = createMemoryStorage();
    vi.stubGlobal('window', { localStorage });
    expect(getBrowserStorage()).toBe(localStorage);
  });

  it('falls back to memory storage when localStorage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: () => {
          throw new Error('SecurityError');
        },
      },
    });
    const storage = getBrowserStorage();
    storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');
  });
});
