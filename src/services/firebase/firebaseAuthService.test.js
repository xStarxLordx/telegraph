import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../../domain/errors';
import createFirebaseAuthService from './firebaseAuthService';

// A small in-memory Firebase: just enough Auth and Firestore for the service to run against.
const fake = vi.hoisted(() => {
  const state = {};
  const firebaseError = (code) => Object.assign(new Error(`Firebase: ${code}`), { code });

  const reset = () => {
    Object.assign(state, {
      docs: new Map(), // "collection/id" -> data
      accounts: new Map(), // email -> { uid, password }
      authCallbacks: new Set(),
      auth: { currentUser: null, authStateReady: () => Promise.resolve() },
      google: { uid: 'google-1', email: 'gina@example.com', displayName: 'Gina Google' },
      nextUid: 1,
      deletedUids: [],
      unreadablePaths: new Set(),
      beforeTransaction: null,
      popupError: null,
    });
  };
  reset();

  const emitAuth = () =>
    state.authCallbacks.forEach((callback) =>
      queueMicrotask(() => callback(state.auth.currentUser)),
    );
  const signInAs = (user) => {
    state.auth.currentUser = user;
    emitAuth();
    return { user };
  };
  const getDoc = async (ref) => {
    if (state.unreadablePaths.has(ref.path)) throw firebaseError('permission-denied');
    const data = state.docs.get(ref.path);
    return { exists: () => data !== undefined, data: () => data };
  };

  const authModule = {
    GoogleAuthProvider: class GoogleAuthProvider {},
    onAuthStateChanged: (auth, callback) => {
      state.authCallbacks.add(callback);
      queueMicrotask(() => callback(state.auth.currentUser));
      return () => state.authCallbacks.delete(callback);
    },
    createUserWithEmailAndPassword: async (auth, email, password) => {
      if (state.accounts.has(email)) throw firebaseError('auth/email-already-in-use');
      const uid = `user-${state.nextUid}`;
      state.nextUid += 1;
      state.accounts.set(email, { uid, password });
      return signInAs({ uid, email, displayName: null });
    },
    signInWithEmailAndPassword: async (auth, email, password) => {
      const account = state.accounts.get(email);
      if (!account || account.password !== password) throw firebaseError('auth/invalid-credential');
      return signInAs({ uid: account.uid, email, displayName: null });
    },
    signInWithPopup: async () => {
      if (state.popupError) throw firebaseError(state.popupError);
      return signInAs({ ...state.google });
    },
    signOut: async () => signInAs(null),
    deleteUser: async (user) => {
      state.accounts.delete(user.email);
      state.deletedUids.push(user.uid);
      signInAs(null);
    },
  };

  // Only the query the service runs: documents of one collection whose field equals a value.
  const getDocs = async (search) => {
    if (state.unreadablePaths.has(search.collection)) throw firebaseError('permission-denied');
    const docs = [...state.docs]
      .filter(([path]) => path.startsWith(`${search.collection}/`))
      .filter(([, data]) => data[search.field] === search.value)
      .map(([, data]) => ({ data: () => data }));
    return { empty: docs.length === 0, docs };
  };

  const firestoreModule = {
    doc: (db, collectionName, id) => ({ path: `${collectionName}/${id}` }),
    collection: (db, collectionName) => ({ collection: collectionName }),
    where: (field, operator, value) => ({ field, operator, value }),
    limit: (count) => ({ limit: count }),
    query: (source, filter) => ({ ...source, ...filter }),
    getDoc,
    getDocs,
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    runTransaction: async (db, update) => {
      state.beforeTransaction?.();
      const writes = [];
      await update({ get: getDoc, set: (ref, data) => writes.push([ref.path, data]) });
      writes.forEach(([path, data]) => state.docs.set(path, data));
    },
  };

  return { state, reset, authModule, firestoreModule };
});

vi.mock('firebase/auth', () => fake.authModule);
vi.mock('firebase/firestore', () => fake.firestoreModule);

