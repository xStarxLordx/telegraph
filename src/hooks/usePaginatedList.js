import { useCallback, useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE } from '../domain/constants';

const EMPTY_PAGE = { items: [], total: 0, nextCursor: null };

/**
 * Pages through a cursor-paginated service list (`{ items, nextCursor, total }`, see
 * contracts.js), PAGE_SIZE items at a time. Keeps a stack with the cursor of every visited
 * page, so "Previous" goes back without offsets (Firestore has none).
 *
 * @template T
 * @param {(request: { cursor: string|null, pageSize: number })
 *   => Promise<import('../services/contracts').Page<T>>} fetchPage Memoize it (useCallback):
 *   a new function restarts the list from the first page.
 */
export default function usePaginatedList(fetchPage) {
  const [source, setSource] = useState(() => fetchPage);
  const [cursors, setCursors] = useState([null]);
  const [reloadToken, setReloadToken] = useState(0);
  // The last settled request and its outcome; "loading" means it isn't the current request.
  const [settled, setSettled] = useState({ request: null, page: EMPTY_PAGE, error: null });

  // A different source (e.g. another user's tweets) starts over from page 1.
  if (source !== fetchPage) {
    setSource(() => fetchPage);
    setCursors([null]);
    setSettled({ request: null, page: EMPTY_PAGE, error: null });
  }

  const pageIndex = cursors.length - 1;
  const request = useMemo(
    () => ({ fetchPage, cursor: cursors[pageIndex], pageIndex, reloadToken }),
    [fetchPage, cursors, pageIndex, reloadToken],
  );

  useEffect(() => {
    let active = true;
    request.fetchPage({ cursor: request.cursor, pageSize: PAGE_SIZE }).then(
      (page) => {
        if (!active) return;
        // The page emptied since it was visited (e.g. after a reload): step back one page.
        if (page.items.length === 0 && request.pageIndex > 0) {
          setCursors((stack) => stack.slice(0, -1));
          return;
        }
        setSettled({ request, page, error: null });
      },
      (error) => {
        if (active) setSettled((previous) => ({ ...previous, request, error }));
      },
    );
    return () => {
      active = false;
    };
  }, [request]);

  const loading = settled.request !== request;
  const { page } = settled;

  const next = useCallback(() => {
    if (loading || !page.nextCursor) return;
    setCursors((stack) => [...stack, page.nextCursor]);
  }, [loading, page.nextCursor]);

  const prev = useCallback(() => {
    if (loading) return;
    setCursors((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }, [loading]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  /** Back to page 1 (e.g. after an invalid cursor), reloading it. */
  const first = useCallback(() => {
    setCursors([null]);
    setReloadToken((token) => token + 1);
  }, []);

  return {
    // While another page loads, the previous page's items stay visible.
    items: page.items,
    total: page.total,
    page: pageIndex + 1,
    totalPages: Math.max(1, Math.ceil(page.total / PAGE_SIZE)),
    hasNext: page.nextCursor !== null,
    hasPrev: pageIndex > 0,
    next,
    prev,
    loading,
    /** True once a page of the current source has loaded (totals are meaningful). */
    settled: settled.request !== null && settled.error === null,
    error: loading ? null : settled.error,
    reload,
    first,
  };
}
