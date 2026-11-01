// Mock UserService (see src/interfaces/userService.ts).
import type { MockServiceDeps } from '../../interfaces/mock';
import type { UserService } from '../../interfaces/userService';
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
  };
}
