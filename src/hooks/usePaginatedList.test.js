// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE } from '../domain/constants';
import { ErrorCode, ServiceError } from '../domain/errors';
import paginateArray from '../services/mock/paginateArray';
import usePaginatedList from './usePaginatedList';

/** A fetchPage over an in-memory array, with the same cursor semantics as the services. */
function createSource(count) {
  const items = Array.from({ length: count }, (_, index) => ({ id: `item-${index + 1}` }));
  return {
    items,
    fetchPage: vi.fn(async (request) => paginateArray(items, request)),
  };
}

async function renderList(fetchPage) {
  const view = renderHook(({ source }) => usePaginatedList(source), {
    initialProps: { source: fetchPage },
  });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

const ids = (result) => result.current.items.map((item) => item.id);

describe('usePaginatedList', () => {
  it('handles an empty list', async () => {
    const { result } = await renderList(createSource(0).fetchPage);
    expect(result.current.items).toEqual([]);
    expect(result.current).toMatchObject({
      page: 1,
      totalPages: 1,
      total: 0,
      hasNext: false,
      hasPrev: false,
      error: null,
    });
  });

  it('shows exactly 10 items on a single page', async () => {
    const source = createSource(10);
    const { result } = await renderList(source.fetchPage);
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    expect(result.current).toMatchObject({ page: 1, totalPages: 1, hasNext: false });
    expect(source.fetchPage).toHaveBeenCalledWith({ cursor: null, pageSize: 10 });
  });

  it('splits 11 items into two pages and goes forward and back', async () => {
    const { result } = await renderList(createSource(11).fetchPage);
    expect(result.current).toMatchObject({ page: 1, totalPages: 2, hasNext: true, hasPrev: false });

    act(() => result.current.next());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ids(result)).toEqual(['item-11']);
    expect(result.current).toMatchObject({ page: 2, hasNext: false, hasPrev: true });

    act(() => result.current.prev());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ids(result)).toHaveLength(10);
    expect(ids(result)[0]).toBe('item-1');
    expect(result.current).toMatchObject({ page: 1, hasPrev: false });
  });

  it('ignores next() on the last page and prev() on the first', async () => {
    const source = createSource(3);
    const { result } = await renderList(source.fetchPage);
    act(() => {
      result.current.next();
      result.current.prev();
    });
    expect(result.current.page).toBe(1);
    expect(source.fetchPage).toHaveBeenCalledTimes(1);
  });

  it('reloads the current page after a mutation', async () => {
    const source = createSource(5);
    const { result } = await renderList(source.fetchPage);
    source.items.unshift({ id: 'new' });

    act(() => result.current.reload());
    await waitFor(() => expect(ids(result)[0]).toBe('new'));
    expect(result.current.total).toBe(6);
  });

  it('steps back when a reloaded page has become empty', async () => {
    const source = createSource(11);
    const { result } = await renderList(source.fetchPage);
    act(() => result.current.next());
    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The last item goes away, so page 2 no longer exists.
    source.fetchPage.mockImplementation(async (request) =>
      request.cursor
        ? { items: [], nextCursor: null, total: 10 }
        : paginateArray(source.items.slice(0, 10), request),
    );
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ totalPages: 1, hasNext: false });
  });

  it('exposes a failing fetch as an error and recovers on reload', async () => {
    const source = createSource(4);
    source.fetchPage.mockRejectedValueOnce(new ServiceError(ErrorCode.UNKNOWN));
    const { result } = await renderList(source.fetchPage);
    expect(result.current.error).toBeInstanceOf(ServiceError);
    expect(result.current.error.code).toBe('unknown');

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(4);
  });

  it('starts over from page 1 when the source changes', async () => {
    const first = createSource(15);
    const view = await renderList(first.fetchPage);
    act(() => view.result.current.next());
    await waitFor(() => expect(view.result.current.page).toBe(2));

    const second = createSource(2);
    view.rerender({ source: second.fetchPage });
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    expect(view.result.current).toMatchObject({ page: 1, total: 2 });
    expect(second.fetchPage).toHaveBeenCalledWith({ cursor: null, pageSize: 10 });
  });

  it('ignores a late response from a previous source', async () => {
    let resolveSlow;
    const slow = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSlow = resolve;
        }),
    );
    const fast = createSource(1);
    const view = renderHook(({ source }) => usePaginatedList(source), {
      initialProps: { source: slow },
    });
    view.rerender({ source: fast.fetchPage });
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    await act(async () => resolveSlow({ items: [{ id: 'stale' }], nextCursor: null, total: 1 }));
    expect(ids(view.result)).toEqual(['item-1']);
  });
});
