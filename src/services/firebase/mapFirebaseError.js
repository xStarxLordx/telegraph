// The one place that turns Firebase errors into ServiceError, so provider codes never reach
// the UI (see contracts.js). Anything not listed here becomes ErrorCode.UNKNOWN.
import { ErrorCode, ServiceError } from '../../domain/errors';

/** Firebase error code -> ServiceError code (and the form field it belongs to, if any). */
const FIREBASE_ERRORS = Object.freeze({
  // Firebase Authentication
  'auth/invalid-credential': { code: ErrorCode.INVALID_CREDENTIALS },
  'auth/wrong-password': { code: ErrorCode.INVALID_CREDENTIALS },
  'auth/user-not-found': { code: ErrorCode.INVALID_CREDENTIALS },
  'auth/email-already-in-use': { code: ErrorCode.EMAIL_TAKEN, field: 'email' },
  'auth/invalid-email': { code: ErrorCode.EMAIL_INVALID, field: 'email' },
  'auth/weak-password': { code: ErrorCode.PASSWORD_TOO_SHORT, field: 'password' },
  'auth/too-many-requests': { code: ErrorCode.TOO_MANY_ATTEMPTS },
  'auth/popup-closed-by-user': { code: ErrorCode.LOGIN_CANCELLED },
  'auth/cancelled-popup-request': { code: ErrorCode.LOGIN_CANCELLED },
  'auth/popup-blocked': { code: ErrorCode.POPUP_BLOCKED },
  'auth/network-request-failed': { code: ErrorCode.NETWORK_UNAVAILABLE },
  // Cloud Firestore
  'permission-denied': { code: ErrorCode.PERMISSION_DENIED },
  unauthenticated: { code: ErrorCode.NOT_AUTHENTICATED },
  unavailable: { code: ErrorCode.NETWORK_UNAVAILABLE },
});

/**
 * @param {unknown} error Whatever a Firebase call threw.
 * @returns {ServiceError} `error` itself when it already is one.
 */
export default function mapFirebaseError(error) {
  if (error instanceof ServiceError) return error;
  const mapped = FIREBASE_ERRORS[error?.code];
  return new ServiceError(mapped?.code ?? ErrorCode.UNKNOWN, {
    field: mapped?.field,
    cause: error,
  });
}

/**
 * Wraps a service method so whatever it throws reaches the UI as a ServiceError. An unexpected
 * error (a missing index, a rule that denies something it shouldn't…) shows the UI only a generic
 * message, so the original is logged for whoever is debugging.
 * @template {(...args: any[]) => Promise<any>} T
 * @param {T} method
 * @returns {T}
 */
export function withMappedErrors(method) {
  return async (...args) => {
    try {
      return await method(...args);
    } catch (error) {
      const mapped = mapFirebaseError(error);
      if (mapped.code === ErrorCode.UNKNOWN) {
        // eslint-disable-next-line no-console
        console.error('Unexpected Firebase error.', error);
      }
      throw mapped;
    }
  };
}
