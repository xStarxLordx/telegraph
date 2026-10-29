// Reading profiles (`users` documents) and checking who is acting; shared by every Firebase
// service. The document id is the username, so an account is found by its `uid` field instead.
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { normalizeUsername, validateUsername } from '../../domain/validation';
import Collection from './collections';

/** The profile data of the account with this Firebase uid, or null when it has none yet. */
export async function findProfileByUid(db, uid) {
  const result = await getDocs(
    query(collection(db, Collection.USERS), where('uid', '==', uid), limit(1)),
  );
  return result.empty ? null : result.docs[0].data();
}

/** The profile data of a username (any case, "@" optional), or null when nobody has it. */
export async function findProfileByUsername(db, username) {
  // A malformed username can't exist, and its text must never become a document id.
  if (validateUsername(username)) return null;
  const snapshot = await getDoc(doc(db, Collection.USERS, normalizeUsername(username)));
  return snapshot.exists() ? snapshot.data() : null;
}

/** @returns {import('../contracts').User} Only what is safe to show to anyone. */
export function profileToUser({ uid, fullName, username }) {
  return { id: uid, fullName, username };
}

/**
 * Write methods take the acting user's id (see contracts.js): it must be the signed-in account,
 * and that account needs a username. The security rules check the same on the server.
 * @returns {Promise<object>} The actor's profile data.
 */
export async function requireActor({ auth, db }, actorId) {
  await auth.authStateReady();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
  if (firebaseUser.uid !== actorId) throw new ServiceError(ErrorCode.PERMISSION_DENIED);
  const profile = await findProfileByUid(db, actorId);
  if (!profile) throw new ServiceError(ErrorCode.USERNAME_REQUIRED);
  return profile;
}
