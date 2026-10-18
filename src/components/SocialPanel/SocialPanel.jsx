import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../auth/AuthContext';
import { useFollowCounts } from '../../hooks/useFollowData';
import { Paths } from '../../routes/paths';
import Card from '../Card/Card';
import CounterGauge from '../CounterGauge/CounterGauge';
import Spinner from '../Spinner/Spinner';
import styles from './SocialPanel.module.css';
import useErrorMessage from '../../i18n/useErrorMessage';
import Notice from '../Notice/Notice';

/** "Social gauge": the logged-in user's followers / following counters, linked to the lists. */
function SocialPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const user = useCurrentUser();
  const { data: counts, error } = useFollowCounts(user.id);

  let content;
  if (error) content = <Notice variant="error">{errorMessage(error)}</Notice>;
  else if (!counts) content = <Spinner />;
  else {
    content = (
      <div className={styles.gauges}>
        <CounterGauge
          count={counts.followers}
          label={t('counters.followers')}
          to={Paths.FOLLOWERS}
        />
        <CounterGauge
          count={counts.following}
          label={t('counters.following')}
          to={Paths.FOLLOWING}
        />
      </div>
    );
  }

  return <Card title={t('counters.title')}>{content}</Card>;
}

export default SocialPanel;
