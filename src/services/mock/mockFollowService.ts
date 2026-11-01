// Mock FollowService (see src/interfaces/followService.ts).
import { ErrorCode, ServiceError } from '../../domain/errors';
import { compareByFullName } from '../../domain/sorting';
import type { FollowService } from '../../interfaces/followService';
import type { MockServiceDeps, UserRecord } from '../../interfaces/mock';
import type { PageRequest } from '../../interfaces/pagination';
import { toPublicUser } from './mappers';
import paginateArray from './paginateArray';
import requireActor from './requireActor';

const followId = (followerId: string, followeeId: string) => `${followerId}_${followeeId}`;

export default function createMockFollowService({
  db,
  delay,
  now,
}: MockServiceDeps): FollowService {
  const exists = (followerId: string, followeeId: string) =>
    db.state.follows.some((follow) => follow.id === followId(followerId, followeeId));

  // `followee` must already be resolved and public (it has a username).
  const createFollow = (followerId: string, followee: UserRecord) => {
    if (followerId === followee.id) throw new ServiceError(ErrorCode.FOLLOW_SELF);
    if (exists(followerId, followee.id)) throw new ServiceError(ErrorCode.ALREADY_FOLLOWING);
    db.insertFollow({
      id: followId(followerId, followee.id),
      followerId,
      followeeId: followee.id,
      createdAt: now().toISOString(),
    });
  };

  const listPeople = (userIds: string[], page?: PageRequest) => {
    const people = userIds
      .map((id) => db.findUserById(id))
      .filter((user): user is UserRecord => user !== null)
      .sort(compareByFullName);
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
