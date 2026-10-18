import { useEffect, useState } from 'react';

/**
 * Runs `load` and exposes its result. Memoize `load` (useCallback): a new function loads again,
 * so its dependencies decide when the data refreshes. While it reloads, the previous data stays
 * available; late results of an old `load` are ignored.
 * @template T
 * @param {() => Promise<T>} load
 * @returns {{ data: T|undefined, loading: boolean, error: unknown }}
 */
export default function useAsyncData(load) {
  // Each result remembers which `load` produced it, so "loading" is derived, not stored.
  const [result, setResult] = useState({ load: null, data: undefined, error: null });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setResult({ load, data, error: null });
      },
      (error) => {
        if (active) setResult({ load, data: undefined, error });
      },
    );
    return () => {
      active = false;
    };
  }, [load]);

  const loading = result.load !== load;
  return { data: result.data, loading, error: loading ? null : result.error };
}
