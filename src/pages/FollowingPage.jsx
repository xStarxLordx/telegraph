import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../auth/AuthContext';
import { LinkButton } from '../components/Button/Button';
import ButtonVariant from '../components/Button/buttonVariant';
import EmptyState from '../components/EmptyState/EmptyState';
import PagedList from '../components/PagedList/PagedList';
import PageHeader from '../components/PageHeader/PageHeader';
import UserListItem from '../components/UserListItem/UserListItem';
import usePaginatedList from '../hooks/usePaginatedList';
import { Paths } from '../routes/paths';
import { useServices } from '../services/ServicesContext';

/** /following (R1.5): people I follow, alphabetical by full name, 10 per page. */
function FollowingPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { followService } = useServices();
  const fetchPage = useCallback(
    (request) => followService.listFollowing(user.id, request),
    [followService, user.id],
  );
  const list = usePaginatedList(fetchPage);

  return (
    <>
      <PageHeader
        title={t('following.title')}
        subtitle={list.settled ? t('following.subtitle', { count: list.total }) : ''}
      />
      <PagedList
        list={list}
        label={t('following.title')}
        emptyState={
          <EmptyState
            title={t('following.emptyTitle')}
            message={t('following.emptyMessage')}
            action={
              <LinkButton to={Paths.FOLLOWERS} variant={ButtonVariant.GHOST}>
                {t('nav.followers')}
              </LinkButton>
            }
          />
        }
      >
        {list.items.map((person) => (
          <UserListItem key={person.id} user={person} />
        ))}
      </PagedList>
    </>
  );
}

export default FollowingPage;
