// Business errors thrown by every service implementation (mock or Firebase).
// The UI maps `code` to an i18n key; it never parses messages.
import type { ErrorCodeValue, ServiceErrorOptions } from '../interfaces/errors';

export const ErrorCode = Object.freeze({
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  NOT_AUTHENTICATED: 'auth/not-authenticated',
  /** The acting user isn't the logged-in user (Firestore rules reject it too). */
  PERMISSION_DENIED: 'auth/permission-denied',
  /** The provider blocked the account for a while after too many failed logins. */
  TOO_MANY_ATTEMPTS: 'auth/too-many-attempts',
  /** The user closed the Google popup before finishing. */
  LOGIN_CANCELLED: 'auth/login-cancelled',
  /** The browser blocked the Google popup. */
  POPUP_BLOCKED: 'auth/popup-blocked',
  NETWORK_UNAVAILABLE: 'network/unavailable',
  USERNAME_TAKEN: 'user/username-taken',
  EMAIL_TAKEN: 'user/email-taken',
  USER_NOT_FOUND: 'user/not-found',
  USERNAME_ALREADY_SET: 'user/username-already-set',
  /** A Google account must pick a username before publishing or following (M2-06). */
  USERNAME_REQUIRED: 'user/username-required',
  FOLLOW_SELF: 'follow/self',
  ALREADY_FOLLOWING: 'follow/already-following',
  INVALID_CURSOR: 'pagination/invalid-cursor',
  INVALID_PAGE_SIZE: 'pagination/invalid-page-size',
  /** Anything unexpected (network, provider errors); implementations map to it, never leak. */
  UNKNOWN: 'unknown',
  // Validation codes (see validation.ts)
  REQUIRED: 'validation/required',
  FULL_NAME_TOO_LONG: 'validation/full-name-too-long',
  USERNAME_INVALID: 'validation/username-invalid',
  EMAIL_INVALID: 'validation/email-invalid',
  PASSWORD_TOO_SHORT: 'validation/password-too-short',
  TWEET_EMPTY: 'validation/tweet-empty',
  TWEET_TOO_LONG: 'validation/tweet-too-long',
  /** The file isn't one of the image, GIF or video formats a tweet accepts (or it is empty). */
  MEDIA_UNSUPPORTED: 'validation/media-unsupported',
  MEDIA_TOO_LARGE: 'validation/media-too-large',
});

export class ServiceError extends Error {
  readonly code: ErrorCodeValue;

  /** The form field the error belongs to, or null for the whole form. */
  readonly field: string | null;

  constructor(code: ErrorCodeValue, { field, cause }: ServiceErrorOptions = {}) {
    super(code, cause === undefined ? undefined : { cause });
    this.name = 'ServiceError';
    this.code = code;
    this.field = field ?? null;
  }
}
