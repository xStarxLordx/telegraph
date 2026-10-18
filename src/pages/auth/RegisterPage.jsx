import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Logo from '../../components/Logo/Logo';
import Notice from '../../components/Notice/Notice';
import TextField from '../../components/TextField/TextField';
import { ErrorCode } from '../../domain/errors';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from '../../domain/validation';
import useForm from '../../hooks/useForm';
import usePageTitle from '../../hooks/usePageTitle';
import { ERROR_MESSAGE_VALUES, UiErrorCode } from '../../i18n/errorKey';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import { useServices } from '../../services/ServicesContext';
import styles from './AuthPages.module.css';

const initialValues = { fullName: '', username: '', email: '', password: '', confirmPassword: '' };

/** Same rules as the service (src/domain), plus the UI-only password confirmation. */
function validate(values) {
  let confirmPassword = null;
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

/** /register (R1.1). Registering logs in, and the PublicOnly guard then goes home. */
function RegisterPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { authService } = useServices();
  usePageTitle(t('register.title'));

  const form = useForm({
    idPrefix: 'register',
    initialValues,
    validate,
    submit: ({ fullName, username, email, password }) =>
      authService.register({ fullName, username, email, password }),
  });

  return (
    <Card framed>
      <div className={styles.intro}>
        <Logo large />
        <h1 className={styles.heading}>{t('register.title')}</h1>
        <p className={styles.tagline}>{t('register.subtitle')}</p>
      </div>

      <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice variant="error">{errorMessage(form.formError)}</Notice>}
        <TextField
          {...form.fieldProps('fullName', errorMessage)}
          label={t('fields.fullName')}
          autoComplete="name"
          required
        />
        <TextField
          {...form.fieldProps('username', errorMessage)}
          label={t('fields.username')}
          autoComplete="username"
          hint={t('register.usernameHint', ERROR_MESSAGE_VALUES)}
          mono
          required
        />
        <TextField
          {...form.fieldProps('email', errorMessage)}
          label={t('fields.email')}
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          {...form.fieldProps('password', errorMessage)}
          label={t('fields.password')}
          type="password"
          autoComplete="new-password"
          hint={t('register.passwordHint', ERROR_MESSAGE_VALUES)}
          required
        />
        <TextField
          {...form.fieldProps('confirmPassword', errorMessage)}
          label={t('fields.confirmPassword')}
          type="password"
          autoComplete="new-password"
          required
        />
        <Button type="submit" size="large" block pending={form.pending}>
          {t('register.submit')}
        </Button>
      </form>

      <p className={styles.switch}>
        {t('register.haveAccount')} <Link to={Paths.LOGIN}>{t('register.loginLink')}</Link>
      </p>
    </Card>
  );
}

export default RegisterPage;
