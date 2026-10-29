import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { GearIcon } from '../icons/icons';
import styles from './Logo.module.css';

/** Gear + "TELEGRAPH" wordmark. `large` is the stacked version used on the auth pages. */
function Logo({ large = false }) {
  const { t } = useTranslation();
  return (
    <span className={[styles.logo, large && styles.large].filter(Boolean).join(' ')}>
      <GearIcon size={large ? 56 : 36} />
      <span className={styles.wordmark}>{t('app.name')}</span>
    </span>
  );
}

Logo.propTypes = {
  large: PropTypes.bool,
};

export default Logo;
