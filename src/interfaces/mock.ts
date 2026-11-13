// What the mock services store and how they are wired together (mock-only, used by the tests).
import type { MediaAttachment } from './media';
import type { Services } from './services';
import type { KeyValueStorage } from './storage';

/** A stored account. Dates are ISO strings, as they are saved to localStorage. */
export interface UserRecord {
  id: string;
  fullName: string;
  /** Null for a Google account that hasn't picked one yet. */
  username: string | null;
  email: string;
  createdAt: string;
}

export interface TweetRecord {
  id: string;
  authorId: string;
  authorFullName: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  media?: MediaAttachment;
}

export interface FollowRecord {
  /** `followerId_followeeId`, so following twice can't create a second record. */
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export interface MockSession {
  userId: string;
}

/** The last id number used per entity, so new records never collide with seeded ones. */
export interface MockCounters {
  user: number;
  tweet: number;
}

/** The whole mock database, saved to storage as one JSON blob. */
export interface MockState {
  schemaVersion: number;
  users: UserRecord[];
  /** Plain-text demo passwords by user id; Google accounts have none. */
  passwords: Record<string, string>;
  tweets: TweetRecord[];
  follows: FollowRecord[];
  session: MockSession | null;
  counters: MockCounters;
}

export interface MockDatabaseOptions {
  storage: KeyValueStorage;
  storageKey?: string;
}

export interface MockDatabase {
  readonly state: MockState;
  /** Returns unsubscribe. */
  subscribeSession(listener: () => void): () => void;
  /** Restores the seed data (useful for demos) and logs out. */
  reset(): void;
  /** Null logs out. */
  setSession(userId: string | null): void;
  /** `password` is null for accounts without one (Google). */
  insertUser(user: UserRecord, password?: string | null): void;
  updateUser(id: string, changes: Partial<UserRecord>): void;
  insertTweet(tweet: TweetRecord): void;
  insertFollow(follow: FollowRecord): void;
  passwordMatches(userId: string, password: string): boolean;
  nextId(entity: keyof MockCounters, prefix: string): string;
  sessionUser(): UserRecord | null;
  findUserById(id: string): UserRecord | null;
  findUserByUsername(username: string): UserRecord | null;
  findUserByEmail(email: string): UserRecord | null;
}

/** What every mock service is built from. */
export interface MockServiceDeps {
  db: MockDatabase;
  delay: () => Promise<void>;
  now: () => Date;
}

export interface MockServicesOptions {
  storage?: KeyValueStorage;
  storageKey?: string;
  /** Simulated network delay, so loading states are visible in the UI (0 in tests). */
  latencyMs?: number;
  now?: () => Date;
}

export interface MockServices extends Services {
  resetMockData(): void;
}
