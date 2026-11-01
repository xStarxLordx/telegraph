import { useCallback, useState } from 'react';
import type { AsyncActionResult, AsyncActionState } from '../interfaces/hooks';

/**
 * Wraps an async action (submit, follow…) with its pending and error state.
 * `run` never throws: it resolves to `{ ok: true, value }` or `{ ok: false, error }`, and the
 * error also stays in `error` until the next run or `clearError()`.
 */
export default function useAsyncAction<A extends unknown[], T>(
  action: (...args: A) => Promise<T>,
): AsyncActionState<A, T> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async (...args: A): Promise<AsyncActionResult<T>> => {
      setPending(true);
      setError(null);
      try {
        const value = await action(...args);
        return { ok: true, value };
      } catch (actionError) {
        setError(actionError);
        return { ok: false, error: actionError };
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
