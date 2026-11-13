// Read hooks for follow data. They reload after every follow (followVersion), so counters and
// Follow buttons on screen always agree with each other.
import { useCallback } from 'react';
import { useCurrentUser } from '../auth/AuthContext';
import type { FollowCounts, FollowingStatus } from '../interfaces/followService';
import type { AsyncDataState } from '../interfaces/hooks';
import type { User } from '../interfaces/user';
import { useServices } from '../services/ServicesContext';
import { useSocial } from '../social/SocialContext';
import useAsyncData from './useAsyncData';

/** Followers / following counters of a user (null id: nothing to load yet). */
export function useFollowCounts(userId: string | null): AsyncDataState<FollowCounts | undefined> {
  const { followService } = useServices();
  const { followVersion } = useSocial();
  const load = useCallback(
    () => (userId ? followService.getCounts(userId) : Promise.resolve(undefined)),
    // followVersion is a reload trigger, not an argument.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followService, userId, followVersion],
  );
  return useAsyncData(load);
}

/**
 * Whether the logged-in user follows each of `users`: `{ [userId]: boolean }`.
 * The logged-in user never appears as followable (no entry for them).
 */
export function useFollowingStatus(users: User[]): AsyncDataState<FollowingStatus> {
  const { followService } = useServices();
  const me = useCurrentUser();
  const { followVersion } = useSocial();
  const ids = users
    .map((user) => user.id)
    .filter((id) => id !== me.id)
    .join(',');
  const load = useCallback(
    () =>
      ids
        ? followService.getFollowingStatus(me.id, ids.split(','))
        : Promise.resolve<FollowingStatus>({}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followService, me.id, ids, followVersion],
  );
  return useAsyncData(load);
}

/** Whether the logged-in user follows `userId` (always true for their own profile). */
export function useIsFollowing(userId: string): AsyncDataState<boolean> {
  const { followService } = useServices();
  const me = useCurrentUser();
  const { followVersion } = useSocial();
  const load = useCallback(
    () => (userId === me.id ? Promise.resolve(true) : followService.isFollowing(me.id, userId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followService, me.id, userId, followVersion],
  );
  return useAsyncData(load);
}
