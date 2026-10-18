import { Outlet } from 'react-router';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import styles from './AuthLayout.module.css';
import Washes from './Washes';

/** Layout of the public pages (login, register, username step, 404): one centered card. */
function AuthLayout() {
  return (
    <div className={styles.page}>
      <Washes gears />
      <div className={styles.toolbar}>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
