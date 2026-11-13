import PropTypes from 'prop-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SUGGESTION_DELAY_MS } from '../../domain/constants';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useUserSuggestions from '../../hooks/useUserSuggestions';
import { userPath } from '../../routes/paths';
import fieldStyles from '../TextField/TextField.module.css';
import styles from './SearchBox.module.css';

function SearchBox({ id, label, value, onChange, onPick, placeholder = undefined }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const debounced = useDebouncedValue(value, SUGGESTION_DELAY_MS);
  const { data, loading } = useUserSuggestions(debounced, open);
  const users = loading ? [] : (data ?? []);
  const browsing = debounced.trim() === '';
  const activeUser = users.find((user) => user.id === activeId) ?? null;
  const showPanel = open && (users.length > 0 || (!loading && !browsing));
  const headingId = `${id}-heading`;
  const optionId = (user) => `${id}-option-${user.id}`;

  const move = (step) => {
    if (!open) {
      setOpen(true);
      return;
    }
    if (users.length === 0) return;
    const index = users.findIndex((user) => user.id === activeId);
    let next = (index + step + users.length) % users.length;
    if (index === -1) next = step > 0 ? 0 : users.length - 1;
    setActiveId(users[next].id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter' && showPanel && activeUser) {
      event.preventDefault();
      onPick(activeUser);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <div className={styles.wrapper}>
        <input
          id={id}
          type="text"
          role="combobox"
          className={`${fieldStyles.control} ${fieldStyles.mono}`}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-expanded={showPanel}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && activeUser ? optionId(activeUser) : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveId(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {showPanel && (
          <div className={styles.panel}>
            <p id={headingId} className={styles.heading}>
              {browsing ? t('search.recommended') : t('search.matches')}
            </p>
            {users.length > 0 ? (
              <ul
                id={`${id}-listbox`}
                role="listbox"
                aria-labelledby={headingId}
                className={styles.options}
              >
                {users.map((user) => (
                  <li
                    key={user.id}
                    id={optionId(user)}
                    role="option"
                    aria-selected={user.id === activeId}
                    className={styles.option}
                  >
                    <Link
                      to={userPath(user.username)}
                      tabIndex={-1}
                      className={styles.link}
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <span className={styles.name}>{user.fullName}</span>
                      <span className={styles.username}>@{user.username}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.none}>{t('search.noSuggestions')}</p>
            )}
          </div>
        )}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {showPanel && users.length > 0 ? t('search.suggestionsCount', { count: users.length }) : ''}
      </p>
    </div>
  );
}

SearchBox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchBox;
