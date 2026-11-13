import { ServiceError } from '../../domain/errors';
import { compareByNewest } from '../../domain/sorting';
import { validateTweetBody } from '../../domain/validation';
import type { MockServiceDeps, TweetRecord } from '../../interfaces/mock';
import type { PageRequest } from '../../interfaces/pagination';
import type { TweetService } from '../../interfaces/tweetService';
import { toTweet } from './mappers';
import paginateArray from '../paginateArray';
import requireActor from './requireActor';

export default function createMockTweetService({ db, delay, now }: MockServiceDeps): TweetService {
  const toTweetPage = (tweets: TweetRecord[], page?: PageRequest) => {
    const result = paginateArray(tweets, page);
    return { ...result, items: result.items.map(toTweet) };
  };

  return {
    async publish({ authorId, body, media }) {
      await delay();
      const author = requireActor(db, authorId);
      const error = validateTweetBody(body, Boolean(media));
      if (error) throw new ServiceError(error, { field: 'body' });
      const record: TweetRecord = {
        id: db.nextId('tweet', 't'),
        authorId,
        authorFullName: author.fullName,
        authorUsername: author.username,
        body: body.trim(),
        createdAt: now().toISOString(),
        ...(media ? { media } : {}),
      };
      db.insertTweet(record);
      return toTweet(record);
    },

    async listByAuthor(authorId, page) {
      await delay();
      const tweets = db.state.tweets
        .filter((tweet) => tweet.authorId === authorId)
        .sort(compareByNewest);
      return toTweetPage(tweets, page);
    },

    async listFeed(userId, page) {
      await delay();
      const priority = new Set([
        userId,
        ...db.state.follows
          .filter((follow) => follow.followerId === userId)
          .map((follow) => follow.followeeId),
      ]);
      const newest = [...db.state.tweets].sort(compareByNewest);
      return toTweetPage(
        [
          ...newest.filter((tweet) => priority.has(tweet.authorId)),
          ...newest.filter((tweet) => !priority.has(tweet.authorId)),
        ],
        page,
      );
    },
  };
}
