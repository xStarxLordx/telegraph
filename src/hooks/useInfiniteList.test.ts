// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE } from '../domain/constants';
import { ErrorCode, ServiceError } from '../domain/errors';
import type { InfiniteList, PageFetcher } from '../interfaces/hooks';
import type { Identifiable, PageRequest } from '../interfaces/pagination';
import paginateArray from '../services/paginateArray';
import useInfiniteList from './useInfiniteList';

function createSource(count: number) {
  const items = Array.from({ length: count }, (_, index) => ({ id: `item-${index + 1}` }));
  return {
    items,
    fetchPage: vi.fn(async (request: PageRequest) => paginateArray(items, request)),
  };
}

async function renderList(fetchPage: PageFetcher<Identifiable>) {
  const view = renderHook(({ source }) => useInfiniteList(source), {
    initialProps: { source: fetchPage },
  });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

const ids = (result: { current: InfiniteList<Identifiable> }) =>
  result.current.items.map((item) => item.id);

async function loadMore(result: { current: InfiniteList<Identifiable> }) {
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.loading).toBe(false));
}

describe('useInfiniteList', () => {
  it('handles an empty list', async () => {
    const { result } = await renderList(createSource(0).fetchPage);

    expect(result.current.items).toEqual([]);
    expect(result.current).toMatchObject({ total: 0, hasMore: false, error: null, settled: true });
  });

  it('starts with one page of 10 and knows there is more', async () => {
    const source = createSource(25);
    const { result } = await renderList(source.fetchPage);

    expect(result.current.items).toHaveLength(PAGE_SIZE);
    expect(result.current).toMatchObject({ total: 25, hasMore: true, loadingMore: false });
    expect(source.fetchPage).toHaveBeenCalledWith({ cursor: null, pageSize: PAGE_SIZE });
  });

  it('appends each page after the previous ones, with no repeats and no gaps', async () => {
    const source = createSource(25);
    const { result } = await renderList(source.fetchPage);

    await loadMore(result);
    expect(result.current.items).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);

    await loadMore(result);
    expect(ids(result)).toEqual(source.items.map((item) => item.id));
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps the items on screen while the next page loads', async () => {
    const { result } = await renderList(createSource(25).fetchPage);

    act(() => result.current.loadMore());

    expect(result.current).toMatchObject({ loading: true, loadingMore: true });
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('ignores loadMore() at the end of the list and while a page is loading', async () => {
    const source = createSource(12);
    const { result } = await renderList(source.fetchPage);

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(source.fetchPage).toHaveBeenCalledTimes(2);

    act(() => result.current.loadMore());
    expect(source.fetchPage).toHaveBeenCalledTimes(2);
    expect(result.current.items).toHaveLength(12);
  });

  it('drops an item the next page repeats', async () => {
    const pages = [
      { items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'b', total: 3 },
      { items: [{ id: 'b' }, { id: 'c' }], nextCursor: null, total: 3 },
    ];
    const fetchPage = vi.fn(async ({ cursor }: PageRequest) => pages[cursor === 'b' ? 1 : 0]);
    const { result } = await renderList(fetchPage);

    await loadMore(result);

    expect(ids(result)).toEqual(['a', 'b', 'c']);
  });

  it('keeps what was loaded when a page fails, and retries the same page', async () => {
    const source = createSource(25);
    let calls = 0;
    const failing = vi.fn(async (request: PageRequest) => {
      calls += 1;
      if (calls === 2) throw new ServiceError(ErrorCode.NETWORK_UNAVAILABLE);
      return paginateArray(source.items, request);
    });
    const { result } = await renderList(failing);

    await loadMore(result);
    expect(result.current.error).toMatchObject({ code: ErrorCode.NETWORK_UNAVAILABLE });
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(20));
    expect(result.current.error).toBeNull();
  });

  it('starts over from the first page when the source changes', async () => {
    const first = createSource(25);
    const second = createSource(3);
    const view = await renderList(first.fetchPage);
    await loadMore(view.result);
    expect(view.result.current.items).toHaveLength(20);

    view.rerender({ source: second.fetchPage });
    await waitFor(() => expect(ids(view.result)).toEqual(['item-1', 'item-2', 'item-3']));

    expect(view.result.current).toMatchObject({ total: 3, hasMore: false });
  });
});
