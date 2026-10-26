// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode, ServiceError } from '../domain/errors';
import { UiErrorCode } from '../i18n/errorKey';
import renderHookWithAuth from '../test/renderHookWithAuth';
import submitEvent from '../test/submitEvent';
import useRegister from './useRegister';

const VALID = {
  fullName: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  password: 'telegraph1',
  confirmPassword: 'telegraph1',
};

/** Renders the hook with a fake authService; `register` can be replaced per test. */
function renderRegister(register = vi.fn().mockResolvedValue({ id: 'u1' })) {
  const authService = { register };
  return { ...renderHookWithAuth(() => useRegister(), authService), authService };
}

function fill(result, values) {
  act(() => {
    Object.entries(values).forEach(([name, value]) => result.current.setField(name, value));
  });
}

describe('useRegister', () => {
  it('registers with the form values, without the password confirmation', async () => {
    const { result, authService } = renderRegister();
    fill(result, VALID);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authService.register).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      password: 'telegraph1',
    });
    expect(result.current.formError).toBeNull();
  });

  it('does not call the service while the form is invalid', async () => {
    const { result, authService } = renderRegister();
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authService.register).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.confirmPassword).toBe(ErrorCode.REQUIRED);
    expect(result.current.fieldErrors.username).toBeTruthy();
  });

  it('flags a password confirmation that does not match', async () => {
    const { result, authService } = renderRegister();
    fill(result, { ...VALID, confirmPassword: 'telegraph2' });
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authService.register).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.confirmPassword).toBe(UiErrorCode.PASSWORDS_MISMATCH);
  });

  it('puts a service error on the field it names', async () => {
    const register = vi
      .fn()
      .mockRejectedValue(new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' }));
    const { result } = renderRegister(register);
    fill(result, VALID);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.fieldErrors).toEqual({ username: ErrorCode.USERNAME_TAKEN });
    expect(result.current.formError).toBeNull();
  });
});
