// Tweets as the services return them.
import type { MediaAttachment } from './media';

export interface Tweet {
  id: string;
  authorId: string;
  authorFullName: string;
  authorUsername: string;
  /** Empty when the tweet is only media. */
  body: string;
  /** Firebase: read with `serverTimestamps: 'estimate'` so a just-published tweet isn't null. */
  createdAt: Date;
  media?: MediaAttachment;
}

export interface PublishTweetInput {
  authorId: string;
  body: string;
  /** From `MediaService.upload`. With it the body may be empty. */
  media?: MediaAttachment;
}
