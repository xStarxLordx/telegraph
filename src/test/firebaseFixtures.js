// Helpers for the Firebase service tests, on top of fakeFirestore.
import { fakeFirestore } from './fakeFirestore';

/** A stand-in for Firebase Auth. Change `currentUser` to switch who is signed in. */
export function createFakeAuth(uid = null) {
  return {
    currentUser: uid ? { uid } : null,
    authStateReady: () => Promise.resolve(),
  };
}

/** Stores the profile an account gets when it registers; returns it. */
export function addAccount({ uid, username, fullName }) {
  fakeFirestore.set(`users/${username.toLowerCase()}`, {
    uid,
    fullName,
    username,
    email: `${username.toLowerCase()}@telegraph.test`,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  });
  return { uid, username, fullName };
}

/** The moment `minute` minutes after a fixed origin, as the fake server's clock. */
export function setClock(minute) {
  fakeFirestore.state.now = () => new Date(Date.UTC(2026, 9, 1, 0, minute));
}

/** Fetches every page of a list and returns them (the contract's `{ items, nextCursor, total }`). */
export async function collectPages(fetchPage) {
  const pages = [];
  let cursor = null;
  do {
    // Pages must be fetched one after the other: each needs the previous cursor.
    // eslint-disable-next-line no-await-in-loop
    const page = await fetchPage({ cursor });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return pages;
}

/** Resolves with the error a promise rejects with (fails the test if it resolves). */
export function failureOf(promise) {
  return promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error) => error,
  );
}
