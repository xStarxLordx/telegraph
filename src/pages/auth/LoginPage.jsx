import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from '../../components/Button/Button';
import ButtonVariant from '../../components/Button/buttonVariant';
import Card from '../../components/Card/Card';
import { GoogleIcon } from '../../components/icons/icons';
import Logo from '../../components/Logo/Logo';
import Notice from '../../components/Notice/Notice';
import TextField from '../../components/TextField/TextField';
import useLogin from '../../hooks/useLogin';
import usePageTitle from '../../hooks/usePageTitle';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import styles from './AuthPages.module.css';

/** /login (R1.2): username + password, or Google. The PublicOnly guard redirects on success. */
function LoginPage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { form, loginWithGoogle, googlePending, pending, error } = useLogin();
  usePageTitle(t('login.title'));

  return (
    <Card framed>
      <div className={styles.intro}>
        <h1 className={styles.logoHeading}>
          <Logo large />
        </h1>
        <p className={styles.tagline}>{t('login.subtitle')}</p>
      </div>

      <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
        {error && <Notice variant="error">{errorMessage(error)}</Notice>}
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
        <Button type="submit" size="large" block pending={form.pending} disabled={googlePending}>
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
        onClick={loginWithGoogle}
        pending={googlePending}
        disabled={pending && !googlePending}
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
