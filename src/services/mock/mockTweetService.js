// Mock TweetService (see contracts.js).
import { ServiceError } from '../../domain/errors';
import { compareByNewest } from '../../domain/sorting';
import { validateTweetBody } from '../../domain/validation';
import { toTweet } from './mappers';
import paginateArray from './paginateArray';
import requireActor from './requireActor';

/**
 * @param {{ db: ReturnType<import('./mockDatabase').default>,
 *   delay: () => Promise<void>, now: () => Date }} deps
 * @returns {import('../contracts').TweetService}
 */
export default function createMockTweetService({ db, delay, now }) {
  const listNewestFirst = (authorIds, page) => {
    const tweets = db.state.tweets
      .filter((tweet) => authorIds.has(tweet.authorId))
      .sort(compareByNewest);
    const result = paginateArray(tweets, page);
    return { ...result, items: result.items.map(toTweet) };
  };

  return {
    async publish({ authorId, body }) {
      await delay();
      const author = requireActor(db, authorId);
      const error = validateTweetBody(body);
      if (error) throw new ServiceError(error, { field: 'body' });
      const record = {
        id: db.nextId('tweet', 't'),
        authorId,
        authorFullName: author.fullName,
        authorUsername: author.username,
        body: body.trim(),
        createdAt: now().toISOString(),
      };
      db.insertTweet(record);
      return toTweet(record);
    },

    async listByAuthor(authorId, page) {
      await delay();
      return listNewestFirst(new Set([authorId]), page);
    },

    async listFeed(userId, page) {
      await delay();
      const followeeIds = db.state.follows
        .filter((follow) => follow.followerId === userId)
        .map((follow) => follow.followeeId);
      return listNewestFirst(new Set([userId, ...followeeIds]), page);
    },
  };
}
