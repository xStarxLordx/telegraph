import { useTranslation } from 'react-i18next';
import Button from '../../components/Button/Button';
import ButtonVariant from '../../components/Button/buttonVariant';
import Card from '../../components/Card/Card';
import Logo from '../../components/Logo/Logo';
import Notice from '../../components/Notice/Notice';
import TextField from '../../components/TextField/TextField';
import { validateUsername } from '../../domain/validation';
import useForm from '../../hooks/useForm';
import useLogout from '../../hooks/useLogout';
import usePageTitle from '../../hooks/usePageTitle';
import { ERROR_MESSAGE_VALUES } from '../../i18n/errorKey';
import useErrorMessage from '../../i18n/useErrorMessage';
import { useServices } from '../../services/ServicesContext';
import styles from './AuthPages.module.css';

/**
 * First Google login: the account has no username yet and must pick one before entering the
 * app. Minimal M1 version on the mock; M2-06 connects it to Firebase.
 */
function ChooseUsernamePage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { authService } = useServices();
  const { run: logout, pending: loggingOut } = useLogout();
  usePageTitle(t('chooseUsername.title'));

  const form = useForm({
    idPrefix: 'choose-username',
    initialValues: { username: '' },
    validate: ({ username }) => ({ username: validateUsername(username) }),
    submit: ({ username }) => authService.claimUsername(username),
  });

  return (
    <Card framed>
      <div className={styles.intro}>
        <Logo large />
        <h1 className={styles.heading}>{t('chooseUsername.title')}</h1>
        <p className={styles.tagline}>{t('chooseUsername.subtitle')}</p>
      </div>
      <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice variant="error">{errorMessage(form.formError)}</Notice>}
        <TextField
          {...form.fieldProps('username', errorMessage)}
          label={t('fields.username')}
          autoComplete="username"
          hint={t('register.usernameHint', ERROR_MESSAGE_VALUES)}
          mono
          required
        />
        <Button type="submit" size="large" block pending={form.pending}>
          {t('chooseUsername.submit')}
        </Button>
      </form>
      <Button variant={ButtonVariant.GHOST} block onClick={() => logout()} pending={loggingOut}>
        {t('header.logout')}
      </Button>
    </Card>
  );
}

export default ChooseUsernamePage;
