import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme/themePreference';
import { MoonIcon, SunIcon } from '../icons/icons';
import styles from './ThemeToggle.module.css';

/** Switches between the two palettes: a sun in dark mode, a moon in light mode. */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === Theme.DARK;

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      // TODO(M1-05): translate through i18next.
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
