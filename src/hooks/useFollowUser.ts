import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast/ToastContext';
import type { FollowUserState } from '../interfaces/hooks';
import type { User } from '../interfaces/user';
import { useSocial } from '../social/SocialContext';

/**
 * Follow action for Follow buttons: tracks which users are being followed (to show their
 * spinners), confirms with a toast and keeps the last error for the page to show.
 * Pages hide a button while their follow status reloads, so it can't be clicked twice.
 */
export default function useFollowUser(): FollowUserState {
  const { t } = useTranslation();
  const { follow } = useSocial();
  const { showToast } = useToast();
  const [pendingIds, setPendingIds] = useState(() => new Set<string>());
  const [error, setError] = useState<unknown>(null);

  const followUser = useCallback(
    async (user: User) => {
      setPendingIds((ids) => new Set(ids).add(user.id));
      setError(null);
      try {
        await follow(user.id);
        showToast(t('follow.followed', { username: user.username }));
      } catch (followError) {
        setError(followError);
      } finally {
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(user.id);
          return next;
        });
      }
    },
    [follow, showToast, t],
  );

  const isPending = useCallback((userId: string) => pendingIds.has(userId), [pendingIds]);

  return { followUser, isPending, error };
}
