// Map stored records to the shapes declared in src/interfaces/.
import type { TweetRecord, UserRecord } from '../../interfaces/mock';
import type { Tweet } from '../../interfaces/tweet';
import type { CurrentUser, User } from '../../interfaces/user';

export function toPublicUser({ id, fullName, username }: UserRecord): User {
  return { id, fullName, username };
}

export function toCurrentUser(user: UserRecord): CurrentUser {
  return { ...toPublicUser(user), email: user.email };
}

export function toTweet(record: TweetRecord): Tweet {
  return { ...record, createdAt: new Date(record.createdAt) };
}
