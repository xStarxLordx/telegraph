import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import Header from '../components/Header/Header';
import MainNav from '../components/MainNav/MainNav';
import SocialPanel from '../components/SocialPanel/SocialPanel';
import styles from './AppLayout.module.css';
import Washes from './Washes';

const MAIN_CONTENT_ID = 'main-content';

/** App shell for private pages: header + nav · page content · social gauges. */
function AppLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const previousPathname = useRef(pathname);

  // A new page starts at the top, and focus moves to its content so keyboard and screen
  // reader users land on it (the browser does neither on client-side navigation).
  useEffect(() => {
    // Only on navigation: not on the first render (nor its StrictMode re-run).
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <Washes />
      <a href={`#${MAIN_CONTENT_ID}`} className={styles.skipLink}>
        {t('nav.skipToContent')}
      </a>
      <Header />
      <div className={styles.columns}>
        <div className={styles.nav}>
          <MainNav />
        </div>
        <main id={MAIN_CONTENT_ID} ref={mainRef} className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>
        <aside className={styles.aside} aria-label={t('counters.title')}>
          <SocialPanel />
        </aside>
      </div>
    </div>
  );
}

export default AppLayout;
