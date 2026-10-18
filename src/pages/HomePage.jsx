import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentUser } from '../auth/AuthContext';
import { LinkButton } from '../components/Button/Button';
import Card from '../components/Card/Card';
import { FeedIcon, PenIcon, TweetsIcon } from '../components/icons/icons';
import PageHeader from '../components/PageHeader/PageHeader';
import { Paths, userPath } from '../routes/paths';
import styles from './HomePage.module.css';

/**
 * Home (R1.3): welcome, the prominent "Tweet" link and shortcuts. The followers / following
 * gauges live in the app shell's aside (SocialPanel), so they are on this page too.
 */
function HomePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();

  return (
    <>
      <PageHeader title={t('home.title', { name: user.fullName })} subtitle={t('home.subtitle')} />

      <Card framed className={styles.compose}>
        <p className={styles.prompt}>{t('home.composePrompt')}</p>
        <LinkButton to={Paths.COMPOSE} size="large">
          <PenIcon />
          {t('home.tweet')}
        </LinkButton>
      </Card>

      <div className={styles.shortcuts}>
        <Link to={Paths.FEED} className={styles.shortcut}>
          <FeedIcon />
          <span className={styles.shortcutText}>
            <strong>{t('nav.feed')}</strong>
            <span>{t('home.feedHint')}</span>
          </span>
        </Link>
        <Link to={userPath(user.username)} className={styles.shortcut}>
          <TweetsIcon />
          <span className={styles.shortcutText}>
            <strong>{t('nav.myTweets')}</strong>
            <span>{t('home.myTweetsHint')}</span>
          </span>
        </Link>
      </div>

      {/* Slot reserved for "Follow by username" (M2-10). */}
    </>
  );
}

export default HomePage;
