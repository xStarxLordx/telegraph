import PropTypes from 'prop-types';
import usePageTitle from '../../hooks/usePageTitle';
import styles from './PageHeader.module.css';

/** Page title (h1, also used as the browser tab title) with an optional subtitle and actions. */
function PageHeader({ title, subtitle = '', actions = null }) {
  usePageTitle(title);
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
};

export default PageHeader;
