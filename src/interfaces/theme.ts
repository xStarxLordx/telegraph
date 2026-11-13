import type { Theme } from '../theme/themePreference';

export type ThemeName = (typeof Theme)[keyof typeof Theme];

/** The element that carries `data-theme` and `lang`: document.documentElement in the app. */
export interface AttributeTarget {
  setAttribute(name: string, value: string): void;
}