const { state } = fake;
const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const REGISTRATION = {
  fullName: ' Ada Lovelace ',
  username: '@Ada',
  email: 'ada@example.com',
  password: 'telegraph1',
};
const ADA = { id: 'user-1', fullName: 'Ada Lovelace', username: 'Ada', email: 'ada@example.com' };

let service;
let emissions;

/** Subscribes like AuthProvider does and records everything the UI would see. */
async function watchSession() {
  emissions = [];
  service.onAuthStateChanged((user) => emissions.push(user));
  await flush();
}

const failureOf = (promise) =>
  promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error) => error,
  );

beforeEach(() => {
  fake.reset();
  service = createFirebaseAuthService({ auth: state.auth, db: {} });
});

describe('register', () => {
  it('creates the account, claims the username and logs in', async () => {
    await watchSession();
    const user = await service.register(REGISTRATION);

    expect(user).toEqual(ADA);
    // A single document, keyed by the lowercase username, holds the whole account.
    expect([...state.docs.keys()]).toEqual(['users/ada']);
    expect(state.docs.get('users/ada')).toEqual({
      uid: 'user-1',
      fullName: 'Ada Lovelace',
      username: 'Ada',
      email: 'ada@example.com',
      createdAt: 'SERVER_TIMESTAMP',
    });
  });

  it('never shows the half-created account to the UI (no username yet)', async () => {
    await watchSession();
    await service.register(REGISTRATION);
    await flush();
    expect(emissions).toEqual([null, ADA]);
  });

  it('rejects a taken username before creating anything', async () => {
    state.docs.set('users/ada', { uid: 'someone', email: 'other@example.com' });
    const error = await failureOf(service.register(REGISTRATION));

    expect(error.code).toBe(ErrorCode.USERNAME_TAKEN);
    expect(error.field).toBe('username');
    expect(state.accounts.size).toBe(0);
  });

  it('rejects a taken email and creates no profile', async () => {
    state.accounts.set('ada@example.com', { uid: 'someone', password: 'x' });
    const error = await failureOf(service.register(REGISTRATION));

    expect(error.code).toBe(ErrorCode.EMAIL_TAKEN);
    expect(error.field).toBe('email');
    expect(state.docs.size).toBe(0);
  });

  it('deletes the new Auth user when someone claims the username in between', async () => {
    await watchSession();
    state.beforeTransaction = () =>
      state.docs.set('users/ada', { uid: 'someone', email: 'other@example.com' });
    const error = await failureOf(service.register(REGISTRATION));
    await flush();

    expect(error.code).toBe(ErrorCode.USERNAME_TAKEN);
    expect(state.deletedUids).toEqual(['user-1']);
    expect(state.accounts.size).toBe(0);
    expect(state.docs.get('users/ada').uid).toBe('someone'); // the other account keeps it
    expect(emissions).toEqual([null]);
  });

  it('validates the input like the mock does, with the field to blame', async () => {
    const error = await failureOf(service.register({ ...REGISTRATION, username: 'no spaces' }));

    expect(error.code).toBe(ErrorCode.USERNAME_INVALID);
    expect(error.field).toBe('username');
    expect(state.accounts.size).toBe(0);
  });
});

