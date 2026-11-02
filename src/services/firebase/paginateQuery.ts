// Cursor pagination over Firestore (M3-01). The web SDK has no offset, so a page is
// `startAfter(<last document already shown>)` + `limit`, and the cursor the UI keeps is that
// document's id (the contract's opaque `nextCursor`, same as the mocks).
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  startAfter,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { PAGE_SIZE } from '../../domain/constants';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { validatePageSize } from '../../domain/validation';
import type { PaginateQueryOptions } from '../../interfaces/firebase';
import type { Page } from '../../interfaces/pagination';

/** The requested page size (PAGE_SIZE when omitted), or INVALID_PAGE_SIZE. */
export function resolvePageSize(pageSize: number = PAGE_SIZE) {
  const error = validatePageSize(pageSize);
  if (error) throw new ServiceError(error);
  return pageSize;
}

/** Turns a cursor into the document `startAfter` needs; null for a first page. */
export async function readCursor(
  db: Firestore,
  collectionName: string,
  cursor: string | null = null,
): Promise<DocumentSnapshot | null> {
  if (cursor === null) return null;
  // An id with "/" would point at another collection instead of failing.
  if (typeof cursor !== 'string' || cursor === '' || cursor.includes('/')) {
    throw new ServiceError(ErrorCode.INVALID_CURSOR);
  }
  const snapshot = await getDoc(doc(db, collectionName, cursor));
  if (!snapshot.exists()) throw new ServiceError(ErrorCode.INVALID_CURSOR);
  return snapshot;
}

/** One page of a collection query, plus the total for "Page X of Y". */
export default async function paginateQuery<T>({
  db,
  collectionName,
  filters,
  orders,
  page = {},
  mapDocument,
}: PaginateQueryOptions<T>): Promise<Page<T>> {
  const size = resolvePageSize(page.pageSize);
  const after = await readCursor(db, collectionName, page.cursor);
  const source = collection(db, collectionName);
  // One extra document tells whether another page exists without counting twice.
  const [result, count] = await Promise.all([
    getDocs(
      query(source, ...filters, ...orders, ...(after ? [startAfter(after)] : []), limit(size + 1)),
    ),
    getCountFromServer(query(source, ...filters)),
  ]);
  const shown = result.docs.slice(0, size);
  return {
    items: shown.map(mapDocument),
    nextCursor: result.docs.length > size ? shown[size - 1].id : null,
    total: count.data().count,
  };
}
