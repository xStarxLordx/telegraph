import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Notice from '../components/Notice/Notice';
import PageHeader from '../components/PageHeader/PageHeader';
import { TextArea } from '../components/TextField/TextField';
import { useToast } from '../components/Toast/ToastContext';
import useAsyncAction from '../hooks/useAsyncAction';
import useTweetDraft, { CounterState } from '../hooks/useTweetDraft';
import useErrorMessage from '../i18n/useErrorMessage';
import { Paths } from '../routes/paths';
import styles from './ComposePage.module.css';

/** /compose (R1.4): multiline text, live n / 280 counter and "Publicar". */
function ComposePage() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { text, setText, counter, publish } = useTweetDraft();
  const { run, pending, error } = useAsyncAction(publish);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!counter.canPublish || pending) return;
    const result = await run();
    if (result.ok) {
      showToast(t('compose.published'));
      navigate(Paths.FEED);
    }
  };

  // Announced once per state change (near / over the limit), not on every keystroke.
  const announcement = {
    [CounterState.NEAR]: t('compose.nearLimitAnnouncement'),
    [CounterState.OVER]: t('compose.overLimitAnnouncement'),
  }[counter.state];

  const counterText = (
    <span className={`${styles.counter} ${styles[counter.state]}`}>
      {t('compose.counter', { count: counter.count, max: counter.max })}
      {counter.state === CounterState.OVER && ` · ${t('compose.overLimit')}`}
    </span>
  );

  return (
    <>
      <PageHeader
        title={t('compose.title')}
        subtitle={t('compose.subtitle', { max: counter.max })}
      />
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <Notice variant="error">{errorMessage(error)}</Notice>}
          <TextArea
            id="compose-body"
            label={t('compose.label')}
            value={text}
            onChange={setText}
            hint={counterText}
            placeholder={t('compose.placeholder')}
            rows={6}
          />
          <p className="visually-hidden" aria-live="polite">
            {announcement ?? ''}
          </p>
          <div className={styles.actions}>
            <Button type="submit" size="large" disabled={!counter.canPublish} pending={pending}>
              {t('compose.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

export default ComposePage;
