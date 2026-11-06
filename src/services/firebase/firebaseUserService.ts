import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { DIRECTORY_LIMIT, DIRECTORY_TTL_MS, SUGGESTION_POOL } from '../../domain/constants';
import { searchUsers } from '../../domain/search';
import { validateUsername } from '../../domain/validation';
import type {
  FirebaseServiceDeps,
  ProfileDocument,
  UserDirectory,
} from '../../interfaces/firebase';
import type { PageRequest } from '../../interfaces/pagination';
import type { UserService } from '../../interfaces/userService';
import paginateArray from '../paginateArray';
import Collection from './collections';
import { withMappedErrors } from './mapFirebaseError';
import { findProfileByUid, findProfileByUsername, profileToUser } from './profiles';

export default function createFirebaseUserService({
  db,
}: Pick<FirebaseServiceDeps, 'db'>): UserService {
  let directory: UserDirectory | null = null;

  const loadDirectory = () => {
    if (directory === null || Date.now() - directory.loadedAt > DIRECTORY_TTL_MS) {
      const entry: UserDirectory = {
        loadedAt: Date.now(),
        users: getDocs(query(collection(db, Collection.USERS), limit(DIRECTORY_LIMIT))).then(
          (result) => {
            const people = result.docs.map((snapshot) =>
              profileToUser(snapshot.data() as ProfileDocument),
            );
            return [...new Map(people.map((person) => [person.id, person])).values()];
          },
        ),
      };
      entry.users.catch(() => {
        if (directory === entry) directory = null;
      });
      directory = entry;
    }
    return directory.users;
  };

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
      if (validateUsername(username)) return false;
      return (await findProfileByUsername(db, username)) === null;
    }),

    suggest: withMappedErrors(async () => {
      const result = await getDocs(
        query(
          collection(db, Collection.USERS),
          orderBy('createdAt', 'desc'),
          limit(SUGGESTION_POOL),
        ),
      );
      return result.docs.map((snapshot) => profileToUser(snapshot.data() as ProfileDocument));
    }),

    search: withMappedErrors(async (term: string, page?: PageRequest) =>
      paginateArray(searchUsers(await loadDirectory(), term), page),
    ),
  };
}
