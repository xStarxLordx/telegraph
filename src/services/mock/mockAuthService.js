// Mock AuthService (see contracts.js). Passwords are stored in plain text because this is
// demo data only; Firebase Authentication replaces this in M2-03.
import { ErrorCode, ServiceError } from '../../domain/errors';
import {
  normalizeUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from '../../domain/validation';
import { toCurrentUser } from './mappers';

const GOOGLE_DEMO_EMAIL = 'google.demo@telegraph.test';

function assertValid(field, code) {
  if (code) throw new ServiceError(code, { field });
}

/**
 * @param {{ db: ReturnType<import('./mockDatabase').default>,
 *   delay: () => Promise<void>, now: () => Date }} deps
 * @returns {import('../contracts').AuthService}
 */
export default function createMockAuthService({ db, delay, now }) {
  const currentUser = () => {
    const user = db.sessionUser();
    return user ? toCurrentUser(user) : null;
  };

  // The database notifies session changes (login, logout, reset) to every subscriber.
  const startSession = (userId) => {
    db.setSession(userId);
    return currentUser();
  };

  const assertUsernameFree = (username) => {
    if (db.findUserByUsername(username)) {
      throw new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' });
    }
  };

  return {
    async getCurrentUser() {
      await delay();
      return currentUser();
    },

    onAuthStateChanged(listener) {
      let active = true;
      // Like Firebase: the current state is reported asynchronously right after subscribing.
      queueMicrotask(() => {
        if (active) listener(currentUser());
      });
      const unsubscribe = db.subscribeSession(() => listener(currentUser()));
      return () => {
        active = false;
        unsubscribe();
      };
    },

    async register({ fullName, username, email, password }) {
      await delay();
      assertValid('fullName', validateFullName(fullName));
      assertValid('username', validateUsername(username));
      assertValid('email', validateEmail(email));
      assertValid('password', validatePassword(password));
      assertUsernameFree(username);
      if (db.findUserByEmail(email)) {
        throw new ServiceError(ErrorCode.EMAIL_TAKEN, { field: 'email' });
      }
      const user = {
        id: db.nextId('user', 'u'),
        fullName: fullName.trim(),
        username: normalizeUsername(username),
        email: email.trim().toLowerCase(),
        createdAt: now().toISOString(),
      };
      db.insertUser(user, password);
      return startSession(user.id);
    },

    async loginWithUsername({ username, password }) {
      await delay();
      const user = db.findUserByUsername(username);
      // Same error for unknown user and wrong password: don't reveal which usernames exist.
      if (!user || !db.passwordMatches(user.id, password)) {
        throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
      }
      return startSession(user.id);
    },

    async loginWithGoogle() {
      await delay();
      let user = db.findUserByEmail(GOOGLE_DEMO_EMAIL);
      if (!user) {
        user = {
          id: db.nextId('user', 'u'),
          fullName: 'Google Demo',
          username: null,
          email: GOOGLE_DEMO_EMAIL,
          createdAt: now().toISOString(),
        };
        db.insertUser(user);
      }
      const current = startSession(user.id);
      return { user: current, needsUsername: current.username === null };
    },

    async claimUsername(username) {
      await delay();
      const user = db.sessionUser();
      if (!user) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
      if (user.username !== null) throw new ServiceError(ErrorCode.USERNAME_ALREADY_SET);
      assertValid('username', validateUsername(username));
      assertUsernameFree(username);
      db.updateUser(user.id, { username: normalizeUsername(username) });
      return startSession(user.id);
    },

    async logout() {
      await delay();
      db.setSession(null);
    },
  };
}
