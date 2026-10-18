import { useTranslation } from 'react-i18next';
import { LinkButton } from '../components/Button/Button';
import Card from '../components/Card/Card';
import Logo from '../components/Logo/Logo';
import usePageTitle from '../hooks/usePageTitle';
import { Paths } from '../routes/paths';
import styles from './auth/AuthPages.module.css';

/** Any unknown URL. Home sends logged-out visitors on to /login. */
function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <Card framed>
      <div className={styles.intro}>
        <Logo large />
        <p className={styles.code}>404</p>
        <h1 className={styles.heading}>{t('notFound.title')}</h1>
        <p className={styles.tagline}>{t('notFound.message')}</p>
      </div>
      <LinkButton to={Paths.HOME} size="large" block>
        {t('notFound.backHome')}
      </LinkButton>
    </Card>
  );
}

export default NotFoundPage;
