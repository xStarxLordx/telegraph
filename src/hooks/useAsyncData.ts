import { useEffect, useState } from 'react';
import type { AsyncDataResult, AsyncDataState } from '../interfaces/hooks';

/**
 * Runs `load` and exposes its result. Memoize `load` (useCallback): a new function loads again,
 * so its dependencies decide when the data refreshes. While it reloads, the previous data stays
 * available; late results of an old `load` are ignored.
 */
export default function useAsyncData<T>(load: () => Promise<T>): AsyncDataState<T> {
  // Each result remembers which `load` produced it, so "loading" is derived, not stored.
  const [result, setResult] = useState<AsyncDataResult<T>>({
    load: null,
    data: undefined,
    error: null,
  });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setResult({ load, data, error: null });
      },
      (error: unknown) => {
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
