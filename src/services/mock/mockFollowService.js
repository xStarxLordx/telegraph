// Mock FollowService (see contracts.js).
import { ErrorCode, ServiceError } from '../../domain/errors';
import { compareByFullName } from '../../domain/sorting';
import { toPublicUser } from './mappers';
import paginateArray from './paginateArray';
import requireActor from './requireActor';

const followId = (followerId, followeeId) => `${followerId}_${followeeId}`;

/**
 * @param {{ db: ReturnType<import('./mockDatabase').default>,
 *   delay: () => Promise<void>, now: () => Date }} deps
 * @returns {import('../contracts').FollowService}
 */
export default function createMockFollowService({ db, delay, now }) {
  const exists = (followerId, followeeId) =>
    db.state.follows.some((follow) => follow.id === followId(followerId, followeeId));

  // `followee` must already be resolved and public (it has a username).
  const createFollow = (followerId, followee) => {
    if (followerId === followee.id) throw new ServiceError(ErrorCode.FOLLOW_SELF);
    if (exists(followerId, followee.id)) throw new ServiceError(ErrorCode.ALREADY_FOLLOWING);
    db.insertFollow({
      id: followId(followerId, followee.id),
      followerId,
      followeeId: followee.id,
      createdAt: now().toISOString(),
    });
  };

  const listPeople = (userIds, page) => {
    const people = userIds.map((id) => db.findUserById(id)).sort(compareByFullName);
    const result = paginateArray(people, page);
    return { ...result, items: result.items.map(toPublicUser) };
  };

  return {
    async follow(followerId, followeeId) {
      await delay();
      requireActor(db, followerId);
      const followee = db.findUserById(followeeId);
      // Accounts without a username aren't public yet, so they can't be followed.
      if (!followee || followee.username === null) {
        throw new ServiceError(ErrorCode.USER_NOT_FOUND);
      }
      createFollow(followerId, followee);
    },

    async followByUsername(followerId, username) {
      await delay();
      requireActor(db, followerId);
      const followee = db.findUserByUsername(username);
      if (!followee) throw new ServiceError(ErrorCode.USER_NOT_FOUND, { field: 'username' });
      createFollow(followerId, followee);
      return toPublicUser(followee);
    },

    async isFollowing(followerId, followeeId) {
      await delay();
      return exists(followerId, followeeId);
    },

    async getFollowingStatus(followerId, userIds) {
      await delay();
      return Object.fromEntries(userIds.map((id) => [id, exists(followerId, id)]));
    },

    async getCounts(userId) {
      await delay();
      return {
        followers: db.state.follows.filter((follow) => follow.followeeId === userId).length,
        following: db.state.follows.filter((follow) => follow.followerId === userId).length,
      };
    },

    async listFollowing(userId, page) {
      await delay();
      const ids = db.state.follows
        .filter((follow) => follow.followerId === userId)
        .map((follow) => follow.followeeId);
      return listPeople(ids, page);
    },

    async listFollowers(userId, page) {
      await delay();
      const ids = db.state.follows
        .filter((follow) => follow.followeeId === userId)
        .map((follow) => follow.followerId);
      return listPeople(ids, page);
    },
  };
}
