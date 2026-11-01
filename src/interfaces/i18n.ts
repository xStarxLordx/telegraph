import type { Language } from '../i18n/i18n';
import type { AttributeTarget } from './theme';

export type LanguageCode = (typeof Language)[keyof typeof Language];

export interface I18nOptions {
  /** Fixes the language and skips detection (tests). */
  lng?: string;
  /** Gets its `lang` attribute updated on every change (document.documentElement in the app). */
  rootElement?: AttributeTarget;
}
