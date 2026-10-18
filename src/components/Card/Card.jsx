import PropTypes from 'prop-types';
import { useId } from 'react';
import styles from './Card.module.css';

/**
 * Panel on the surface color. `framed` adds the riveted double frame (auth pages, page
 * headers); a `title` names the section for assistive technology.
 */
function Card({ children, title = '', framed = false, className = '' }) {
  const titleId = useId();
  return (
    <section
      className={[styles.card, framed && styles.framed, className].filter(Boolean).join(' ')}
      aria-labelledby={title ? titleId : undefined}
    >
      {framed && (
        <>
          <span aria-hidden="true" className={`${styles.rivet} ${styles.topLeft}`} />
          <span aria-hidden="true" className={`${styles.rivet} ${styles.topRight}`} />
          <span aria-hidden="true" className={`${styles.rivet} ${styles.bottomLeft}`} />
          <span aria-hidden="true" className={`${styles.rivet} ${styles.bottomRight}`} />
        </>
      )}
      {title && (
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  framed: PropTypes.bool,
  className: PropTypes.string,
};

export default Card;
