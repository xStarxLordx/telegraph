// The test doubles in src/test/: an in-memory `firebase/firestore` and a minimal Firebase Auth.

/** A stored document's fields. */
export type FakeData = Record<string, unknown>;

export interface FakeRow {
  id: string;
  data: FakeData;
}

export interface FakeDocRef {
  id: string;
  path: string;
}

export interface FakeCollectionRef {
  collection: string;
}

export interface FakeSnapshot {
  id: string;
  ref: FakeDocRef;
  exists(): boolean;
  data(): FakeData | undefined;
}

export type SortDirection = 'asc' | 'desc';

export interface FakeWhere {
  kind: 'where';
  field: string;
  operator: string;
  value: unknown;
}

export interface FakeOrderBy {
  kind: 'orderBy';
  field: string;
  direction: SortDirection;
}

export interface FakeLimit {
  kind: 'limit';
  count: number;
}

export interface FakeStartAfter {
  kind: 'startAfter';
  snapshot: FakeSnapshot;
}

export type FakeConstraint = FakeWhere | FakeOrderBy | FakeLimit | FakeStartAfter;

export interface FakeQuery {
  collection: string;
  wheres: FakeWhere[];
  orders: FakeOrderBy[];
  limit: number | null;
  /** The cursor document, already read. */
  after: FakeRow | null;
}

export interface FakeFirestoreState {
  /** "collection/id" -> data. */
  docs: Map<string, FakeData>;
  /** Every query that ran, for assertions. */
  queries: FakeQuery[];
  nextAutoId: number;
  /** The server's clock. */
  now: () => Date;
  /** Runs when a transaction starts, to simulate a concurrent write. */
  beforeTransaction: (() => void) | null;
}

export interface FakeTransaction {
  get(ref: FakeDocRef): Promise<FakeSnapshot>;
  set(ref: FakeDocRef, data: FakeData): void;
}

/** Just the part of Firebase Auth the services use. Change `currentUser` to switch accounts. */
export interface FakeAuth {
  currentUser: { uid: string } | null;
  authStateReady(): Promise<void>;
}

/** A profile stored for the tests. */
export interface TestAccount {
  uid: string;
  username: string;
  fullName: string;
}
