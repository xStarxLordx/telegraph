import { useCallback, useState } from 'react';
import { MAX_TWEET_LENGTH } from '../domain/constants';
import { countCharacters } from '../domain/text';
import { useCurrentUser } from '../auth/AuthContext';
import { useServices } from '../services/ServicesContext';

/** Remaining characters at which the counter starts warning. */
export const NEAR_LIMIT_REMAINING = 20;

export const CounterState = Object.freeze({ OK: 'ok', NEAR: 'near', OVER: 'over' });

/**
 * Character counter state for a draft, counted exactly like validateTweetBody (G-10): the
 * trimmed text, in code points (an emoji counts 1). Leading/trailing spaces don't count.
 */
export function getTweetCounter(text) {
  const count = countCharacters(text.trim());
  let state = CounterState.OK;
  if (count > MAX_TWEET_LENGTH) state = CounterState.OVER;
  else if (MAX_TWEET_LENGTH - count <= NEAR_LIMIT_REMAINING) state = CounterState.NEAR;
  const canPublish = count > 0 && count <= MAX_TWEET_LENGTH;
  return { count, max: MAX_TWEET_LENGTH, state, canPublish };
}

/** Draft text, its counter and `publish()`, which posts as the logged-in user. */
export default function useTweetDraft() {
  const { tweetService } = useServices();
  const user = useCurrentUser();
  const [text, setText] = useState('');

  const publish = useCallback(
    () => tweetService.publish({ authorId: user.id, body: text }),
    [tweetService, user.id, text],
  );

  return { text, setText, counter: getTweetCounter(text), publish };
}
