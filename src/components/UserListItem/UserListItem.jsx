import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { userPath } from '../../routes/paths';
import Button from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import styles from './UserListItem.module.css';

/** One person in a list: full name, @username (links to their tweets) and an optional Follow button. */
function UserListItem({ user, canFollow = false, onFollow = undefined, followPending = false }) {
  const { t } = useTranslation();
  return (
    <li className={styles.item}>
      <Link to={userPath(user.username)} className={styles.identity}>
        <span className={styles.name}>{user.fullName}</span>
        <span className={styles.username}>@{user.username}</span>
      </Link>
      {canFollow && (
        <Button
          variant={ButtonVariant.GHOST}
          onClick={() => onFollow(user)}
          pending={followPending}
          ariaLabel={t('follow.followUser', { username: user.username })}
        >
          {t('follow.follow')}
        </Button>
      )}
    </li>
  );
}

UserListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
  canFollow: PropTypes.bool,
  onFollow: PropTypes.func,
  followPending: PropTypes.bool,
};

export default UserListItem;
