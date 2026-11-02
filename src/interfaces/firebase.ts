// Firestore documents and the wiring of the Firebase services. The fields must match
// firestore.rules (firestoreRules.test.ts checks it) and the README's data model.
import type { Auth } from 'firebase/auth';
import type {
  Firestore,
  QueryDocumentSnapshot,
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
  Timestamp,
} from 'firebase/firestore';
import type { ErrorCodeValue } from './errors';
import type { PageRequest } from './pagination';

/** What every Firebase service is built from. */
export interface FirebaseServiceDeps {
  auth: Auth;
  db: Firestore;
}

/** `users/{usernameLower}`: the profile, the username claim and the login lookup. */
export interface ProfileDocument {
  uid: string;
  fullName: string;
  /** As typed (the document id is its lowercase form). */
  username: string;
  email: string;
  createdAt: Timestamp;
}

/** `tweets/{autoId}`: the author's name and username are copied in, so feeds need no joins. */
export interface TweetDocument {
  authorId: string;
  authorFullName: string;
  authorUsername: string;
  body: string;
  createdAt: Timestamp;
}

/** `follows/{followerId_followeeId}`: both people's names, plus their sort keys. */
export interface FollowDocument {
  followerId: string;
  followerUsername: string;
  followerFullName: string;
  followerFullNameLower: string;
  followeeId: string;
  followeeUsername: string;
  followeeFullName: string;
  followeeFullNameLower: string;
  createdAt: Timestamp;
}

/** The fields of a follow document that describe one side of a list (following / followers). */
export interface FollowListFields {
  filterField: 'followerId' | 'followeeId';
  personId: 'followeeId' | 'followerId';
  personFullName: 'followeeFullName' | 'followerFullName';
  personUsername: 'followeeUsername' | 'followerUsername';
  sortKey: 'followeeFullNameLower' | 'followerFullNameLower';
}

/** What a Firebase error code becomes. */
export interface FirebaseErrorMapping {
  code: ErrorCodeValue;
  field?: string;
}

export interface PaginateQueryOptions<T> {
  db: Firestore;
  collectionName: string;
  /** `where`s. */
  filters: QueryFieldFilterConstraint[];
  /** `orderBy`s; they need a matching composite index in `firestore.indexes.json`. */
  orders: QueryOrderByConstraint[];
  page?: PageRequest;
  mapDocument: (snapshot: QueryDocumentSnapshot) => T;
}

/** Environment variables as Vite exposes them (`import.meta.env`). */
export type EnvironmentVariables = Record<string, string | boolean | undefined>;
