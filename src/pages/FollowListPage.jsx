import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useCurrentUser } from '../auth/AuthContext';
import { LinkButton } from '../components/Button/Button';
import ButtonVariant from '../components/Button/buttonVariant';
import EmptyState from '../components/EmptyState/EmptyState';
import Notice from '../components/Notice/Notice';
import PageHeader from '../components/PageHeader/PageHeader';
import PeopleList from '../components/PeopleList/PeopleList';
import Spinner from '../components/Spinner/Spinner';
import UserNotFound from '../components/UserNotFound/UserNotFound';
import useAsyncData from '../hooks/useAsyncData';
import usePaginatedList from '../hooks/usePaginatedList';
import useErrorMessage from '../i18n/useErrorMessage';
import { Paths, userPath } from '../routes/paths';
import { useServices } from '../services/ServicesContext';

const LIST_METHOD = { followers: 'listFollowers', following: 'listFollowing' };

function FollowList({ kind, owner, isMe }) {
  const { t } = useTranslation();
  const { followService } = useServices();
  const fetchPage = useCallback(
    (request) => followService[LIST_METHOD[kind]](owner.id, request),
    [followService, kind, owner.id],
  );
  const list = usePaginatedList(fetchPage);
  const names = { name: owner.fullName, username: owner.username };
  const title = isMe ? t(`${kind}.title`) : t(`${kind}.titleOf`, names);
  const subtitle = isMe
    ? t(`${kind}.subtitle`, { count: list.total })
    : t(`${kind}.subtitleOf`, { ...names, count: list.total });

  let emptyAction = null;
  if (isMe && kind === 'following') {
    emptyAction = (
      <LinkButton to={Paths.SEARCH} variant={ButtonVariant.GHOST}>
        {t('nav.search')}
      </LinkButton>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={list.settled ? subtitle : ''}
        actions={
          isMe ? null : (
            <LinkButton to={userPath(owner.username)} variant={ButtonVariant.GHOST}>
              {t('user.viewProfile')}
            </LinkButton>
          )
        }
      />
      <PeopleList
        list={list}
        label={title}
        showFollow={kind === 'followers' || !isMe}
        emptyState={
          <EmptyState
            title={isMe ? t(`${kind}.emptyTitle`) : t(`${kind}.emptyTitleOf`, names)}
            message={isMe ? t(`${kind}.emptyMessage`) : ''}
            action={emptyAction}
          />
        }
      />
    </>
  );
}

FollowList.propTypes = {
  kind: PropTypes.oneOf(['followers', 'following']).isRequired,
  owner: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
  isMe: PropTypes.bool.isRequired,
};

function FollowListPage({ kind }) {
  const errorMessage = useErrorMessage();
  const { username } = useParams();
  const me = useCurrentUser();
  const { userService } = useServices();
  const load = useCallback(
    () => (username ? userService.getUserByUsername(username) : Promise.resolve(null)),
    [userService, username],
  );
  const { data, loading, error } = useAsyncData(load);

  if (username) {
    if (loading) return <Spinner />;
    if (error) return <Notice variant="error">{errorMessage(error)}</Notice>;
    if (!data) return <UserNotFound username={username} />;
  }
  const owner = username ? data : me;

  return (
    <FollowList key={`${kind}-${owner.id}`} kind={kind} owner={owner} isMe={owner.id === me.id} />
  );
}

FollowListPage.propTypes = {
  kind: PropTypes.oneOf(['followers', 'following']).isRequired,
};

export default FollowListPage;
