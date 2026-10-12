import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../../domain/errors';
import paginateArray from './paginateArray';

const items = (n) => Array.from({ length: n }, (_, i) => ({ id: `i${i}` }));
const ids = (page) => page.items.map((item) => item.id);

describe('paginateArray', () => {
  it('returns an empty first page for an empty list', () => {
    expect(paginateArray([])).toEqual({ items: [], nextCursor: null, total: 0 });
  });

  it('fits exactly 10 items in one page', () => {
    const page = paginateArray(items(10));
    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toBeNull();
  });

  it('splits 11 items into two pages, using the last id as the cursor', () => {
    const first = paginateArray(items(11));
    expect(first.items).toHaveLength(10);
    expect(first.nextCursor).toBe('i9');
    expect(first.total).toBe(11);
    const second = paginateArray(items(11), { cursor: first.nextCursor });
    expect(ids(second)).toEqual(['i10']);
    expect(second.nextCursor).toBeNull();
  });

  it('continues after the cursor item even if new items were added on top (startAfter)', () => {
    const list = items(15);
    const first = paginateArray(list);
    const withNewTop = [{ id: 'new' }, ...list];
    const second = paginateArray(withNewTop, { cursor: first.nextCursor });
    expect(ids(second)).toEqual(['i10', 'i11', 'i12', 'i13', 'i14']);
  });

  it('honors a custom page size', () => {
    expect(ids(paginateArray(items(5), { pageSize: 2 }))).toEqual(['i0', 'i1']);
  });

  it.each([0, 11, 2.5, null, '5'])('rejects the page size %s', (pageSize) => {
    expect(() => paginateArray(items(5), { pageSize })).toThrow(
      expect.objectContaining({ code: ErrorCode.INVALID_PAGE_SIZE }),
    );
  });

  it.each(['unknown', '', '0'])('rejects the unknown cursor %j', (cursor) => {
    expect(() => paginateArray(items(5), { cursor })).toThrow(
      expect.objectContaining({ code: ErrorCode.INVALID_CURSOR }),
    );
  });
});
