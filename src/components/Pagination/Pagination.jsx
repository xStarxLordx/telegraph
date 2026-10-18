import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import styles from './Pagination.module.css';

/**
 * Previous / "Page X of Y" / Next. Takes its values straight from usePaginatedList, which
 * ignores clicks while a page loads (the buttons stay enabled so keyboard focus isn't lost).
 */
function Pagination({ page, totalPages, hasPrev, hasNext, onPrev, onNext }) {
  const { t } = useTranslation();
  return (
    <nav className={styles.pagination} aria-label={t('pagination.label')}>
      <Button variant={ButtonVariant.GHOST} onClick={onPrev} disabled={!hasPrev}>
        <span aria-hidden="true">‹</span> {t('pagination.previous')}
      </Button>
      <span className={styles.status} aria-live="polite">
        {t('pagination.status', { page, totalPages })}
      </span>
      <Button variant={ButtonVariant.GHOST} onClick={onNext} disabled={!hasNext}>
        {t('pagination.next')} <span aria-hidden="true">›</span>
      </Button>
    </nav>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  hasPrev: PropTypes.bool.isRequired,
  hasNext: PropTypes.bool.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default Pagination;
