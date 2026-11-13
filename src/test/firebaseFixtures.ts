// Helpers for the Firebase service tests, on top of fakeFirestore.
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { ServiceError } from '../domain/errors';
import type { FirebaseServiceDeps } from '../interfaces/firebase';
import type { Page, PageRequest } from '../interfaces/pagination';
import type { FakeAuth, TestAccount } from '../interfaces/testing';
import { fakeFirestore } from './fakeFirestore';

/** A stand-in for Firebase Auth. Change `currentUser` to switch who is signed in. */
export function createFakeAuth(uid: string | null = null): FakeAuth {
  return {
    currentUser: uid ? { uid } : null,
    authStateReady: () => Promise.resolve(),
  };
}

/** Stores the profile an account gets when it registers; returns it. */
/**
 * The dependencies of a Firebase service, backed by the fakes: `firebase/firestore` is mocked,
 * so `db` is never read.
 */
export function fakeDeps(auth: FakeAuth | null = null): FirebaseServiceDeps {
  return { auth: auth as unknown as Auth, db: {} as Firestore };
}

export function addAccount({ uid, username, fullName }: TestAccount): TestAccount {
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
export function setClock(minute: number) {
  fakeFirestore.state.now = () => new Date(Date.UTC(2026, 9, 1, 0, minute));
}

/** Fetches every page of a list and returns them (the contract's `{ items, nextCursor, total }`). */
export async function collectPages<T>(
  fetchPage: (request: PageRequest) => Promise<Page<T>>,
): Promise<Page<T>[]> {
  const pages: Page<T>[] = [];
  let cursor: string | null = null;
  do {
    // Pages must be fetched one after the other: each needs the previous cursor.
    // eslint-disable-next-line no-await-in-loop
    const page: Page<T> = await fetchPage({ cursor });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return pages;
}

/** Resolves with the error a promise rejects with (fails the test if it resolves). */
export function failureOf(promise: Promise<unknown>): Promise<ServiceError> {
  return promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error: ServiceError) => error,
  );
}
