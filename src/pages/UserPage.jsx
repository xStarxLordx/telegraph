import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useCurrentUser } from '../auth/AuthContext';
import { LinkButton } from '../components/Button/Button';
import ButtonVariant from '../components/Button/buttonVariant';
import EmptyState from '../components/EmptyState/EmptyState';
import Notice from '../components/Notice/Notice';
import Spinner from '../components/Spinner/Spinner';
import useAsyncData from '../hooks/useAsyncData';
import usePageTitle from '../hooks/usePageTitle';
import useErrorMessage from '../i18n/useErrorMessage';
import { Paths } from '../routes/paths';
import { useServices } from '../services/ServicesContext';
import UserProfile from './user/UserProfile';
import UserTweets from './user/UserTweets';

function UserNotFound({ username }) {
  const { t } = useTranslation();
  usePageTitle(t('user.notFoundTitle'));
  return (
    <EmptyState
      title={t('user.notFoundTitle')}
      message={t('user.notFoundMessage', { username })}
      action={
        <LinkButton to={Paths.HOME} variant={ButtonVariant.GHOST}>
          {t('notFound.backHome')}
        </LinkButton>
      }
    />
  );
}

UserNotFound.propTypes = {
  username: PropTypes.string.isRequired,
};

/**
 * /users/:username (R1.7): the user's header, counters, "Seguir" when I don't follow them
 * (never on my own profile) and their tweets, newest first, 10 per page.
 */
function UserPage() {
  const errorMessage = useErrorMessage();
  const { username } = useParams();
  const me = useCurrentUser();
  const { userService } = useServices();
  const load = useCallback(() => userService.getUserByUsername(username), [userService, username]);
  const { data: user, loading, error } = useAsyncData(load);

  if (loading) return <Spinner />;
  if (error) return <Notice variant="error">{errorMessage(error)}</Notice>;
  if (!user) return <UserNotFound username={username} />;

  return (
    <>
      {/* Keyed by user: going from one profile to another starts with fresh state. */}
      <UserProfile key={`profile-${user.id}`} user={user} isMe={user.id === me.id} />
      <UserTweets key={`tweets-${user.id}`} user={user} />
    </>
  );
}

export default UserPage;
