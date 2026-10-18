import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../utils/storage';
import { useTheme } from './ThemeContext';
import ThemeProvider from './ThemeProvider';
import {
  applyTheme,
  DEFAULT_THEME,
  normalizeTheme,
  oppositeTheme,
  readThemePreference,
  saveThemePreference,
  Theme,
  THEME_STORAGE_KEY,
} from './themePreference';

function createRootElement() {
  const attributes = {};
  return {
    attributes,
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
  };
}

describe('themePreference', () => {
  it('defaults to the dark theme', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(readThemePreference(createMemoryStorage())).toBe('dark');
  });

  it('ignores unknown saved values', () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readThemePreference(storage)).toBe('dark');
    expect(normalizeTheme(undefined)).toBe('dark');
  });

  it('saves and reads back the light theme', () => {
    const storage = createMemoryStorage();
    saveThemePreference(storage, Theme.LIGHT);
    expect(storage.getItem('telegraph.theme')).toBe('light');
    expect(readThemePreference(storage)).toBe('light');
  });

  it('toggles between the two themes', () => {
    expect(oppositeTheme(Theme.DARK)).toBe('light');
    expect(oppositeTheme(Theme.LIGHT)).toBe('dark');
  });

  it('sets data-theme on the root element', () => {
    const root = createRootElement();
    applyTheme(root, Theme.LIGHT);
    expect(root.attributes['data-theme']).toBe('light');
  });

  it('uses the same storage key as the inline script in index.html', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    expect(html).toContain(`getItem('${THEME_STORAGE_KEY}') === '${Theme.LIGHT}'`);
  });
});

function ThemeName() {
  return useTheme().theme;
}

describe('ThemeProvider', () => {
  it('starts from the saved preference', () => {
    const storage = createMemoryStorage();
    saveThemePreference(storage, Theme.LIGHT);
    const html = renderToString(
      <ThemeProvider storage={storage} rootElement={createRootElement()}>
        <ThemeName />
      </ThemeProvider>,
    );
    expect(html).toBe('light');
  });

  it('fails loudly when useTheme is used outside the provider', () => {
    expect(() => renderToString(<ThemeName />)).toThrow(/inside <ThemeProvider>/);
  });
});
