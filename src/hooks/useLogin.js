import { useCallback } from 'react';
import { ErrorCode } from '../domain/errors';
import { useServices } from '../services/ServicesContext';
import useAsyncAction from './useAsyncAction';
import useForm from './useForm';

const required = (value) => (value.trim() ? null : ErrorCode.REQUIRED);

/**
 * Login with username and password (the `form`) or with Google (`loginWithGoogle`). Both share
 * one busy and error state, so the page shows a single attempt at a time. Nothing navigates
 * here: when the session changes, the route guards redirect (see src/routes/guards.jsx).
 */
export default function useLogin() {
  const { authService } = useServices();
  const google = useAsyncAction(useCallback(() => authService.loginWithGoogle(), [authService]));
  const { clearError: clearGoogleError, run: runGoogle } = google;

  const form = useForm({
    idPrefix: 'login',
    initialValues: { username: '', password: '' },
    validate: ({ username, password }) => ({
      username: required(username),
      password: password ? null : ErrorCode.REQUIRED,
    }),
    submit: (values) => {
      clearGoogleError();
      return authService.loginWithUsername(values);
    },
  });
  const { clearFormError } = form;

  const loginWithGoogle = useCallback(() => {
    // Only the latest attempt's error is shown.
    clearFormError();
    return runGoogle();
  }, [clearFormError, runGoogle]);

  return {
    form,
    loginWithGoogle,
    googlePending: google.pending,
    /** True while either login method is running. */
    pending: form.pending || google.pending,
    /** Error code or ServiceError of the latest failed attempt (translate with useErrorMessage). */
    error: form.formError ?? google.error,
  };
}
