import PropTypes from 'prop-types';
import { MediaKind } from '../../domain/media';
import styles from './TweetMedia.module.css';

/**
 * The one place that knows how to show a picture, a GIF or a video: the tweet card and the
 * compose preview both use it. `label` is the accessible description of the file.
 */
function TweetMedia({ media, label }) {
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
  return (
    <img className={styles.media} src={media.url} alt={label} loading="lazy" decoding="async" />
  );
}

TweetMedia.propTypes = {
  media: PropTypes.shape({
    kind: PropTypes.oneOf(Object.values(MediaKind)).isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
};

export default TweetMedia;
