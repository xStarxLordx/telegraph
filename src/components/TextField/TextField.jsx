import PropTypes from 'prop-types';
import styles from './TextField.module.css';

const sharedPropTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  /** Translated error message; marks the control invalid and is announced with it. */
  error: PropTypes.string,
  /** Extra hint below the control (e.g. a character counter), linked with aria-describedby. */
  hint: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  mono: PropTypes.bool,
};

function describedBy(id, error, hint) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

function FieldFrame({ id, label, error = '', hint = null, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {hint && (
        <div id={`${id}-hint`} className={styles.hint}>
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

FieldFrame.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  hint: PropTypes.node,
  children: PropTypes.node.isRequired,
};

/** Labelled single-line input with an optional error message (WCAG: label + described error). */
function TextField({
  id,
  label,
  value,
  onChange,
  error = '',
  hint = null,
  required = false,
  disabled = false,
  mono = false,
  type = 'text',
  autoComplete = undefined,
  placeholder = undefined,
}) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        className={[styles.control, mono && styles.mono].filter(Boolean).join(' ')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      />
    </FieldFrame>
  );
}

TextField.propTypes = {
  ...sharedPropTypes,
  type: PropTypes.oneOf(['text', 'email', 'password']),
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
};

/** Labelled multi-line field; same error handling as TextField. */
export function TextArea({
  id,
  label,
  value,
  onChange,
  error = '',
  hint = null,
  required = false,
  disabled = false,
  mono = false,
  rows = 5,
  placeholder = undefined,
}) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        className={[styles.control, styles.textarea, mono && styles.mono].filter(Boolean).join(' ')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      />
    </FieldFrame>
  );
}

TextArea.propTypes = {
  ...sharedPropTypes,
  rows: PropTypes.number,
  placeholder: PropTypes.string,
};

export default TextField;
