import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { useCurrentUser } from '../../auth/AuthContext';
import { Paths, userPath } from '../../routes/paths';
import { LinkButton } from '../Button/Button';
import {
  FeedIcon,
  FollowersIcon,
  FollowingIcon,
  HomeIcon,
  PenIcon,
  TweetsIcon,
} from '../icons/icons';
import styles from './MainNav.module.css';

const navClassName = ({ isActive }) =>
  [styles.link, isActive && styles.active].filter(Boolean).join(' ');

/** Main navigation of the app shell, with the "Tweet" call to action. */
function MainNav() {
  const { t } = useTranslation();
  const user = useCurrentUser();

  const links = [
    { to: Paths.HOME, label: t('nav.home'), Icon: HomeIcon, end: true },
    { to: Paths.FEED, label: t('nav.feed'), Icon: FeedIcon },
    { to: userPath(user.username), label: t('nav.myTweets'), Icon: TweetsIcon },
    { to: Paths.FOLLOWING, label: t('nav.following'), Icon: FollowingIcon },
    { to: Paths.FOLLOWERS, label: t('nav.followers'), Icon: FollowersIcon },
  ];

  return (
    <nav className={styles.nav} aria-label={t('nav.label')}>
      <ul className={styles.list}>
        {links.map(({ to, label, Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={navClassName}>
              <Icon />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className={styles.cta}>
        <LinkButton to={Paths.COMPOSE} size="large" block>
          <PenIcon />
          {t('nav.tweet')}
        </LinkButton>
      </div>
    </nav>
  );
}

export default MainNav;
