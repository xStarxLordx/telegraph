import { describe, expect, it } from 'vitest';
import { ErrorCode, ServiceError } from '../../domain/errors';
import mapFirebaseError from './mapFirebaseError';

const firebaseError = (code) => Object.assign(new Error(`Firebase: ${code}`), { code });

describe('mapFirebaseError', () => {
  it.each([
    ['auth/invalid-credential', ErrorCode.INVALID_CREDENTIALS, null],
    ['auth/wrong-password', ErrorCode.INVALID_CREDENTIALS, null],
    ['auth/user-not-found', ErrorCode.INVALID_CREDENTIALS, null],
    ['auth/email-already-in-use', ErrorCode.EMAIL_TAKEN, 'email'],
    ['auth/invalid-email', ErrorCode.EMAIL_INVALID, 'email'],
    ['auth/weak-password', ErrorCode.PASSWORD_TOO_SHORT, 'password'],
    ['auth/too-many-requests', ErrorCode.TOO_MANY_ATTEMPTS, null],
    ['auth/popup-closed-by-user', ErrorCode.LOGIN_CANCELLED, null],
    ['auth/cancelled-popup-request', ErrorCode.LOGIN_CANCELLED, null],
    ['auth/popup-blocked', ErrorCode.POPUP_BLOCKED, null],
    ['auth/network-request-failed', ErrorCode.NETWORK_UNAVAILABLE, null],
    ['permission-denied', ErrorCode.PERMISSION_DENIED, null],
    ['unavailable', ErrorCode.NETWORK_UNAVAILABLE, null],
  ])('maps %s to %s', (firebaseCode, code, field) => {
    const error = mapFirebaseError(firebaseError(firebaseCode));
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(code);
    expect(error.field).toBe(field);
  });

  it('keeps the original error as the cause', () => {
    const original = firebaseError('auth/invalid-credential');
    expect(mapFirebaseError(original).cause).toBe(original);
  });

  it('turns anything unexpected into UNKNOWN', () => {
    expect(mapFirebaseError(firebaseError('auth/something-new')).code).toBe(ErrorCode.UNKNOWN);
    expect(mapFirebaseError(new TypeError('boom')).code).toBe(ErrorCode.UNKNOWN);
    expect(mapFirebaseError(undefined).code).toBe(ErrorCode.UNKNOWN);
  });

  it('returns a ServiceError untouched', () => {
    const original = new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' });
    expect(mapFirebaseError(original)).toBe(original);
  });
});
