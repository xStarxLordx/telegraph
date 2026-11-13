import { useCallback, useState } from 'react';
import { MAX_TWEET_LENGTH } from '../domain/constants';
import { validateMedia } from '../domain/media';
import { countCharacters } from '../domain/text';
import { useCurrentUser } from '../auth/AuthContext';
import type { ErrorCodeValue } from '../interfaces/errors';
import type { CounterStateValue, TweetCounter, TweetDraft } from '../interfaces/hooks';
import { useServices } from '../services/ServicesContext';

/** Remaining characters at which the counter starts warning. */
export const NEAR_LIMIT_REMAINING = 20;

export const CounterState = Object.freeze({ OK: 'ok', NEAR: 'near', OVER: 'over' });

/**
 * Character counter state for a draft, counted exactly like validateTweetBody (G-10): the
 * trimmed text, in code points (an emoji counts 1). Leading/trailing spaces don't count. With
 * media attached the text may be empty.
 */
export function getTweetCounter(text: string, hasMedia = false): TweetCounter {
  const count = countCharacters(text.trim());
  let state: CounterStateValue = CounterState.OK;
  if (count > MAX_TWEET_LENGTH) state = CounterState.OVER;
  else if (MAX_TWEET_LENGTH - count <= NEAR_LIMIT_REMAINING) state = CounterState.NEAR;
  const canPublish = (count > 0 || hasMedia) && count <= MAX_TWEET_LENGTH;
  return { count, max: MAX_TWEET_LENGTH, state, canPublish };
}

/** Draft text and media, their counter and `publish()`, which posts as the logged-in user. */
export default function useTweetDraft(): TweetDraft {
  const { tweetService, mediaService } = useServices();
  const user = useCurrentUser();
  const [text, setText] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaError, setMediaError] = useState<ErrorCodeValue | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const selectMedia = useCallback((file: File | null) => {
    // A rejected file is not kept: the error explains why and the draft has no media.
    const error = file ? validateMedia(file) : null;
    setMediaError(error);
    setMedia(error ? null : file);
  }, []);

  const publish = useCallback(async () => {
    try {
      const attachment = media
        ? await mediaService.upload({
            ownerId: user.id,
            file: media,
            onProgress: setUploadProgress,
          })
        : undefined;
      return await tweetService.publish({ authorId: user.id, body: text, media: attachment });
    } finally {
      setUploadProgress(null);
    }
  }, [tweetService, mediaService, user.id, text, media]);

  return {
    text,
    setText,
    counter: getTweetCounter(text, media !== null),
    media,
    selectMedia,
    mediaError,
    uploadProgress,
    publish,
  };
}
