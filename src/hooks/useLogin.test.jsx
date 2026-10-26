// @vitest-environment jsdom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode, ServiceError } from '../domain/errors';
import renderHookWithAuth from '../test/renderHookWithAuth';
import submitEvent from '../test/submitEvent';
import useLogin from './useLogin';

/** Renders the hook with a fake authService; any method can be replaced per test. */
function renderLogin(overrides = {}) {
  const authService = {
    loginWithUsername: vi.fn().mockResolvedValue({ id: 'u1' }),
    loginWithGoogle: vi.fn().mockResolvedValue({ user: { id: 'u1' }, needsUsername: false }),
    ...overrides,
  };
  return { ...renderHookWithAuth(() => useLogin(), authService), authService };
}

describe('useLogin', () => {
  it('logs in with the username and password of the form', async () => {
    const { result, authService } = renderLogin();
    act(() => {
      result.current.form.setField('username', 'ada');
      result.current.form.setField('password', 'telegraph');
    });
    await act(() => result.current.form.handleSubmit(submitEvent()));

    expect(authService.loginWithUsername).toHaveBeenCalledWith({
      username: 'ada',
      password: 'telegraph',
    });
    expect(result.current.error).toBeNull();
  });

  it('does not call the service while a field is empty', async () => {
    const { result, authService } = renderLogin();
    await act(() => result.current.form.handleSubmit(submitEvent()));

    expect(authService.loginWithUsername).not.toHaveBeenCalled();
    expect(result.current.form.fieldErrors).toEqual({
      username: ErrorCode.REQUIRED,
      password: ErrorCode.REQUIRED,
    });
  });

  it('exposes a failed login as the error, and clears it on the next attempt', async () => {
    const loginWithGoogle = vi
      .fn()
      .mockRejectedValueOnce(new ServiceError(ErrorCode.LOGIN_CANCELLED))
      .mockResolvedValue({ user: { id: 'u1' }, needsUsername: false });
    const { result } = renderLogin({ loginWithGoogle });

    await act(() => result.current.loginWithGoogle());
    expect(result.current.error.code).toBe(ErrorCode.LOGIN_CANCELLED);

    await act(() => result.current.loginWithGoogle());
    expect(result.current.error).toBeNull();
  });

  it('is pending while Google login runs, then settles', async () => {
    let finish;
    const loginWithGoogle = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = renderLogin({ loginWithGoogle });

    act(() => {
      result.current.loginWithGoogle();
    });
    await waitFor(() => expect(result.current.googlePending).toBe(true));
    expect(result.current.pending).toBe(true);

    await act(async () => finish({ user: { id: 'u1' }, needsUsername: false }));
    expect(result.current.pending).toBe(false);
  });

  it('drops a Google error when the form is submitted afterwards', async () => {
    const loginWithGoogle = vi.fn().mockRejectedValue(new ServiceError(ErrorCode.POPUP_BLOCKED));
    const { result } = renderLogin({ loginWithGoogle });
    await act(() => result.current.loginWithGoogle());
    expect(result.current.error.code).toBe(ErrorCode.POPUP_BLOCKED);

    act(() => {
      result.current.form.setField('username', 'ada');
      result.current.form.setField('password', 'telegraph');
    });
    await act(() => result.current.form.handleSubmit(submitEvent()));
    expect(result.current.error).toBeNull();
  });
});
