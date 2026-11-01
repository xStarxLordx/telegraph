// Tweets as the services return them.

export interface Tweet {
  id: string;
  authorId: string;
  authorFullName: string;
  authorUsername: string;
  body: string;
  /** Firebase: read with `serverTimestamps: 'estimate'` so a just-published tweet isn't null. */
  createdAt: Date;
}

export interface PublishTweetInput {
  authorId: string;
  body: string;
}
