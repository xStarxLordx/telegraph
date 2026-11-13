import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { MediaKind } from '../../domain/media';
import { userPath } from '../../routes/paths';
import formatDateTime from '../../utils/formatDateTime';
import TweetMedia from '../TweetMedia/TweetMedia';
import styles from './TweetCard.module.css';

/**
 * The only way a tweet is rendered (G-06): "Full Name, @username - date and time" on the
 * first line, the body below (then its picture, GIF or video), between the dashed separator rules.
 */
function TweetCard({ tweet, timeZone = undefined }) {
  const { t, i18n } = useTranslation();
  const { authorFullName, authorUsername, body, createdAt, media = undefined } = tweet;

  return (
    <article className={styles.tweet}>
      <span aria-hidden="true" className={`${styles.rivet} ${styles.left}`} />
      <span aria-hidden="true" className={`${styles.rivet} ${styles.right}`} />
      <p className={styles.meta}>
        <strong className={styles.name}>{authorFullName}</strong>,{' '}
        <Link to={userPath(authorUsername)} className={styles.username}>
          @{authorUsername}
        </Link>{' '}
        -{' '}
        <time dateTime={createdAt.toISOString()}>
          {formatDateTime(createdAt, i18n.language, timeZone)}
        </time>
      </p>
      {body && <p className={styles.body}>{body}</p>}
      {media && (
        <TweetMedia
          media={media}
          label={t(`tweet.media.${media.kind}`, { name: authorFullName })}
        />
      )}
    </article>
  );
}

TweetCard.propTypes = {
  tweet: PropTypes.shape({
    id: PropTypes.string.isRequired,
    authorFullName: PropTypes.string.isRequired,
    authorUsername: PropTypes.string.isRequired,
    /** Empty when the tweet is only media. */
    body: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date).isRequired,
    media: PropTypes.shape({
      kind: PropTypes.oneOf(Object.values(MediaKind)).isRequired,
      url: PropTypes.string.isRequired,
    }),
  }).isRequired,
  /** Fixed in tests; the browser's time zone otherwise. */
  timeZone: PropTypes.string,
};

export default TweetCard;
