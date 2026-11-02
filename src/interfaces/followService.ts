import type { Page, PageRequest } from './pagination';
import type { User } from './user';

export interface FollowCounts {
  followers: number;
  following: number;
}

/** Whether the follower follows each user: `{ [userId]: boolean }`. */
export type FollowingStatus = Record<string, boolean>;

export interface FollowService {
  /** Throws USER_NOT_FOUND, FOLLOW_SELF or ALREADY_FOLLOWING. */
  follow(followerId: string, followeeId: string): Promise<void>;
  /** Resolves the username first (USER_NOT_FOUND with field "username"), then like `follow`. */
  followByUsername(followerId: string, username: string): Promise<User>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  /** Batch check for a page of users (Follow buttons). */
  getFollowingStatus(followerId: string, userIds: string[]): Promise<FollowingStatus>;
  getCounts(userId: string): Promise<FollowCounts>;
  /**
   * Alphabetical by full name (toSortKey, code-point order). Firebase: orders by the sort key
   * denormalized on each follow document (M2-02); Firestore can't order by a joined field.
   */
  listFollowing(userId: string, page?: PageRequest): Promise<Page<User>>;
  /** Same ordering rules as listFollowing. */
  listFollowers(userId: string, page?: PageRequest): Promise<Page<User>>;
}
