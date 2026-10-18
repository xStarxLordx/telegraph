import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../../components/EmptyState/EmptyState';
import PagedList from '../../components/PagedList/PagedList';
import TweetCard from '../../components/TweetCard/TweetCard';
import usePaginatedList from '../../hooks/usePaginatedList';
import { useServices } from '../../services/ServicesContext';
import styles from './UserTweets.module.css';

/** A user's tweets, newest first, 10 per page. */
function UserTweets({ user }) {
  const { t } = useTranslation();
  const { tweetService } = useServices();
  const fetchPage = useCallback(
    (request) => tweetService.listByAuthor(user.id, request),
    [tweetService, user.id],
  );
  const list = usePaginatedList(fetchPage);
  const label = t('user.tweetsTitle', { name: user.fullName });

  return (
    <section className={styles.tweets}>
      <h2 className={styles.title}>
        {list.settled ? t('user.tweetsHeading', { count: list.total }) : t('user.tweets')}
      </h2>
      <PagedList
        as="div"
        list={list}
        label={label}
        emptyState={<EmptyState title={t('user.noTweets', { username: user.username })} />}
      >
        {list.items.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </PagedList>
    </section>
  );
}

UserTweets.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

export default UserTweets;
