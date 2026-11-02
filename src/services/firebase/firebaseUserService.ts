// Firebase UserService (see src/interfaces/userService.ts): public profiles read from the
// `users` collection.
import { validateUsername } from '../../domain/validation';
import type { FirebaseServiceDeps } from '../../interfaces/firebase';
import type { UserService } from '../../interfaces/userService';
import { withMappedErrors } from './mapFirebaseError';
import { findProfileByUid, findProfileByUsername, profileToUser } from './profiles';

export default function createFirebaseUserService({
  db,
}: Pick<FirebaseServiceDeps, 'db'>): UserService {
  return {
    getUserById: withMappedErrors(async (id: string) => {
      const profile = await findProfileByUid(db, id);
      return profile ? profileToUser(profile) : null;
    }),

    getUserByUsername: withMappedErrors(async (username: string) => {
      const profile = await findProfileByUsername(db, username);
      return profile ? profileToUser(profile) : null;
    }),

    isUsernameAvailable: withMappedErrors(async (username: string) => {
      // A malformed username can never be claimed, so it is not "available" either.
      if (validateUsername(username)) return false;
      return (await findProfileByUsername(db, username)) === null;
    }),
  };
}
