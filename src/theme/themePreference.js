// Theme preference: which palette is active and how it is persisted.
// index.html applies the saved theme before React mounts (no flash of the wrong theme), so
// THEME_STORAGE_KEY and the theme names must stay in sync with its inline script.

export const Theme = Object.freeze({ DARK: 'dark', LIGHT: 'light' });

export const DEFAULT_THEME = Theme.DARK;

export const THEME_STORAGE_KEY = 'telegraph.theme';

/** Returns `value` when it names a theme, otherwise the default. */
export function normalizeTheme(value) {
  return Object.values(Theme).includes(value) ? value : DEFAULT_THEME;
}

export function oppositeTheme(theme) {
  return theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
}

/** Reads the saved theme from a Web Storage-like object. */
export function readThemePreference(storage) {
  return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function saveThemePreference(storage, theme) {
  storage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
}

/** Activates a palette: tokens.css switches on the `data-theme` attribute of <html>. */
export function applyTheme(rootElement, theme) {
  rootElement.setAttribute('data-theme', normalizeTheme(theme));
}
