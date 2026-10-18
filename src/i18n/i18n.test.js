// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { ErrorCode } from '../domain/errors';
import formatDateTime from '../utils/formatDateTime';
import errorKey, { ERROR_MESSAGE_VALUES, UiErrorCode } from './errorKey';
import { createI18n, LANGUAGE_STORAGE_KEY } from './i18n';
import en from './locales/en.json';
import es from './locales/es.json';

/** Flattens nested resources into dotted keys ("login.title"). */
function flatKeys(resources, prefix = '') {
  return Object.entries(resources).flatMap(([key, value]) =>
    typeof value === 'object' ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('translations', () => {
  it('have exactly the same keys in es and en', () => {
    expect(flatKeys(en).sort()).toEqual(flatKeys(es).sort());
  });

  it('translate every error code in both languages', () => {
    const codes = [...Object.values(ErrorCode), ...Object.values(UiErrorCode)];
    codes.forEach((code) => {
      expect(es.errors[code], `es ${code}`).toBeTruthy();
      expect(en.errors[code], `en ${code}`).toBeTruthy();
    });
  });

  it('fill limit placeholders in error messages', () => {
    const i18n = createI18n({ lng: 'es' });
    expect(i18n.t(errorKey(ErrorCode.PASSWORD_TOO_SHORT), ERROR_MESSAGE_VALUES)).toBe(
      'La contraseña debe tener al menos 8 caracteres.',
    );
    expect(i18n.t(errorKey(ErrorCode.TWEET_TOO_LONG), ERROR_MESSAGE_VALUES)).toContain('280');
  });
});

describe('createI18n', () => {
  it('starts in Spanish when nothing is saved, whatever the browser language', () => {
    const i18n = createI18n();
    expect(i18n.resolvedLanguage).toBe('es');
    expect(i18n.t('login.submit')).toBe('Iniciar sesión');
  });

  it('restores and saves the chosen language, and syncs <html lang>', async () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    const i18n = createI18n({ rootElement: document.documentElement });
    expect(i18n.resolvedLanguage).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');

    await i18n.changeLanguage('es');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(document.documentElement.getAttribute('lang')).toBe('es');
  });

  it('pluralizes counts', () => {
    const i18n = createI18n({ lng: 'en' });
    expect(i18n.t('user.tweetsHeading', { count: 1 })).toBe('1 tweet');
    expect(i18n.t('user.tweetsHeading', { count: 3 })).toBe('3 tweets');
  });
});

describe('errorKey', () => {
  it('maps known codes, from errors or strings', () => {
    expect(errorKey({ code: ErrorCode.INVALID_CREDENTIALS })).toBe(
      'errors.auth/invalid-credentials',
    );
    expect(errorKey(UiErrorCode.PASSWORDS_MISMATCH)).toBe('errors.validation/passwords-mismatch');
  });

  it('never leaks unknown errors or provider messages', () => {
    expect(errorKey(new Error('Firebase: quota exceeded'))).toBe('errors.unknown');
    expect(errorKey({ code: 'auth/popup-closed-by-user' })).toBe('errors.unknown');
    expect(errorKey(undefined)).toBe('errors.unknown');
  });
});

describe('formatDateTime', () => {
  const date = new Date('2026-10-12T14:58:00Z');

  it('uses day/month order in Spanish and month/day in English', () => {
    expect(formatDateTime(date, 'es', 'UTC')).toBe('12/10/2026, 14:58');
    expect(formatDateTime(date, 'en', 'UTC')).toBe('10/12/2026, 02:58 PM');
  });
});
