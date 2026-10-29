import { beforeEach, describe, expect, it } from 'vitest';
import firestoreModule, { fakeFirestore, Timestamp } from './fakeFirestore';

// The fake underpins every Firebase service test, so its own behavior is pinned down here.
const { collection, documentId, getCountFromServer, getDocs, limit, orderBy, query, startAfter } =
  firestoreModule;
const { where } = firestoreModule;

const at = (minutes) => Timestamp.fromDate(new Date(Date.UTC(2026, 9, 28, 12, minutes)));
const failureOf = (promise) =>
  promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error) => error,
  );

beforeEach(() => {
  fakeFirestore.reset();
  fakeFirestore.set('tweets/a', { authorId: 'u1', createdAt: at(1) });
  fakeFirestore.set('tweets/b', { authorId: 'u1', createdAt: at(2) });
  fakeFirestore.set('tweets/c', { authorId: 'u2', createdAt: at(2) }); // ties with b
  fakeFirestore.set('tweets/d', { authorId: 'u2', createdAt: at(3) });
  fakeFirestore.set('tweets/e', { authorId: 'u3' }); // no createdAt
});

const idsOf = async (...constraints) =>
  (await getDocs(query(collection({}, 'tweets'), ...constraints))).docs.map((doc) => doc.id);

describe('fakeFirestore queries', () => {
  it('orders newest first and breaks ties by document id in the same direction', async () => {
    const ids = await idsOf(where('authorId', 'in', ['u1', 'u2']), orderBy('createdAt', 'desc'));
    expect(ids).toEqual(['d', 'c', 'b', 'a']);
  });

  it('leaves out documents that lack the field being ordered by', async () => {
    const ids = await idsOf(where('authorId', '==', 'u3'), orderBy('createdAt', 'desc'));
    expect(ids).toEqual([]);
  });

  it('continues after a cursor document, including across a tie', async () => {
    const cursor = await firestoreModule.getDoc(firestoreModule.doc({}, 'tweets', 'c'));
    const ids = await idsOf(
      where('authorId', 'in', ['u1', 'u2']),
      orderBy('createdAt', 'desc'),
      startAfter(cursor),
      limit(10),
    );
    expect(ids).toEqual(['b', 'a']);
  });

  it('filters by document id and counts like getDocs', async () => {
    const byId = where(documentId(), 'in', ['a', 'd', 'missing']);
    expect(await idsOf(byId)).toEqual(['a', 'd']);
    const count = await getCountFromServer(query(collection({}, 'tweets'), byId));
    expect(count.data().count).toBe(2);
  });
});

describe('fakeFirestore query errors', () => {
  it('rejects an "in" filter with more than 30 values or none', async () => {
    const many = Array.from({ length: 31 }, (_, index) => `u${index}`);
    expect((await failureOf(idsOf(where('authorId', 'in', many)))).code).toBe('invalid-argument');
    expect((await failureOf(idsOf(where('authorId', 'in', [])))).code).toBe('invalid-argument');
  });

  it('rejects a query whose composite index is not in firestore.indexes.json', async () => {
    const error = await failureOf(idsOf(where('authorId', '==', 'u1'), orderBy('body')));
    expect(error.code).toBe('failed-precondition');
  });

  it('accepts the indexed query, and its reverse', async () => {
    await expect(
      idsOf(where('authorId', '==', 'u1'), orderBy('createdAt', 'desc')),
    ).resolves.toBeDefined();
    await expect(
      idsOf(where('authorId', '==', 'u1'), orderBy('createdAt', 'asc')),
    ).resolves.toBeDefined();
    await expect(idsOf(orderBy('createdAt'))).resolves.toBeDefined(); // single field: automatic
  });

  it('writes a server timestamp as the current fake time', async () => {
    fakeFirestore.state.now = () => new Date('2027-01-01T00:00:00Z');
    const ref = await firestoreModule.addDoc(collection({}, 'tweets'), {
      createdAt: firestoreModule.serverTimestamp(),
    });
    expect(fakeFirestore.get(ref.path).createdAt.toDate().toISOString()).toBe(
      '2027-01-01T00:00:00.000Z',
    );
  });
});
