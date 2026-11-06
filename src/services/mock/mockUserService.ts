import { SUGGESTION_POOL } from '../../domain/constants';
import { searchUsers } from '../../domain/search';
import type { MockServiceDeps } from '../../interfaces/mock';
import type { UserService } from '../../interfaces/userService';
import paginateArray from '../paginateArray';
import { toPublicUser } from './mappers';

export default function createMockUserService({ db, delay }: MockServiceDeps): UserService {
  return {
    async getUserById(id) {
      await delay();
      const user = db.findUserById(id);
      return user ? toPublicUser(user) : null;
    },

    async getUserByUsername(username) {
      await delay();
      const user = db.findUserByUsername(username);
      return user ? toPublicUser(user) : null;
    },

    async isUsernameAvailable(username) {
      await delay();
      return db.findUserByUsername(username) === null;
    },

    async search(term, page) {
      await delay();
      return paginateArray(searchUsers(db.state.users.map(toPublicUser), term), page);
    },

    async suggest() {
      await delay();
      return db.state.users
        .filter((user) => user.username !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (a.id < b.id ? 1 : -1))
        .slice(0, SUGGESTION_POOL)
        .map(toPublicUser);
    },
  };
}
