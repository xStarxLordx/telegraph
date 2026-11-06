import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../auth/AuthContext';
import useInfiniteList from '../../hooks/useInfiniteList';
import useOnVisible from '../../hooks/useOnVisible';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import { useServices } from '../../services/ServicesContext';
import Button, { LinkButton } from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import EmptyState from '../EmptyState/EmptyState';
import Notice from '../Notice/Notice';
import Spinner from '../Spinner/Spinner';
import TweetCard from '../TweetCard/TweetCard';
import styles from './FeedList.module.css';

function FeedList() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const user = useCurrentUser();
  const { tweetService } = useServices();
  const fetchPage = useCallback(
    (request) => tweetService.listFeed(user.id, request),
    [tweetService, user.id],
  );
  const list = useInfiniteList(fetchPage);
  const { items, total, hasMore, loading, loadingMore, settled, error, loadMore, retry } = list;
  const setSentinel = useOnVisible(loadMore, hasMore && !loading && !error);

  if (error && items.length === 0) {
    return (
      <div className={styles.error}>
        <Notice variant="error">{errorMessage(error)}</Notice>
        <Button variant={ButtonVariant.GHOST} onClick={retry}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  if (loading && items.length === 0) return <Spinner />;
  if (items.length === 0) {
    return (
      <EmptyState
        title={t('feed.emptyTitle')}
        message={t('feed.emptyMessage')}
        action={
          <LinkButton to={Paths.SEARCH} variant={ButtonVariant.GHOST}>
            {t('feed.emptyAction')}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.items}
        role="feed"
        aria-label={t('feed.title')}
        aria-busy={loadingMore || undefined}
      >
        {items.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
      <div className={styles.footer} ref={setSentinel}>
        {error && (
          <div className={styles.error}>
            <Notice variant="error">{errorMessage(error)}</Notice>
            <Button variant={ButtonVariant.GHOST} onClick={retry}>
              {t('common.retry')}
            </Button>
          </div>
        )}
        {!error && hasMore && (
          <Button variant={ButtonVariant.GHOST} onClick={loadMore} pending={loadingMore}>
            {t('feed.loadMore')}
          </Button>
        )}
        {settled && (
          <p className={styles.status} aria-live="polite">
            {hasMore
              ? t('feed.progress', { shown: items.length, total })
              : t('feed.end', { count: total })}
          </p>
        )}
      </div>
    </div>
  );
}

export default FeedList;
