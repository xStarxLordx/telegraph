import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../auth/AuthContext';
import usePaginatedList from '../../hooks/usePaginatedList';
import { Paths } from '../../routes/paths';
import { useServices } from '../../services/ServicesContext';
import { LinkButton } from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import EmptyState from '../EmptyState/EmptyState';
import PagedList from '../PagedList/PagedList';
import TweetCard from '../TweetCard/TweetCard';

/**
 * The logged-in user's feed (R1.8): my tweets and those of the people I follow, newest first,
 * 10 per page. Shown on /feed and on the home page.
 */
function FeedList() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { tweetService } = useServices();
  const fetchPage = useCallback(
    (request) => tweetService.listFeed(user.id, request),
    [tweetService, user.id],
  );
  const list = usePaginatedList(fetchPage);

  return (
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
  );
}

export default FeedList;
