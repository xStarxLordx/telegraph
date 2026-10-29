import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { GearIcon } from '../icons/icons';
import styles from './Spinner.module.css';

/** A turning gear. `inline` fits inside a button; otherwise it is centered with its label. */
function Spinner({ label = '', inline = false }) {
  const { t } = useTranslation();
  const text = label || t('common.loading');

  if (inline) {
    return (
      <span className={styles.inline} role="status" aria-label={text}>
        <GearIcon size={18} hubWidth={3} />
      </span>
    );
  }
  return (
    <div className={styles.block} role="status">
      <span className={styles.gear}>
        <GearIcon size={40} />
      </span>
      <span className={styles.label}>{text}</span>
    </div>
  );
}

Spinner.propTypes = {
  label: PropTypes.string,
  inline: PropTypes.bool,
};

export default Spinner;
