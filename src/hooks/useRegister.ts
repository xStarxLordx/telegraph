import { ErrorCode } from '../domain/errors';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from '../domain/validation';
import { UiErrorCode } from '../i18n/errorKey';
import type { AppErrorCode } from '../interfaces/errors';
import type { FieldErrors, FormState, RegisterValues } from '../interfaces/hooks';
import { useServices } from '../services/ServicesContext';
import useForm from './useForm';

const initialValues: RegisterValues = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/** Same rules as the service (src/domain), plus the UI-only password confirmation. */
function validate(values: RegisterValues): FieldErrors<RegisterValues> {
  let confirmPassword: AppErrorCode | null = null;
  if (!values.confirmPassword) confirmPassword = ErrorCode.REQUIRED;
  else if (values.confirmPassword !== values.password) {
    confirmPassword = UiErrorCode.PASSWORDS_MISMATCH;
  }
  return {
    fullName: validateFullName(values.fullName),
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword,
  };
}

/**
 * Registration form (R1.1). Registering logs in, and nothing navigates here: the PublicOnly
 * guard then sends the new session home (see src/routes/guards.jsx).
 */
export default function useRegister(): FormState<RegisterValues> {
  const { authService } = useServices();
  return useForm({
    idPrefix: 'register',
    initialValues,
    validate,
    submit: ({ fullName, username, email, password }) =>
      authService.register({ fullName, username, email, password }),
  });
}
