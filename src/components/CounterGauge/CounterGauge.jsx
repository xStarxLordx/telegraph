import PropTypes from 'prop-types';
import { Link } from 'react-router';
import styles from './CounterGauge.module.css';
import needleAngle from './needleAngle';

/** Pressure-gauge counter (followers / following); links to its list when `to` is given. */
function CounterGauge({ count, label, to = '' }) {
  const content = (
    <>
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" focusable="false">
        <circle cx="42" cy="42" r="38" className={styles.face} />
        <circle cx="42" cy="42" r="30" className={styles.ticks} />
        <line
          x1="42"
          y1="42"
          x2="42"
          y2="18"
          className={styles.needle}
          // A CSS transform (not the SVG attribute) so the needle animates to a new count.
          style={{ transform: `rotate(${needleAngle(count)}deg)` }}
        />
        <circle cx="42" cy="42" r="4" className={styles.hub} />
      </svg>
      <span className={styles.count}>{count}</span>
      <span className={styles.label}>{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className={`${styles.gauge} ${styles.link}`}>
      {content}
    </Link>
  ) : (
    <div className={styles.gauge}>{content}</div>
  );
}

CounterGauge.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  to: PropTypes.string,
};

export default CounterGauge;
