import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../auth/AuthContext';
import EmptyState from '../components/EmptyState/EmptyState';
import Notice from '../components/Notice/Notice';
import PagedList from '../components/PagedList/PagedList';
import PageHeader from '../components/PageHeader/PageHeader';
import UserListItem from '../components/UserListItem/UserListItem';
import { useFollowingStatus } from '../hooks/useFollowData';
import useFollowUser from '../hooks/useFollowUser';
import usePaginatedList from '../hooks/usePaginatedList';
import useErrorMessage from '../i18n/useErrorMessage';
import { useServices } from '../services/ServicesContext';

/**
 * /followers (R1.6): my followers, alphabetical by full name, 10 per page, with "Seguir" for
 * the ones I don't follow back yet.
 */
function FollowersPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const user = useCurrentUser();
  const { followService } = useServices();
  const fetchPage = useCallback(
    (request) => followService.listFollowers(user.id, request),
    [followService, user.id],
  );
  const list = usePaginatedList(fetchPage);
  const { data: following, loading: statusLoading } = useFollowingStatus(list.items);
  const { followUser, isPending, error: followError } = useFollowUser();

  return (
    <>
      <PageHeader
        title={t('followers.title')}
        subtitle={list.settled ? t('followers.subtitle', { count: list.total }) : ''}
      />
      {followError && <Notice variant="error">{errorMessage(followError)}</Notice>}
      <PagedList
        list={list}
        label={t('followers.title')}
        emptyState={
          <EmptyState title={t('followers.emptyTitle')} message={t('followers.emptyMessage')} />
        }
      >
        {list.items.map((person) => (
          <UserListItem
            key={person.id}
            user={person}
            // Only while the status is known (not reloading after a follow), so the button
            // never flashes for people I follow and can't be clicked twice.
            canFollow={isPending(person.id) || (!statusLoading && following?.[person.id] === false)}
            onFollow={followUser}
            followPending={isPending(person.id)}
          />
        ))}
      </PagedList>
    </>
  );
}

export default FollowersPage;
