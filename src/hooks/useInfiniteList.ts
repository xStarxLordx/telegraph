import { useCallback, useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE } from '../domain/constants';
import type {
  InfiniteList,
  InfiniteRequest,
  PageFetcher,
  SettledInfiniteLoad,
} from '../interfaces/hooks';
import type { Identifiable } from '../interfaces/pagination';

const EMPTY: SettledInfiniteLoad<never> = {
  request: null,
  items: [],
  nextCursor: null,
  total: 0,
  error: null,
};

export default function useInfiniteList<T extends Identifiable>(
  fetchPage: PageFetcher<T>,
): InfiniteList<T> {
  const [source, setSource] = useState(() => fetchPage);
  const [request, setRequest] = useState<InfiniteRequest<T>>(() => ({
    fetchPage,
    cursor: null,
    token: 0,
  }));
  const [settled, setSettled] = useState<SettledInfiniteLoad<T>>(EMPTY);

  if (source !== fetchPage) {
    setSource(() => fetchPage);
    setRequest({ fetchPage, cursor: null, token: 0 });
    setSettled(EMPTY);
  }

  useEffect(() => {
    let active = true;
    request.fetchPage({ cursor: request.cursor, pageSize: PAGE_SIZE }).then(
      (page) => {
        if (!active) return;
        setSettled((previous) => {
          const known = new Set(request.cursor === null ? [] : previous.items.map(({ id }) => id));
          const fresh = page.items.filter(({ id }) => !known.has(id));
          return {
            request,
            items: request.cursor === null ? fresh : [...previous.items, ...fresh],
            nextCursor: page.nextCursor,
            total: page.total,
            error: null,
          };
        });
      },
      (error: unknown) => {
        if (active) setSettled((previous) => ({ ...previous, request, error }));
      },
    );
    return () => {
      active = false;
    };
  }, [request]);

  const loading = settled.request !== request;
  const { nextCursor } = settled;

  const loadMore = useCallback(() => {
    if (loading || nextCursor === null) return;
    setRequest((current) => ({ ...current, cursor: nextCursor, token: current.token + 1 }));
  }, [loading, nextCursor]);

  const retry = useCallback(() => {
    setRequest((current) => ({ ...current, token: current.token + 1 }));
  }, []);

  return useMemo(
    () => ({
      items: settled.items,
      total: settled.total,
      hasMore: nextCursor !== null,
      loading,
      loadingMore: loading && settled.items.length > 0,
      settled: settled.request !== null && settled.error === null,
      error: loading ? null : settled.error,
      loadMore,
      retry,
    }),
    [settled, nextCursor, loading, loadMore, retry],
  );
}
