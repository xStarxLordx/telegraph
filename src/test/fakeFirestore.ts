// An in-memory stand-in for `firebase/firestore`, for the Firebase service tests. Use it with
//   vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);
// It mirrors how Firestore orders, filters and pages (cursors, ties broken by document id) and
// it rejects what Firestore rejects when a query runs: an `in` with more than 30 values and a
// query that needs a composite index missing from `firestore.indexes.json`. It does NOT run the
// security rules (they need the emulator, which this project doesn't run yet).
import indexConfig from '../../firestore.indexes.json';
import type {
  FakeCollectionRef,
  FakeConstraint,
  FakeData,
  FakeDocRef,
  FakeFirestoreState,
  FakeLimit,
  FakeOrderBy,
  FakeQuery,
  FakeRow,
  FakeSnapshot,
  FakeStartAfter,
  FakeTransaction,
  FakeWhere,
  SortDirection,
} from '../interfaces/testing';

const DOCUMENT_ID = '__name__';
const MAX_IN_VALUES = 30;
const SERVER_TIMESTAMP = Object.freeze({ serverTimestamp: true });

const firebaseError = (code: string, message = code) => Object.assign(new Error(message), { code });

export class Timestamp {
  readonly seconds: number;

  readonly nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static fromMillis(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000);
    return new Timestamp(seconds, Math.round((milliseconds - seconds * 1000) * 1e6));
  }

  static fromDate(date: Date) {
    return Timestamp.fromMillis(date.getTime());
  }

  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }

  toDate() {
    return new Date(this.toMillis());
  }
}

const state: FakeFirestoreState = {
  docs: new Map(),
  queries: [],
  nextAutoId: 1,
  now: () => new Date('2026-10-28T12:00:00Z'),
  beforeTransaction: null,
};

function resolveValues(data: FakeData): FakeData {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value === SERVER_TIMESTAMP) return [key, Timestamp.fromDate(state.now())];
      if (value instanceof Date) return [key, Timestamp.fromDate(value)];
      return [key, value];
    }),
  );
}

export const fakeFirestore = {
  state,
  reset() {
    state.docs.clear();
    state.queries = [];
    state.nextAutoId = 1;
    state.now = () => new Date('2026-10-28T12:00:00Z');
    state.beforeTransaction = null;
  },
  /** Stores a document directly (Date values become Timestamps). */
  set(path: string, data: FakeData) {
    state.docs.set(path, resolveValues(data));
  },
  /** The stored data of a document, or undefined. */
  get(path: string) {
    return state.docs.get(path);
  },
  /** The ids stored in a collection. */
  ids(collectionName: string) {
    return [...state.docs.keys()]
      .filter((path) => path.startsWith(`${collectionName}/`))
      .map((path) => path.slice(collectionName.length + 1));
  },
};

