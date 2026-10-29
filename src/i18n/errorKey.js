// Maps errors and error codes to translation keys. The UI never shows or parses messages.
import {
  FULL_NAME_MAX_LENGTH,
  MAX_TWEET_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../domain/constants';
import { ErrorCode } from '../domain/errors';

/** Codes that only exist in the UI (form rules the services don't have). */
export const UiErrorCode = Object.freeze({
  PASSWORDS_MISMATCH: 'validation/passwords-mismatch',
});

const KNOWN_CODES = new Set([...Object.values(ErrorCode), ...Object.values(UiErrorCode)]);

/** Interpolation values for messages that mention a limit, e.g. "at least {{passwordMin}}". */
export const ERROR_MESSAGE_VALUES = Object.freeze({
  passwordMin: PASSWORD_MIN_LENGTH,
  usernameMin: USERNAME_MIN_LENGTH,
  usernameMax: USERNAME_MAX_LENGTH,
  fullNameMax: FULL_NAME_MAX_LENGTH,
  tweetMax: MAX_TWEET_LENGTH,
});

/**
 * @param {unknown} errorOrCode A ServiceError, an error code string, or anything else
 *   (which becomes `errors.unknown`).
 * @returns {string} i18n key under `errors`.
 */
export default function errorKey(errorOrCode) {
  const code = typeof errorOrCode === 'string' ? errorOrCode : errorOrCode?.code;
  return KNOWN_CODES.has(code) ? `errors.${code}` : `errors.${ErrorCode.UNKNOWN}`;
}
