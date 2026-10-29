// Write methods take the acting user's id explicitly (as Firestore documents will), and
// Firebase security rules only accept it when it is the logged-in user. The mock enforces
// the same rule so the UI is built against the real behavior.
import { ErrorCode, ServiceError } from '../../domain/errors';

/**
 * @param {ReturnType<import('./mockDatabase').default>} db
 * @param {string} actorId
 * @returns {object} The acting user's record.
 */
export default function requireActor(db, actorId) {
  const sessionUser = db.sessionUser();
  if (!sessionUser) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
  if (sessionUser.id !== actorId) throw new ServiceError(ErrorCode.PERMISSION_DENIED);
  if (sessionUser.username === null) throw new ServiceError(ErrorCode.USERNAME_REQUIRED);
  return sessionUser;
}
