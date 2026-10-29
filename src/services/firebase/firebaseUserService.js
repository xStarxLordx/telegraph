// Firebase UserService (see contracts.js): public profiles read from the `users` collection.
import { validateUsername } from '../../domain/validation';
import { withMappedErrors } from './mapFirebaseError';
import { findProfileByUid, findProfileByUsername, profileToUser } from './profiles';

/**
 * @param {{ db: import('firebase/firestore').Firestore }} deps
 * @returns {import('../contracts').UserService}
 */
export default function createFirebaseUserService({ db }) {
  return {
    getUserById: withMappedErrors(async (id) => {
      const profile = await findProfileByUid(db, id);
      return profile ? profileToUser(profile) : null;
    }),

    getUserByUsername: withMappedErrors(async (username) => {
      const profile = await findProfileByUsername(db, username);
      return profile ? profileToUser(profile) : null;
    }),

    isUsernameAvailable: withMappedErrors(async (username) => {
      // A malformed username can never be claimed, so it is not "available" either.
      if (validateUsername(username)) return false;
      return (await findProfileByUsername(db, username)) === null;
    }),
  };
}
