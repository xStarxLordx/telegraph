import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import useFollowByUsername from '../../hooks/useFollowByUsername';
import useErrorMessage from '../../i18n/useErrorMessage';
import { Paths } from '../../routes/paths';
import Button from '../Button/Button';
import Card from '../Card/Card';
import Notice from '../Notice/Notice';
import TextField from '../TextField/TextField';
import styles from './FollowByUsernameForm.module.css';

function FollowByUsernameForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const form = useFollowByUsername();

  return (
    <Card title={t('followByUsername.title')}>
      <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice variant="error">{errorMessage(form.formError)}</Notice>}
        <TextField
          {...form.fieldProps('username', errorMessage)}
          label={t('fields.username')}
          placeholder={t('followByUsername.placeholder')}
          autoComplete="off"
          mono
        />
        <div className={styles.actions}>
          <p className={styles.hint}>
            <Link to={Paths.SEARCH}>{t('followByUsername.searchLink')}</Link>
          </p>
          <Button type="submit" pending={form.pending}>
            {t('follow.follow')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default FollowByUsernameForm;
