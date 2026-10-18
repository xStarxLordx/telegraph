import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import CounterGauge from '../../components/CounterGauge/CounterGauge';
import Notice from '../../components/Notice/Notice';
import Spinner from '../../components/Spinner/Spinner';
import usePageTitle from '../../hooks/usePageTitle';
import { useFollowCounts, useIsFollowing } from '../../hooks/useFollowData';
import useFollowUser from '../../hooks/useFollowUser';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import styles from './UserProfile.module.css';

/** Profile header: name, @username, counters and the Follow button (not on my own profile). */
function UserProfile({ user, isMe }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { data: counts, error: countsError } = useFollowCounts(user.id);
  const { data: isFollowing, loading: followingLoading } = useIsFollowing(user.id);
  const { followUser, isPending, error } = useFollowUser();
  const pending = isPending(user.id);
  // Hidden while the status reloads after a follow, so it can't be clicked twice.
  const canFollow = pending || (!followingLoading && isFollowing === false);
  usePageTitle(user.fullName);

  return (
    <Card framed className={styles.profile}>
      <div className={styles.identity}>
        <h1 className={styles.name}>{user.fullName}</h1>
        <p className={styles.username}>@{user.username}</p>
        {isMe && <p className={styles.badge}>{t('user.thisIsYou')}</p>}
      </div>
      {counts && (
        <div className={styles.gauges}>
          <CounterGauge
            count={counts.followers}
            label={t('counters.followers')}
            // Other users' lists arrive in M3-06.
            to={isMe ? Paths.FOLLOWERS : ''}
          />
          <CounterGauge
            count={counts.following}
            label={t('counters.following')}
            to={isMe ? Paths.FOLLOWING : ''}
          />
        </div>
      )}
      {!counts && !countsError && <Spinner inline />}
      {canFollow && (
        <div className={styles.actions}>
          <Button onClick={() => followUser(user)} pending={pending}>
            {t('follow.follow')}
          </Button>
        </div>
      )}
      {(error || countsError) && (
        <Notice variant="error">{errorMessage(error || countsError)}</Notice>
      )}
    </Card>
  );
}

UserProfile.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
  isMe: PropTypes.bool.isRequired,
};

export default UserProfile;
