// Key-value storage with the Web Storage interface (getItem / setItem / removeItem).

/** In-memory storage: used in tests and when the browser blocks localStorage. */
export function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

/**
 * Returns `window.localStorage` when it is usable, otherwise in-memory storage.
 * Access can throw (private mode, blocked site data), so it is probed once.
 */
export function getBrowserStorage() {
  try {
    const probeKey = '__telegraph_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return createMemoryStorage();
  }
}
