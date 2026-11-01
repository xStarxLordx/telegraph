// Mock TweetService (see src/interfaces/tweetService.ts).
import { ServiceError } from '../../domain/errors';
import { compareByNewest } from '../../domain/sorting';
import { validateTweetBody } from '../../domain/validation';
import type { MockServiceDeps, TweetRecord } from '../../interfaces/mock';
import type { PageRequest } from '../../interfaces/pagination';
import type { TweetService } from '../../interfaces/tweetService';
import { toTweet } from './mappers';
import paginateArray from './paginateArray';
import requireActor from './requireActor';

export default function createMockTweetService({ db, delay, now }: MockServiceDeps): TweetService {
  const listNewestFirst = (authorIds: Set<string>, page?: PageRequest) => {
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
      const record: TweetRecord = {
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
