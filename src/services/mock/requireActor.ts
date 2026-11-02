// Write methods take the acting user's id explicitly (as Firestore documents will), and
// Firebase security rules only accept it when it is the logged-in user. The mock enforces
// the same rule so the UI is built against the real behavior.
import { ErrorCode, ServiceError } from '../../domain/errors';
import type { MockDatabase, UserRecord } from '../../interfaces/mock';

/** Returns the acting user's record, which always has a username. */
export default function requireActor(
  db: MockDatabase,
  actorId: string,
): UserRecord & { username: string } {
  const sessionUser = db.sessionUser();
  if (!sessionUser) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
  if (sessionUser.id !== actorId) throw new ServiceError(ErrorCode.PERMISSION_DENIED);
  const { username } = sessionUser;
  if (username === null) throw new ServiceError(ErrorCode.USERNAME_REQUIRED);
  return { ...sessionUser, username };
}
