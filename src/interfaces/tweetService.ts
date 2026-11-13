import type { Page, PageRequest } from './pagination';
import type { PublishTweetInput, Tweet } from './tweet';

export interface TweetService {
  /**
   * Trims the body; validates it (TWEET_EMPTY / TWEET_TOO_LONG, field "body"). A tweet with media
   * may have an empty body.
   */
  publish(input: PublishTweetInput): Promise<Tweet>;
  /** Newest first. */
  listByAuthor(authorId: string, page?: PageRequest): Promise<Page<Tweet>>;
  listFeed(userId: string, page?: PageRequest): Promise<Page<Tweet>>;
}
