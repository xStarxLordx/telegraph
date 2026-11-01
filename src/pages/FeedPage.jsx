import { useTranslation } from 'react-i18next';
import FeedList from '../components/FeedList/FeedList';
import PageHeader from '../components/PageHeader/PageHeader';

/** /feed (R1.8): my tweets and those of the people I follow, newest first, 10 per page. */
function FeedPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('feed.title')} subtitle={t('feed.subtitle')} />
      <FeedList />
    </>
  );
}

export default FeedPage;
