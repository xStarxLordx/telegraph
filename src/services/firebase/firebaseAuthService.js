// Firebase AuthService (see contracts.js). Firebase Authentication owns credentials and the
// session (kept in the browser until signOut); Cloud Firestore owns the profile and the username
// in one document, `users/{usernameLower}`: its key is what makes a username unique.
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ErrorCode, ServiceError } from '../../domain/errors';
import {
  cleanUsername,
  normalizeUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from '../../domain/validation';
import Collection from './collections';
import mapFirebaseError from './mapFirebaseError';
import { findProfileByUid } from './profiles';

function assertValid(field, code) {
  if (code) throw new ServiceError(code, { field });
}

/** Google accounts have a display name; email accounts only have what they registered with. */
function fallbackFullName(firebaseUser) {
  return firebaseUser.displayName?.trim() || firebaseUser.email?.split('@')[0] || '';
}

/** `undefined` means "nothing published yet", which is different from "logged out" (null). */
function isSameUser(previous, next) {
  if (previous === undefined) return false;
  if (previous === null || next === null) return previous === next;
  return (
    previous.id === next.id &&
    previous.fullName === next.fullName &&
    previous.username === next.username &&
    previous.email === next.email
  );
}

/**
 * @param {{ auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }} deps
 * @returns {import('../contracts').AuthService}
 */
export default function createFirebaseAuthService({ auth, db }) {
  const listeners = new Set();
  const notified = new WeakSet(); // listeners that already received a value
  let current; // last user published to the listeners (undefined until the first one)
  let revision = 0; // identifies the latest refresh, so a slow older one can't overwrite it
  let registering = false; // the Auth user exists before its profile does: don't publish yet
  let listening = false;

  const profileRef = (usernameLower) => doc(db, Collection.USERS, usernameLower);

  const publish = (user) => {
    if (isSameUser(current, user)) return;
    current = user;
    listeners.forEach((listener) => {
      notified.add(listener);
      listener(user);
    });
  };

  /** Builds the CurrentUser for the signed-in Firebase user; no profile yet means no username. */
  const readCurrentUser = async (firebaseUser) => {
    const profile = await findProfileByUid(db, firebaseUser.uid);
    return {
      id: firebaseUser.uid,
      fullName: profile?.fullName ?? fallbackFullName(firebaseUser),
      username: profile?.username ?? null,
      email: firebaseUser.email ?? profile?.email ?? '',
    };
  };

  /** Reads the session from Firebase, publishes it to the listeners and returns it. */
  const refresh = async () => {
    revision += 1;
    const mine = revision;
    const firebaseUser = auth.currentUser;
    let user = null;
    try {
      user = firebaseUser ? await readCurrentUser(firebaseUser) : null;
    } catch (error) {
      if (mine === revision) publish(null);
      throw mapFirebaseError(error);
    }
    if (mine === revision) publish(user);
    return user;
  };

  const startListening = () => {
    if (listening) return;
    listening = true;
    onAuthStateChanged(auth, () => {
      if (registering) return;
      refresh().catch((error) => {
        // Nothing awaits this refresh, so a profile that can't be read (rules, network) would
        // otherwise vanish silently and look like a plain logout.
        // eslint-disable-next-line no-console
        console.error('Could not load the signed-in user.', error.cause ?? error);
      });
    });
  };

  /** After a sign-in: publish the session, or sign out again if its profile can't be read. */
  const finishSignIn = async () => {
    try {
      return await refresh();
    } catch (error) {
      await signOut(auth).catch(() => {});
      throw error;
    }
  };

  /**
   * Creates the profile under the username's key in a transaction, so two people can never get
   * the same username: the second one finds the document already there.
   */
  const claimUsernameFor = (firebaseUser, { username, fullName }) => {
    const ref = profileRef(normalizeUsername(username));
    return runTransaction(db, async (transaction) => {
      if ((await transaction.get(ref)).exists()) {
        throw new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' });
      }
      transaction.set(ref, {
        uid: firebaseUser.uid,
        fullName,
        username: cleanUsername(username),
        email: firebaseUser.email,
        createdAt: serverTimestamp(),
      });
    });
  };

  const createAccount = async ({ fullName, username, email, password }) => {
    // Fast feedback before creating anything; the transaction below is the real guarantee.
    if ((await getDoc(profileRef(normalizeUsername(username)))).exists()) {
      throw new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' });
    }
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await claimUsernameFor(user, { username, fullName: fullName.trim() });
    } catch (error) {
      // Auth calls can't join a Firestore transaction: undo the account so no orphan is left.
      await deleteUser(user).catch(() => {});
      throw error;
    }
  };

  return {
    async getCurrentUser() {
      await auth.authStateReady();
      return refresh();
    },

    onAuthStateChanged(listener) {
      listeners.add(listener);
      startListening();
      // Like Firebase: the known state is reported asynchronously right after subscribing.
      // Before it is known, the first publish reaches this listener.
      queueMicrotask(() => {
        if (current === undefined || !listeners.has(listener) || notified.has(listener)) return;
        notified.add(listener);
        listener(current);
      });
      return () => {
        listeners.delete(listener);
      };
    },

    async register({ fullName, username, email, password }) {
      assertValid('fullName', validateFullName(fullName));
      assertValid('username', validateUsername(username));
      assertValid('email', validateEmail(email));
      assertValid('password', validatePassword(password));
      let failure = null;
      registering = true;
      try {
        await createAccount({ fullName, username, email, password });
      } catch (error) {
        failure = mapFirebaseError(error);
      }
      registering = false;
      if (failure) {
        // If undoing the account failed too, the session must show the leftover account (it has
        // no username, so the guards send it to choose one).
        await refresh().catch(() => {});
        throw failure;
      }
      return finishSignIn();
    },

    async loginWithUsername({ username, password }) {
      // A malformed username can't exist: same answer as an unknown one (and it keeps invalid
      // document ids away from Firestore).
      if (validateUsername(username) || !password) {
        throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
      }
      try {
        const snapshot = await getDoc(profileRef(normalizeUsername(username)));
        // Same error for unknown user and wrong password: don't reveal which usernames exist.
        if (!snapshot.exists()) throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
        await signInWithEmailAndPassword(auth, snapshot.data().email, password);
      } catch (error) {
        throw mapFirebaseError(error);
      }
      return finishSignIn();
    },

    async loginWithGoogle() {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (error) {
        throw mapFirebaseError(error);
      }
      const user = await finishSignIn();
      return { user, needsUsername: user.username === null };
    },

    async claimUsername(username) {
      await auth.authStateReady();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
      assertValid('username', validateUsername(username));
      try {
        // A transaction can't run queries, so "this account already has a username" is checked
        // first. It only guards against the same user claiming twice (e.g. a double click).
        if (await findProfileByUid(db, firebaseUser.uid)) {
          throw new ServiceError(ErrorCode.USERNAME_ALREADY_SET);
        }
        await claimUsernameFor(firebaseUser, {
          username,
          fullName: fallbackFullName(firebaseUser),
        });
      } catch (error) {
        throw mapFirebaseError(error);
      }
      return refresh();
    },

    async logout() {
      try {
        await signOut(auth);
      } catch (error) {
        throw mapFirebaseError(error);
      }
      await refresh();
    },
  };
}
