// Cursor pagination over an already sorted array, with Firestore `startAfter` semantics:
// the cursor is the id of the last item already shown, so inserting a new item at the top
// never shifts or repeats items on the following pages.
import { PAGE_SIZE } from '../../domain/constants';
import { ErrorCode, ServiceError } from '../../domain/errors';

/**
 * @template {{ id: string }} T
 * @param {T[]} items Sorted items.
 * @param {{ cursor?: string|null, pageSize?: number }} [request]
 * @returns {{ items: T[], nextCursor: string|null, total: number }}
 */
export default function paginateArray(items, { cursor = null, pageSize = PAGE_SIZE } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE) {
    throw new ServiceError(ErrorCode.INVALID_PAGE_SIZE);
  }
  let start = 0;
  if (cursor !== null) {
    const cursorIndex = items.findIndex((item) => item.id === cursor);
    if (cursorIndex === -1) throw new ServiceError(ErrorCode.INVALID_CURSOR);
    start = cursorIndex + 1;
  }
  const pageItems = items.slice(start, start + pageSize);
  const hasMore = start + pageSize < items.length;
  return {
    items: pageItems,
    nextCursor: hasMore ? pageItems[pageItems.length - 1].id : null,
    total: items.length,
  };
}
