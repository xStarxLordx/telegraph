// The one place that turns Firebase errors into ServiceError, so provider codes never reach
// the UI (see src/interfaces/services.ts). Anything not listed here becomes ErrorCode.UNKNOWN.
import { ErrorCode, ServiceError } from '../../domain/errors';
import type { FirebaseErrorMapping } from '../../interfaces/firebase';

/** Firebase error code -> ServiceError code (and the form field it belongs to, if any). */
const FIREBASE_ERRORS: Readonly<Record<string, FirebaseErrorMapping>> = Object.freeze({
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
  // Cloud Storage
  'storage/unauthorized': { code: ErrorCode.PERMISSION_DENIED },
  'storage/unauthenticated': { code: ErrorCode.NOT_AUTHENTICATED },
  'storage/retry-limit-exceeded': { code: ErrorCode.NETWORK_UNAVAILABLE },
});

/** Maps whatever a Firebase call threw; a ServiceError is returned as it is. */
export default function mapFirebaseError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  const mapped = typeof code === 'string' ? FIREBASE_ERRORS[code] : undefined;
  return new ServiceError(mapped?.code ?? ErrorCode.UNKNOWN, {
    field: mapped?.field,
    cause: error,
  });
}

/**
 * Wraps a service method so whatever it throws reaches the UI as a ServiceError. An unexpected
 * error (a missing index, a rule that denies something it shouldn't…) shows the UI only a generic
 * message, so the original is logged for whoever is debugging.
 */
export function withMappedErrors<A extends unknown[], R>(
  method: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A) => {
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
