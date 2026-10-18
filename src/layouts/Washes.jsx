import PropTypes from 'prop-types';
import styles from './Washes.module.css';

/**
 * Ambient blurred blobs behind the content: a gaslight glow in dark mode, watercolor washes
 * in light mode (same markup, only the color tokens differ). `gears` adds the large
 * watermark gears of the auth pages.
 */
function Washes({ gears = false }) {
  return (
    <div className={styles.washes} aria-hidden="true">
      <span className={`${styles.blob} ${styles.one}`} />
      <span className={`${styles.blob} ${styles.two}`} />
      <span className={`${styles.blob} ${styles.three}`} />
      {gears && (
        <>
          <svg className={`${styles.gear} ${styles.gearLarge}`} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="17" strokeWidth="7" strokeDasharray="4.4 3.6" />
            <circle cx="24" cy="24" r="12" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="4" strokeWidth="1.5" />
          </svg>
          <svg className={`${styles.gear} ${styles.gearSmall}`} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="17" strokeWidth="7" strokeDasharray="3 3" />
            <circle cx="24" cy="24" r="10" strokeWidth="1.5" />
          </svg>
        </>
      )}
    </div>
  );
}

Washes.propTypes = {
  gears: PropTypes.bool,
};

export default Washes;
