import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentUser } from '../../auth/AuthContext';
import useLogout from '../../hooks/useLogout';
import { Paths, userPath } from '../../routes/paths';
import { LogoutIcon } from '../icons/icons';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import Logo from '../Logo/Logo';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import styles from './Header.module.css';

/** Common header (R1.9): logo back to home, the logged-in @username, logout, theme and language. */
function Header() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { run: logout, pending } = useLogout();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={Paths.HOME} className={styles.home} title={t('header.home')}>
          <Logo />
        </Link>
        <nav className={styles.account} aria-label={t('header.account')}>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            to={userPath(user.username)}
            className={styles.username}
            aria-label={t('header.profile', { username: user.username })}
          >
            @{user.username}
          </Link>
          <button
            type="button"
            className={styles.logout}
            onClick={() => logout()}
            disabled={pending}
          >
            <LogoutIcon />
            {t('header.logout')}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
