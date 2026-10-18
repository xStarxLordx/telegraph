import { useCallback, useState } from 'react';

/**
 * Wraps an async action (submit, follow…) with its pending and error state.
 * `run` never throws: it resolves to `{ ok: true, value }` or `{ ok: false, error }`, and the
 * error also stays in `error` until the next run or `clearError()`.
 * @template T
 * @param {(...args: any[]) => Promise<T>} action
 */
export default function useAsyncAction(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
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
