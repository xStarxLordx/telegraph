// i18next setup: Spanish by default, English available; the choice is saved in localStorage.
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

export const Language = Object.freeze({ ES: 'es', EN: 'en' });

export const DEFAULT_LANGUAGE = Language.ES;

export const LANGUAGE_STORAGE_KEY = 'telegraph.language';

export const resources = { es: { translation: es }, en: { translation: en } };

/**
 * Creates an initialized i18next instance (synchronous: the resources are bundled).
 * @param {{ lng?: string, rootElement?: { setAttribute: Function } }} [options]
 *   `lng` fixes the language and skips detection (tests). `rootElement` gets its `lang`
 *   attribute updated on every change (document.documentElement in the app).
 */
export function createI18n({ lng, rootElement } = {}) {
  const instance = i18next.createInstance();
  if (rootElement) {
    instance.on('languageChanged', (language) => rootElement.setAttribute('lang', language));
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