function compareStrings(a: string, b: string) {
  // Firestore orders strings by UTF-8 bytes, which is code-point order.
  const left = [...a];
  const right = [...b];
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const difference = (left[i].codePointAt(0) ?? 0) - (right[i].codePointAt(0) ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return Math.sign(left.length - right.length);
}

function compareValues(a: unknown, b: unknown) {
  if (a instanceof Timestamp && b instanceof Timestamp) {
    return Math.sign(a.seconds - b.seconds) || Math.sign(a.nanoseconds - b.nanoseconds);
  }
  if (typeof a === 'string' && typeof b === 'string') return compareStrings(a, b);
  if (typeof a === 'number' && typeof b === 'number') return Math.sign(a - b);
  throw new Error(`fakeFirestore can't compare ${typeof a} with ${typeof b}`);
}

const valueOf = (row: FakeRow, field: string) => (field === DOCUMENT_ID ? row.id : row.data[field]);

function matches(row: FakeRow, { field, operator, value }: FakeWhere) {
  const actual = valueOf(row, field);
  if (actual === undefined) return false;
  if (operator === '==') return compareValues(actual, value) === 0;
  if (operator === 'in') {
    return (value as unknown[]).some((candidate) => compareValues(actual, candidate) === 0);
  }
  throw new Error(`fakeFirestore doesn't support the "${operator}" operator`);
}

/** Row order: each orderBy in turn, then the document id in the direction of the last one. */
function rowComparator(orders: FakeOrderBy[]) {
  const withTieBreak: Pick<FakeOrderBy, 'field' | 'direction'>[] = [
    ...orders,
    { field: DOCUMENT_ID, direction: orders.at(-1)?.direction ?? 'asc' },
  ];
  return (a: FakeRow, b: FakeRow) => {
    for (let i = 0; i < withTieBreak.length; i += 1) {
      const { field, direction } = withTieBreak[i];
      const difference = compareValues(valueOf(a, field), valueOf(b, field));
      if (difference !== 0) return direction === 'desc' ? -difference : difference;
    }
    return 0;
  };
}

const toIndexOrder = (direction: SortDirection) =>
  direction === 'desc' ? 'DESCENDING' : 'ASCENDING';

/** Firestore builds single-field indexes itself; any equality + orderBy, or 2+ orderBys, is not. */
function assertIndexExists({ collection, wheres, orders }: FakeQuery) {
  const equality = wheres
    .filter(({ field, operator }) => field !== DOCUMENT_ID && ['==', 'in'].includes(operator))
    .map(({ field }) => field);
  const sorted = orders.filter(({ field }) => field !== DOCUMENT_ID);
  if (sorted.length === 0 || (equality.length === 0 && sorted.length === 1)) return;
  const found = indexConfig.indexes.some((index) => {
    if (
      index.collectionGroup !== collection ||
      index.fields.length !== equality.length + sorted.length
    ) {
      return false;
    }
    const head = index.fields.slice(0, equality.length).map(({ fieldPath }) => fieldPath);
    const tail = index.fields.slice(equality.length);
    const sameSet = [...head].sort().join() === [...equality].sort().join();
    const aligned = tail.every(({ fieldPath }, i) => fieldPath === sorted[i].field);
    const sameDirection = tail.every(({ order }, i) => order === toIndexOrder(sorted[i].direction));
    const flipped = tail.every(({ order }, i) => order !== toIndexOrder(sorted[i].direction));
    return sameSet && aligned && (sameDirection || flipped);
  });
  if (!found) {
    throw firebaseError('failed-precondition', 'The query requires an index (fakeFirestore).');
  }
}

function assertQueryIsValid(query: FakeQuery) {
  query.wheres
    .filter(({ operator }) => operator === 'in')
    .forEach(({ value }) => {
      const values = value as unknown[];
      if (values.length === 0 || values.length > MAX_IN_VALUES) {
        throw firebaseError('invalid-argument', `"in" needs 1 to ${MAX_IN_VALUES} values`);
      }
    });
  assertIndexExists(query);
}

function runQuery(query: FakeQuery) {
  assertQueryIsValid(query);
  state.queries.push(query);
  const comparator = rowComparator(query.orders);
  let rows = fakeFirestore
    .ids(query.collection)
    .map((id): FakeRow => ({ id, data: state.docs.get(`${query.collection}/${id}`) ?? {} }))
    .filter((row) => query.wheres.every((where) => matches(row, where)))
    // Firestore leaves out documents that lack a field the query orders by.
    .filter((row) => query.orders.every(({ field }) => valueOf(row, field) !== undefined))
    .sort(comparator);
  const { after } = query;
  if (after) rows = rows.filter((row) => comparator(row, after) > 0);
  return query.limit === null ? rows : rows.slice(0, query.limit);
}

const docRef = (collectionName: string, id: string): FakeDocRef => ({
  id,
  path: `${collectionName}/${id}`,
});

function snapshotOf(collectionName: string, id: string): FakeSnapshot {
  const data = state.docs.get(`${collectionName}/${id}`);
  return {
    id,
    ref: docRef(collectionName, id),
    exists: () => data !== undefined,
    data: () => (data === undefined ? undefined : { ...data }),
  };
}

function cursorOf(constraints: FakeConstraint[]): FakeRow | null {
  const cursor = constraints.find(
    (constraint): constraint is FakeStartAfter => constraint.kind === 'startAfter',
  );
  return cursor ? { id: cursor.snapshot.id, data: cursor.snapshot.data() ?? {} } : null;
}

const firestoreModule = {
  Timestamp,
  collection: (db: unknown, name: string): FakeCollectionRef => ({ collection: name }),
  doc: (db: unknown, collectionName: string, id: string) => docRef(collectionName, id),
  documentId: () => DOCUMENT_ID,
  where: (field: string, operator: string, value: unknown): FakeWhere => ({
    kind: 'where',
    field,
    operator,
    value,
  }),
  orderBy: (field: string, direction: SortDirection = 'asc'): FakeOrderBy => ({
    kind: 'orderBy',
    field,
    direction,
  }),
  limit: (count: number): FakeLimit => ({ kind: 'limit', count }),
  startAfter: (snapshot: FakeSnapshot): FakeStartAfter => ({ kind: 'startAfter', snapshot }),
  query: (source: FakeCollectionRef, ...constraints: FakeConstraint[]): FakeQuery => ({
    collection: source.collection,
    wheres: constraints.filter(
      (constraint): constraint is FakeWhere => constraint.kind === 'where',
    ),
    orders: constraints.filter(
      (constraint): constraint is FakeOrderBy => constraint.kind === 'orderBy',
    ),
    limit:
      constraints.find((constraint): constraint is FakeLimit => constraint.kind === 'limit')
        ?.count ?? null,
    after: cursorOf(constraints),
  }),
  serverTimestamp: () => SERVER_TIMESTAMP,
  getDoc: async (ref: FakeDocRef) => {
    const [collectionName, id] = ref.path.split('/');
    return snapshotOf(collectionName, id);
  },
  getDocs: async (query: FakeQuery) => {
    const docs = runQuery(query).map((row) => snapshotOf(query.collection, row.id));
    return { docs, empty: docs.length === 0, size: docs.length };
  },
  getCountFromServer: async (query: FakeQuery) => ({
    data: () => ({ count: runQuery(query).length }),
  }),
  addDoc: async (source: FakeCollectionRef, data: FakeData) => {
    const id = `auto${String(state.nextAutoId).padStart(4, '0')}`;
    state.nextAutoId += 1;
    state.docs.set(`${source.collection}/${id}`, resolveValues(data));
    return docRef(source.collection, id);
  },
  runTransaction: async <T>(db: unknown, update: (transaction: FakeTransaction) => Promise<T>) => {
    state.beforeTransaction?.();
    const writes: [string, FakeData][] = [];
    const result = await update({
      get: (ref) => firestoreModule.getDoc(ref),
      set: (ref, data) => {
        writes.push([ref.path, data]);
      },
    });
    writes.forEach(([path, data]) => state.docs.set(path, resolveValues(data)));
    return result;
  },
};

export default firestoreModule;
