// Cursor pagination with Firestore `startAfter` semantics, shared by every list.

export interface PageRequest {
  /**
   * Opaque `nextCursor` from the previous page; null/omitted = first page. Pages continue after
   * that item, so new items never shift later pages. An unknown cursor throws INVALID_CURSOR.
   */
  cursor?: string | null;
  /** Integer from 1 to PAGE_SIZE (10, the default). Anything else throws INVALID_PAGE_SIZE. */
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  /** Null when this is the last page. */
  nextCursor: string | null;
  /** Total items across all pages (for "Page X of Y"). */
  total: number;
}

/** Anything a cursor can point at. */
export interface Identifiable {
  id: string;
}