describe('loginWithUsername', () => {
  beforeEach(async () => {
    await service.register(REGISTRATION);
    await service.logout();
  });

  it('resolves the username to its email and logs in, ignoring case and "@"', async () => {
    const user = await service.loginWithUsername({ username: ' @ADA ', password: 'telegraph1' });
    expect(user).toEqual(ADA);
    expect(state.auth.currentUser.email).toBe('ada@example.com');
  });

  it('gives the same error for an unknown username and a wrong password', async () => {
    const unknown = await failureOf(
      service.loginWithUsername({ username: 'ghost', password: 'telegraph1' }),
    );
    const wrongPassword = await failureOf(
      service.loginWithUsername({ username: 'ada', password: 'nope-nope' }),
    );

    expect(unknown.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(wrongPassword.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(state.auth.currentUser).toBeNull();
  });

  it('treats a malformed username as unknown without touching Firestore', async () => {
    state.unreadablePaths.add('users/a/b');
    const error = await failureOf(service.loginWithUsername({ username: 'a/b', password: 'x' }));
    expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('signs out again when the profile of a valid login cannot be read', async () => {
    state.unreadablePaths.add('users'); // the search by uid; the username document stays readable
    const error = await failureOf(
      service.loginWithUsername({ username: 'ada', password: 'telegraph1' }),
    );

    expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(state.auth.currentUser).toBeNull();
  });
});

describe('loginWithGoogle', () => {
  it('asks a first-time Google account for a username, then remembers it', async () => {
    await watchSession();
    const first = await service.loginWithGoogle();
    expect(first.needsUsername).toBe(true);
    expect(first.user).toEqual({
      id: 'google-1',
      fullName: 'Gina Google',
      username: null,
      email: 'gina@example.com',
    });

    const claimed = await service.claimUsername('gina_g');
    expect(claimed.username).toBe('gina_g');
    expect(state.docs.get('users/gina_g')).toEqual({
      uid: 'google-1',
      fullName: 'Gina Google',
      username: 'gina_g',
      email: 'gina@example.com',
      createdAt: 'SERVER_TIMESTAMP',
    });

    await service.logout();
    const again = await service.loginWithGoogle();
    expect(again.needsUsername).toBe(false);
    expect(again.user.username).toBe('gina_g');
    await flush();
    expect(emissions.map((user) => user?.username ?? null)).toEqual([
      null,
      null,
      'gina_g',
      null,
      'gina_g',
    ]);
  });

  it('reports a closed popup as a cancelled login', async () => {
    state.popupError = 'auth/popup-closed-by-user';
    const error = await failureOf(service.loginWithGoogle());
    expect(error.code).toBe(ErrorCode.LOGIN_CANCELLED);
  });
});

describe('claimUsername', () => {
  it('needs a logged-in user', async () => {
    const error = await failureOf(service.claimUsername('ada'));
    expect(error.code).toBe(ErrorCode.NOT_AUTHENTICATED);
  });

  it('rejects an invalid or taken username, and a second claim', async () => {
    state.docs.set('users/taken', { uid: 'someone', email: 'other@example.com' });
    await service.loginWithGoogle();

    const invalid = await failureOf(service.claimUsername('x'));
    expect(invalid.code).toBe(ErrorCode.USERNAME_INVALID);
    const taken = await failureOf(service.claimUsername('Taken'));
    expect(taken.code).toBe(ErrorCode.USERNAME_TAKEN);
    expect(taken.field).toBe('username');

    await service.claimUsername('gina_g');
    const second = await failureOf(service.claimUsername('another'));
    expect(second.code).toBe(ErrorCode.USERNAME_ALREADY_SET);
  });
});

describe('session', () => {
  it('restores a persisted session when the app starts', async () => {
    state.docs.set('users/ada', { uid: 'user-1', fullName: 'Ada Lovelace', username: 'Ada' });
    state.auth.currentUser = { uid: 'user-1', email: 'ada@example.com', displayName: null };

    await watchSession();
    expect(emissions).toEqual([ADA]);
    expect(await service.getCurrentUser()).toEqual(ADA);
  });

  it('reports a logged-out start as null', async () => {
    await watchSession();
    expect(emissions).toEqual([null]);
    expect(await service.getCurrentUser()).toBeNull();
  });

  it('tells the UI about logout', async () => {
    await service.register(REGISTRATION);
    await watchSession();
    expect(emissions).toEqual([ADA]);

    await service.logout();
    expect(emissions).toEqual([ADA, null]);
    expect(await service.getCurrentUser()).toBeNull();
  });

  it('stops notifying a listener once it unsubscribes', async () => {
    const seen = [];
    const unsubscribe = service.onAuthStateChanged((user) => seen.push(user));
    await flush();
    unsubscribe();

    await service.register(REGISTRATION);
    await flush();
    expect(seen).toEqual([null]);
  });
});
