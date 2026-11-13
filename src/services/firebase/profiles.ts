// Reading profiles (`users` documents) and checking who is acting; shared by every Firebase
// service. The document id is the username, so an account is found by its `uid` field instead.
import type { Auth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { normalizeUsername, validateUsername } from '../../domain/validation';
import type { FirebaseServiceDeps, ProfileDocument } from '../../interfaces/firebase';
import type { User } from '../../interfaces/user';
import Collection from './collections';

/** The profile data of the account with this Firebase uid, or null when it has none yet. */
export async function findProfileByUid(
  db: Firestore,
  uid: string,
): Promise<ProfileDocument | null> {
  const result = await getDocs(
    query(collection(db, Collection.USERS), where('uid', '==', uid), limit(1)),
  );
  return result.empty ? null : (result.docs[0].data() as ProfileDocument);
}

/** The profile data of a username (any case, "@" optional), or null when nobody has it. */
export async function findProfileByUsername(
  db: Firestore,
  username: string,
): Promise<ProfileDocument | null> {
  // A malformed username can't exist, and its text must never become a document id.
  if (validateUsername(username)) return null;
  const snapshot = await getDoc(doc(db, Collection.USERS, normalizeUsername(username)));
  return snapshot.exists() ? (snapshot.data() as ProfileDocument) : null;
}

/** Only what is safe to show to anyone. */
export function profileToUser({ uid, fullName, username }: ProfileDocument): User {
  return { id: uid, fullName, username };
}

/** Throws unless the signed-in Firebase account is `actorId`: how every write method starts. */
export async function requireSignedIn(auth: Auth, actorId: string): Promise<void> {
  await auth.authStateReady();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
  if (firebaseUser.uid !== actorId) throw new ServiceError(ErrorCode.PERMISSION_DENIED);
}

/**
 * Write methods take the acting user's id (see src/interfaces/services.ts): it must be the
 * signed-in account, and that account needs a username. The security rules check the same on
 * the server. Returns the actor's profile data.
 */
export async function requireActor(
  { auth, db }: FirebaseServiceDeps,
  actorId: string,
): Promise<ProfileDocument> {
  await requireSignedIn(auth, actorId);
  const profile = await findProfileByUid(db, actorId);
  if (!profile) throw new ServiceError(ErrorCode.USERNAME_REQUIRED);
  return profile;
}
