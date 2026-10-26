// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode, ServiceError } from '../domain/errors';
import renderHookWithAuth from '../test/renderHookWithAuth';
import submitEvent from '../test/submitEvent';
import useChooseUsername from './useChooseUsername';

/** Renders the hook with a fake authService; `claimUsername` can be replaced per test. */
function renderChooseUsername(claimUsername = vi.fn().mockResolvedValue({ id: 'u1' })) {
  const authService = { claimUsername };
  return { ...renderHookWithAuth(() => useChooseUsername(), authService), authService };
}

function type(result, username) {
  act(() => result.current.setField('username', username));
}

describe('useChooseUsername', () => {
  it('claims the username typed in the form', async () => {
    const { result, authService } = renderChooseUsername();
    type(result, 'Gina_G');
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authService.claimUsername).toHaveBeenCalledWith('Gina_G');
    expect(result.current.formError).toBeNull();
  });

  it('does not call the service with an invalid username', async () => {
    const { result, authService } = renderChooseUsername();
    type(result, 'x');
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authService.claimUsername).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.username).toBe(ErrorCode.USERNAME_INVALID);
  });

  it('shows a taken username on the field', async () => {
    const claimUsername = vi
      .fn()
      .mockRejectedValue(new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' }));
    const { result } = renderChooseUsername(claimUsername);
    type(result, 'taken');
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.fieldErrors).toEqual({ username: ErrorCode.USERNAME_TAKEN });
  });
});
