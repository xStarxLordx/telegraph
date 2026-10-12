import { afterEach, describe, expect, it, vi } from 'vitest';
import createAppServices from '../services/createAppServices';
import { createMemoryStorage, getBrowserStorage } from './storage';

afterEach(() => {
  vi.useRealTimers();
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

describe('createAppServices', () => {
  it('builds working services backed by the browser storage', async () => {
    const localStorage = createMemoryStorage();
    vi.stubGlobal('window', { localStorage });
    vi.useFakeTimers();
    const services = createAppServices();
    const pending = services.userService.getUserByUsername('ada');
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ username: 'ada' });
  });
});
