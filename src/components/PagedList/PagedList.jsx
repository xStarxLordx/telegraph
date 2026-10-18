import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useErrorMessage from '../../i18n/useErrorMessage';
import Button from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import Notice from '../Notice/Notice';
import Pagination from '../Pagination/Pagination';
import Spinner from '../Spinner/Spinner';
import styles from './PagedList.module.css';

/**
 * Renders a usePaginatedList result: spinner on the first load, error with retry, empty state,
 * the items (`children`) and the pagination bar. While another page loads the current items
 * stay visible and dimmed.
 */
function PagedList({ list, label, emptyState, children, as = 'ul' }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { items, loading, error, page, totalPages, hasPrev, hasNext, prev, next, reload, first } =
    list;
  const List = as;

  // New page: start reading from the top again.
  const turnPage = (turn) => () => {
    turn();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className={styles.error}>
        <Notice variant="error">{errorMessage(error)}</Notice>
        <Button variant={ButtonVariant.GHOST} onClick={reload}>
          {t('common.retry')}
        </Button>
        {page > 1 && (
          <Button variant={ButtonVariant.GHOST} onClick={first}>
            {t('pagination.first')}
          </Button>
        )}
      </div>
    );
  }
  if (loading && items.length === 0) return <Spinner />;
  if (items.length === 0) return emptyState;

  return (
    <div className={styles.wrapper}>
      <List
        className={styles.items}
        // Tweets are <article>s: an ARIA feed. People are <li>s of the list itself.
        role={as === 'div' ? 'feed' : undefined}
        aria-label={label}
        aria-busy={loading || undefined}
      >
        {children}
      </List>
      <Pagination
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={turnPage(prev)}
        onNext={turnPage(next)}
      />
    </div>
  );
}

PagedList.propTypes = {
  list: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string]),
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    hasPrev: PropTypes.bool.isRequired,
    hasNext: PropTypes.bool.isRequired,
    prev: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired,
    reload: PropTypes.func.isRequired,
    first: PropTypes.func.isRequired,
  }).isRequired,
  /** Accessible name of the list (e.g. "Following"). */
  label: PropTypes.string.isRequired,
  emptyState: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  /** `ul` for people (children are <li>), `div` for tweets (children are <article>). */
  as: PropTypes.oneOf(['ul', 'div']),
};

export default PagedList;
