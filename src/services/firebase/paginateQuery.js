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
} from 'firebase/firestore';
import { PAGE_SIZE } from '../../domain/constants';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { validatePageSize } from '../../domain/validation';

/** The requested page size (PAGE_SIZE when omitted), or INVALID_PAGE_SIZE. */
export function resolvePageSize(pageSize = PAGE_SIZE) {
  const error = validatePageSize(pageSize);
  if (error) throw new ServiceError(error);
  return pageSize;
}

/**
 * Turns a cursor into the document `startAfter` needs.
 * @returns {Promise<import('firebase/firestore').DocumentSnapshot|null>} Null for a first page.
 */
export async function readCursor(db, collectionName, cursor = null) {
  if (cursor === null) return null;
  // An id with "/" would point at another collection instead of failing.
  if (typeof cursor !== 'string' || cursor === '' || cursor.includes('/')) {
    throw new ServiceError(ErrorCode.INVALID_CURSOR);
  }
  const snapshot = await getDoc(doc(db, collectionName, cursor));
  if (!snapshot.exists()) throw new ServiceError(ErrorCode.INVALID_CURSOR);
  return snapshot;
}

/**
 * One page of a collection query, plus the total for "Page X of Y".
 * @template T
 * @param {object} options
 * @param {import('firebase/firestore').Firestore} options.db
 * @param {string} options.collectionName
 * @param {import('firebase/firestore').QueryFieldFilterConstraint[]} options.filters `where`s.
 * @param {import('firebase/firestore').QueryOrderByConstraint[]} options.orders `orderBy`s;
 *   they need a matching composite index in `firestore.indexes.json`.
 * @param {import('../contracts').PageRequest} [options.page]
 * @param {(snapshot: import('firebase/firestore').QueryDocumentSnapshot) => T} options.mapDocument
 * @returns {Promise<import('../contracts').Page<T>>}
 */
export default async function paginateQuery({
  db,
  collectionName,
  filters,
  orders,
  page = {},
  mapDocument,
}) {
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
