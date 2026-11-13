import PropTypes from 'prop-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaKind } from '../../domain/media';
import { ExpandIcon } from '../icons/icons';
import MediaViewer from '../MediaViewer/MediaViewer';
import styles from './TweetMedia.module.css';

/**
 * The one place that knows how to show a picture, a GIF or a video: the tweet card and the
 * compose preview both use it. `label` is the accessible description of the file.
 *
 * With `expandable`, a picture or GIF is a button that opens it in the viewer, where it can be
 * enlarged and downloaded (`fileName` names the download). Videos have their own controls.
 */
function TweetMedia({ media, label, expandable = false, fileName = 'telegraph' }) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState(false);

  if (media.kind === MediaKind.VIDEO) {
    return (
      // People's uploads come without captions or transcripts, so there is nothing to link here.
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        className={styles.media}
        src={media.url}
        controls
        preload="metadata"
        playsInline
        aria-label={label}
      />
    );
  }

  // Images and GIFs load only as they approach the screen, so a long feed stays light.
  const image = (
    <img className={styles.media} src={media.url} alt={label} loading="lazy" decoding="async" />
  );
  if (!expandable) return image;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setViewing(true)}
        aria-label={t('tweet.media.expand', { label })}
        aria-haspopup="dialog"
      >
        {image}
        <span className={styles.hint} aria-hidden="true">
          <ExpandIcon />
        </span>
      </button>
      {viewing && (
        <MediaViewer
          media={media}
          label={label}
          fileName={fileName}
          onClose={() => setViewing(false)}
        />
      )}
    </>
  );
}

TweetMedia.propTypes = {
  media: PropTypes.shape({
    kind: PropTypes.oneOf(Object.values(MediaKind)).isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  expandable: PropTypes.bool,
  fileName: PropTypes.string,
};

export default TweetMedia;
