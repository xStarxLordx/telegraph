import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from '../../components/Button/Button';
import ButtonVariant from '../../components/Button/buttonVariant';
import Card from '../../components/Card/Card';
import { GoogleIcon } from '../../components/icons/icons';
import Logo from '../../components/Logo/Logo';
import Notice from '../../components/Notice/Notice';
import TextField from '../../components/TextField/TextField';
import { ErrorCode } from '../../domain/errors';
import useAsyncAction from '../../hooks/useAsyncAction';
import useForm from '../../hooks/useForm';
import usePageTitle from '../../hooks/usePageTitle';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import { useServices } from '../../services/ServicesContext';
import styles from './AuthPages.module.css';

const required = (value) => (value.trim() ? null : ErrorCode.REQUIRED);

/** /login (R1.2): username + password, or Google. The PublicOnly guard redirects on success. */
function LoginPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { authService } = useServices();
  usePageTitle(t('login.title'));
  const google = useAsyncAction(useCallback(() => authService.loginWithGoogle(), [authService]));

  const form = useForm({
    idPrefix: 'login',
    initialValues: { username: '', password: '' },
    validate: ({ username, password }) => ({
      username: required(username),
      password: password ? null : ErrorCode.REQUIRED,
    }),
    submit: (values) => {
      google.clearError();
      return authService.loginWithUsername(values);
    },
  });
  const busy = form.pending || google.pending;
  const formError = form.formError ?? google.error;

  return (
    <Card framed>
      <div className={styles.intro}>
        <h1 className={styles.logoHeading}>
          <Logo large />
        </h1>
        <p className={styles.tagline}>{t('login.subtitle')}</p>
      </div>

      <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
        {formError && <Notice variant="error">{errorMessage(formError)}</Notice>}
        <TextField
          {...form.fieldProps('username', errorMessage)}
          label={t('fields.username')}
          autoComplete="username"
          placeholder={t('login.usernamePlaceholder')}
          mono
          required
        />
        <TextField
          {...form.fieldProps('password', errorMessage)}
          label={t('fields.password')}
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="large" block pending={form.pending} disabled={google.pending}>
          {t('login.submit')}
        </Button>
      </form>

      <p className={styles.divider}>
        <span>{t('login.or')}</span>
      </p>

      <Button
        variant={ButtonVariant.SECONDARY}
        size="large"
        block
        onClick={() => {
          // Only the latest attempt's error is shown.
          form.clearFormError();
          google.run();
        }}
        pending={google.pending}
        disabled={busy && !google.pending}
      >
        <GoogleIcon />
        {t('login.google')}
      </Button>

      <p className={styles.switch}>
        {t('login.noAccount')} <Link to={Paths.REGISTER}>{t('login.registerLink')}</Link>
      </p>
    </Card>
  );
}

export default LoginPage;
