import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme/themePreference';
import { MoonIcon, SunIcon } from '../icons/icons';
import styles from './ThemeToggle.module.css';

/** Switches between the two palettes: a sun in dark mode, a moon in light mode. */
function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === Theme.DARK;

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
