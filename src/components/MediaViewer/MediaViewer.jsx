import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaKind } from '../../domain/media';
import useMediaDownload from '../../hooks/useMediaDownload';
import Button from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import { CloseIcon, DownloadIcon } from '../icons/icons';
import Notice from '../Notice/Notice';
import styles from './MediaViewer.module.css';

/**
 * A picture or GIF at screen size, in the browser's own modal `<dialog>`: it traps the focus,
 * closes with Esc and hands the focus back to what opened it. It also closes with the button or a
 * click outside, and offers to download the file. Mount it to open it; `onClose` says it closed.
 */
function MediaViewer({ media, label, fileName, onClose }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const { download, pending, blocked } = useMediaDownload(media, fileName);

  useEffect(() => {
    const dialog = dialogRef.current;
    // React may run this effect twice in development; a modal that is already open is left alone.
    if (!dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current.close();

  // The area around the panel is the dialog itself: a click that lands there is outside the panel.
  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    // The backdrop click is a mouse shortcut: the keyboard has Esc and the close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="media-viewer-caption"
      onClose={onClose}
      onClick={closeOnBackdrop}
    >
      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <p id="media-viewer-caption" className={styles.caption}>
            {label}
          </p>
          <div className={styles.actions}>
            <Button variant={ButtonVariant.PRIMARY} onClick={download} pending={pending}>
              <DownloadIcon />
              {t('tweet.media.download')}
            </Button>
            <Button
              variant={ButtonVariant.GHOST}
              onClick={close}
              ariaLabel={t('tweet.media.close')}
            >
              <CloseIcon />
            </Button>
          </div>
        </div>
        <div className={styles.stage}>
          <img className={styles.image} src={media.url} alt={label} decoding="async" />
        </div>
        {blocked && (
          <div className={styles.notice}>
            <Notice variant="error">
              {t('tweet.media.downloadBlocked')}{' '}
              <a href={media.url} target="_blank" rel="noopener noreferrer">
                {t('tweet.media.openInNewTab')}
              </a>
            </Notice>
          </div>
        )}
      </div>
    </dialog>
  );
}

MediaViewer.propTypes = {
  media: PropTypes.shape({
    kind: PropTypes.oneOf(Object.values(MediaKind)).isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  /** The accessible description of the file; also the viewer's caption. */
  label: PropTypes.string.isRequired,
  /** The name a download gets, without extension. */
  fileName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MediaViewer;
