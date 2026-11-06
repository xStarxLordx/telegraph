import { useCallback } from 'react';
import { useParams } from 'react-router';
import { useCurrentUser } from '../auth/AuthContext';
import Notice from '../components/Notice/Notice';
import Spinner from '../components/Spinner/Spinner';
import UserNotFound from '../components/UserNotFound/UserNotFound';
import useAsyncData from '../hooks/useAsyncData';
import useErrorMessage from '../i18n/useErrorMessage';
import { useServices } from '../services/ServicesContext';
import UserProfile from './user/UserProfile';
import UserTweets from './user/UserTweets';

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
      <UserProfile key={`profile-${user.id}`} user={user} isMe={user.id === me.id} />
      <UserTweets key={`tweets-${user.id}`} user={user} />
    </>
  );
}

export default UserPage;
