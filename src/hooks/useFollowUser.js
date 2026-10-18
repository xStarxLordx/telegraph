import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast/ToastContext';
import { useSocial } from '../social/SocialContext';

/**
 * Follow action for Follow buttons: tracks which users are being followed (to show their
 * spinners), confirms with a toast and keeps the last error for the page to show.
 * Pages hide a button while their follow status reloads, so it can't be clicked twice.
 */
export default function useFollowUser() {
  const { t } = useTranslation();
  const { follow } = useSocial();
  const { showToast } = useToast();
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [error, setError] = useState(null);

  const followUser = useCallback(
    async (user) => {
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

  const isPending = useCallback((userId) => pendingIds.has(userId), [pendingIds]);

  return { followUser, isPending, error };
}
