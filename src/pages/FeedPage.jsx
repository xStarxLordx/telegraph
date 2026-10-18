import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../auth/AuthContext';
import { LinkButton } from '../components/Button/Button';
import ButtonVariant from '../components/Button/buttonVariant';
import EmptyState from '../components/EmptyState/EmptyState';
import PagedList from '../components/PagedList/PagedList';
import PageHeader from '../components/PageHeader/PageHeader';
import TweetCard from '../components/TweetCard/TweetCard';
import usePaginatedList from '../hooks/usePaginatedList';
import { Paths } from '../routes/paths';
import { useServices } from '../services/ServicesContext';

/** /feed (R1.8): my tweets and those of the people I follow, newest first, 10 per page. */
function FeedPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { tweetService } = useServices();
  const fetchPage = useCallback(
    (request) => tweetService.listFeed(user.id, request),
    [tweetService, user.id],
  );
  const list = usePaginatedList(fetchPage);

  return (
    <>
      <PageHeader title={t('feed.title')} subtitle={t('feed.subtitle')} />
      <PagedList
        as="div"
        list={list}
        label={t('feed.title')}
        emptyState={
          <EmptyState
            title={t('feed.emptyTitle')}
            message={t('feed.emptyMessage')}
            action={
              <LinkButton to={Paths.FOLLOWERS} variant={ButtonVariant.GHOST}>
                {t('feed.emptyAction')}
              </LinkButton>
            }
          />
        }
      >
        {list.items.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </PagedList>
    </>
  );
}

export default FeedPage;
