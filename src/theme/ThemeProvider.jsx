import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import {
  applyTheme,
  oppositeTheme,
  readThemePreference,
  saveThemePreference,
} from './themePreference';

/**
 * Owns the active theme: starts from the saved preference (already applied by index.html),
 * keeps `data-theme` on <html> in sync and persists every change.
 */
function ThemeProvider({ storage, rootElement, children }) {
  const [theme, setTheme] = useState(() => readThemePreference(storage));

  useEffect(() => {
    applyTheme(rootElement, theme);
    saveThemePreference(storage, theme);
  }, [rootElement, storage, theme]);

  const toggleTheme = useCallback(() => setTheme(oppositeTheme), []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  // Web Storage-like object (see src/utils/storage.js).
  storage: PropTypes.shape({
    getItem: PropTypes.func.isRequired,
    setItem: PropTypes.func.isRequired,
  }).isRequired,
  // Element that carries `data-theme`: document.documentElement in the app.
  rootElement: PropTypes.shape({ setAttribute: PropTypes.func.isRequired }).isRequired,
  children: PropTypes.node.isRequired,
};

export default ThemeProvider;
