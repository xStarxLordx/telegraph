import PropTypes from 'prop-types';
import { GearIcon } from '../icons/icons';
import styles from './EmptyState.module.css';

/** Shown instead of an empty list or a missing resource, with an optional next step. */
function EmptyState({ title, message = '', action = null }) {
  return (
    <div className={styles.empty}>
      <span className={styles.gear}>
        <GearIcon size={56} hubWidth={1.5} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {action}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  action: PropTypes.node,
};

export default EmptyState;
