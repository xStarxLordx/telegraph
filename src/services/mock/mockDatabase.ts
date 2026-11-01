// In-memory database for the mock services, persisted to an injected Web Storage.
// Demo limitation: the whole state is one blob loaded once, so two tabs writing at the same
// time overwrite each other. Firebase (M2) has no such issue.
import { normalizeUsername } from '../../domain/validation';
import type { MockDatabase, MockDatabaseOptions, MockState } from '../../interfaces/mock';
import type { KeyValueStorage } from '../../interfaces/storage';
import { createSeedState, SEED_SCHEMA_VERSION } from './seed';

export const MOCK_STORAGE_KEY = 'telegraph.mock.v1';

function isValidState(value: unknown): value is MockState {
  if (value === null || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    state.schemaVersion === SEED_SCHEMA_VERSION &&
    ['users', 'tweets', 'follows'].every((key) => Array.isArray(state[key])) &&
    ['passwords', 'counters'].every((key) => state[key] !== null && typeof state[key] === 'object')
  );
}

function loadState(storage: KeyValueStorage, storageKey: string): MockState {
  try {
    const saved: unknown = JSON.parse(storage.getItem(storageKey) ?? 'null');
    if (isValidState(saved)) return saved;
  } catch {
    // Corrupt or unreadable data: fall back to the seed below.
  }
  return createSeedState();
}

export default function createMockDatabase({
  storage,
  storageKey = MOCK_STORAGE_KEY,
}: MockDatabaseOptions): MockDatabase {
  let state = loadState(storage, storageKey);
  // Each subscription gets its own entry, so the same function can subscribe twice safely.
  const sessionListeners = new Set<{ listener: () => void }>();

  const save = () => {
    try {
      storage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Quota or privacy errors: keep working in memory for this session.
    }
  };

  // Listeners run asynchronously and one by one, like Firebase's: a throwing listener can't
  // undo or interrupt the write that triggered it.
  const emitSessionChange = () => {
    sessionListeners.forEach((entry) => {
      queueMicrotask(() => {
        if (sessionListeners.has(entry)) entry.listener();
      });
    });
  };

  const db: MockDatabase = {
    get state() {
      return state;
    },
    subscribeSession(listener) {
      const entry = { listener };
      sessionListeners.add(entry);
      return () => {
        sessionListeners.delete(entry);
      };
    },
    reset() {
      state = createSeedState();
      save();
      emitSessionChange();
    },
    // Writes go through these methods so services never mutate the state directly,
    // and every change is persisted.
    setSession(userId) {
      state.session = userId === null ? null : { userId };
      save();
      emitSessionChange();
    },
    insertUser(user, password = null) {
      state.users.push(user);
      if (password !== null) state.passwords[user.id] = password;
      save();
    },
    updateUser(id, changes) {
      const user = state.users.find((candidate) => candidate.id === id);
      if (user) Object.assign(user, changes);
      save();
    },
    insertTweet(tweet) {
      state.tweets.push(tweet);
      save();
    },
    insertFollow(follow) {
      state.follows.push(follow);
      save();
    },
    passwordMatches(userId, password) {
      // Accounts without a password (Google) never match, not even `undefined === undefined`.
      const stored = state.passwords[userId];
      return typeof stored === 'string' && stored === password;
    },
    nextId(entity, prefix) {
      state.counters[entity] += 1;
      return `${prefix}${String(state.counters[entity]).padStart(3, '0')}`;
    },
    sessionUser() {
      return state.session ? db.findUserById(state.session.userId) : null;
    },
    findUserById(id) {
      return state.users.find((user) => user.id === id) ?? null;
    },
    findUserByUsername(username) {
      const wanted = normalizeUsername(username);
      return state.users.find((user) => user.username?.toLowerCase() === wanted) ?? null;
    },
    findUserByEmail(email) {
      const wanted = email.trim().toLowerCase();
      return state.users.find((user) => user.email.toLowerCase() === wanted) ?? null;
    },
  };
  return db;
}
