// Mock UserService (see contracts.js).
import { toPublicUser } from './mappers';

/**
 * @param {{ db: ReturnType<import('./mockDatabase').default>,
 *   delay: () => Promise<void> }} deps
 * @returns {import('../contracts').UserService}
 */
export default function createMockUserService({ db, delay }) {
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
