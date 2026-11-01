// i18next setup: Spanish by default, English available; the choice is saved in localStorage.
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import type { I18nOptions, LanguageCode } from '../interfaces/i18n';

export const Language = Object.freeze({ ES: 'es', EN: 'en' });

export const DEFAULT_LANGUAGE: LanguageCode = Language.ES;

export const LANGUAGE_STORAGE_KEY = 'telegraph.language';

export const resources = { es: { translation: es }, en: { translation: en } };

/** Creates an initialized i18next instance (synchronous: the resources are bundled). */
export function createI18n({ lng, rootElement }: I18nOptions = {}) {
  const instance = i18next.createInstance();
  if (rootElement) {
    instance.on('languageChanged', (language: string) =>
      rootElement.setAttribute('lang', language),
    );
  }
  if (!lng) instance.use(LanguageDetector);
  instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.values(Language),
    // es-CO → es
    load: 'languageOnly',
    initAsync: false,
    interpolation: { escapeValue: false }, // React already escapes.
    detection: {
      // Only an explicit choice counts: a new visitor gets Spanish, whatever the browser says.
      order: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });
  return instance;
}
