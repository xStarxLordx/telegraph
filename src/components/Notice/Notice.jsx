import PropTypes from 'prop-types';
import styles from './Notice.module.css';

/** Inline message. Errors interrupt screen readers (alert); the rest are polite (status). */
function Notice({ children, variant = 'info' }) {
  return (
    <p
      className={`${styles.notice} ${styles[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}

Notice.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['info', 'success', 'error']),
};

export default Notice;
