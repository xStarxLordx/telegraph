import PropTypes from 'prop-types';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ACCEPTED_MEDIA_TYPES, mediaKindOf } from '../../domain/media';
import useObjectUrl from '../../hooks/useObjectUrl';
import Button from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import { ImageIcon } from '../icons/icons';
import TweetMedia from '../TweetMedia/TweetMedia';
import styles from './MediaPicker.module.css';

const ACCEPT = ACCEPTED_MEDIA_TYPES.join(',');

/**
 * Chooses the picture, GIF or video of a tweet and previews it. It only reports the pick
 * (`onChange(file)`, or `onChange(null)` to remove it): checking and uploading are the caller's.
 * `progress` (0..1) shows the upload while it runs.
 */
function MediaPicker({
  id,
  label,
  file = null,
  onChange,
  error = '',
  hint = null,
  disabled = false,
  progress = null,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const previewUrl = useObjectUrl(file);
  const kind = file ? mediaKindOf(file.type) : null;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');

  const handleChange = (event) => {
    const [picked] = event.target.files;
    // Emptied so choosing the same file again (after removing it) still raises a change event.
    inputRef.current.value = '';
    if (picked) onChange(picked);
  };

  return (
    <div className={styles.picker}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        hidden
        accept={ACCEPT}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label}
        aria-describedby={describedBy || undefined}
      />
      <div className={styles.actions}>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={() => inputRef.current.click()}
          disabled={disabled}
        >
          <ImageIcon />
          {file ? t('compose.media.change') : label}
        </Button>
        {file && (
          <Button variant={ButtonVariant.GHOST} onClick={() => onChange(null)} disabled={disabled}>
            {t('compose.media.remove')}
          </Button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {file && kind && previewUrl && (
        <figure className={styles.preview}>
          <TweetMedia
            media={{ kind, url: previewUrl }}
            label={t('compose.media.preview', { name: file.name })}
          />
        </figure>
      )}
      {progress !== null && (
        <progress
          className={styles.progress}
          max={1}
          value={progress}
          aria-label={t('compose.media.uploadProgress', { percent: Math.round(progress * 100) })}
        />
      )}
    </div>
  );
}

MediaPicker.propTypes = {
  id: PropTypes.string.isRequired,
  /** The text of the "add" button, and the accessible name of the file input. */
  label: PropTypes.string.isRequired,
  file: PropTypes.instanceOf(File),
  onChange: PropTypes.func.isRequired,
  /** Translated error message. */
  error: PropTypes.string,
  hint: PropTypes.node,
  disabled: PropTypes.bool,
  /** Upload progress from 0 to 1; null when nothing is uploading. */
  progress: PropTypes.number,
};

export default MediaPicker;
