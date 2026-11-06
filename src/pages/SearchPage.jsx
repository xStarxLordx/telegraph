import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import EmptyState from '../components/EmptyState/EmptyState';
import PageHeader from '../components/PageHeader/PageHeader';
import PeopleList from '../components/PeopleList/PeopleList';
import SearchBox from '../components/SearchBox/SearchBox';
import usePaginatedList from '../hooks/usePaginatedList';
import { userPath } from '../routes/paths';
import { useServices } from '../services/ServicesContext';
import styles from './SearchPage.module.css';

function SearchForm({ initialTerm, onSearch }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initialTerm);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <Card>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <SearchBox
          id="search-term"
          label={t('search.label')}
          value={draft}
          onChange={setDraft}
          onPick={(user) => navigate(userPath(user.username))}
          placeholder={t('search.placeholder')}
        />
        <div className={styles.actions}>
          <Button type="submit">{t('search.submit')}</Button>
        </div>
      </form>
    </Card>
  );
}

SearchForm.propTypes = {
  initialTerm: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
};

function SearchPage() {
  const { t } = useTranslation();
  const { userService } = useServices();
  const [params, setParams] = useSearchParams();
  const term = params.get('q') ?? '';
  const fetchPage = useCallback(
    (request) => userService.search(term, request),
    [userService, term],
  );
  const list = usePaginatedList(fetchPage);

  const search = (value) => setParams(value ? { q: value } : {});

  const emptyState = term ? (
    <EmptyState
      title={t('search.noResultsTitle', { term })}
      message={t('search.noResultsMessage')}
    />
  ) : (
    <EmptyState title={t('search.promptTitle')} message={t('search.promptMessage')} />
  );

  return (
    <>
      <PageHeader
        title={t('search.title')}
        subtitle={
          term && list.settled
            ? t('search.subtitle', { count: list.total, term })
            : t('search.hint')
        }
      />
      <SearchForm key={term} initialTerm={term} onSearch={search} />
      <PeopleList list={list} label={t('search.results')} emptyState={emptyState} />
    </>
  );
}

export default SearchPage;
