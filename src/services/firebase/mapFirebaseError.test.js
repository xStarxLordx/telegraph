import { describe, expect, it, vi } from 'vitest';
import { ErrorCode, ServiceError } from '../../domain/errors';
import mapFirebaseError, { withMappedErrors } from './mapFirebaseError';

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
    ['unauthenticated', ErrorCode.NOT_AUTHENTICATED, null],
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

describe('withMappedErrors', () => {
  it('passes the arguments through and returns the result', async () => {
    const add = withMappedErrors(async (a, b) => a + b);
    expect(await add(2, 3)).toBe(5);
  });

  it('turns a provider error into a ServiceError', async () => {
    const original = firebaseError('permission-denied');
    const method = withMappedErrors(async () => {
      throw original;
    });
    const error = await method().catch((caught) => caught);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(error.cause).toBe(original);
  });

  it('logs an unexpected error, but not one the UI already has a message for', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failWith = (error) =>
      withMappedErrors(async () => {
        throw error;
      })().catch(() => {});

    await failWith(firebaseError('permission-denied'));
    await failWith(new ServiceError(ErrorCode.FOLLOW_SELF));
    expect(logged).not.toHaveBeenCalled();

    const needsIndex = firebaseError('failed-precondition');
    await failWith(needsIndex);
    expect(logged).toHaveBeenCalledWith('Unexpected Firebase error.', needsIndex);
    logged.mockRestore();
  });

  it('also catches an error thrown synchronously, and keeps a ServiceError as it is', async () => {
    const original = new ServiceError(ErrorCode.FOLLOW_SELF);
    const method = withMappedErrors(() => {
      throw original;
    });
    await expect(method()).rejects.toBe(original);
  });
});
