// Theme preference: which palette is active and how it is persisted.
// index.html applies the saved theme before React mounts (no flash of the wrong theme), so
// THEME_STORAGE_KEY and the theme names must stay in sync with its inline script.
import type { KeyValueStorage } from '../interfaces/storage';
import type { AttributeTarget, ThemeName } from '../interfaces/theme';

export const Theme = Object.freeze({ DARK: 'dark', LIGHT: 'light' });

export const DEFAULT_THEME: ThemeName = Theme.DARK;

export const THEME_STORAGE_KEY = 'telegraph.theme';

function isTheme(value: unknown): value is ThemeName {
  return (Object.values(Theme) as unknown[]).includes(value);
}

/** Returns `value` when it names a theme, otherwise the default. */
export function normalizeTheme(value: unknown): ThemeName {
  return isTheme(value) ? value : DEFAULT_THEME;
}

export function oppositeTheme(theme: ThemeName): ThemeName {
  return theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
}

/** Reads the saved theme from a Web Storage-like object. */
export function readThemePreference(storage: KeyValueStorage) {
  return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function saveThemePreference(storage: KeyValueStorage, theme: ThemeName) {
  storage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
}

/** Activates a palette: tokens.css switches on the `data-theme` attribute of <html>. */
export function applyTheme(rootElement: AttributeTarget, theme: ThemeName) {
  rootElement.setAttribute('data-theme', normalizeTheme(theme));
}
