// Firestore collection names (data model: see the README).

const Collection = Object.freeze({
  /**
   * `users/{usernameLower}`: one document per account, keyed by its lowercase username so a
   * username can belong to only one account. Holds `uid`, `fullName`, `username` (as typed),
   * `email` and `createdAt`. Also resolves a username to its email at login.
   */
  USERS: 'users',
  /**
   * `tweets/{autoId}`: `authorId` (uid), `authorFullName` and `authorUsername` (copied from the
   * author's profile, so a feed needs no joins), `body` and `createdAt` (server time).
   */
  TWEETS: 'tweets',
  /**
   * `follows/{followerId_followeeId}`: one document per follow, so following twice can't create
   * a second one. Holds both sides' uid, username and full name, the two `...FullNameLower` sort
   * keys (see `toSortKey`) and `createdAt`.
   */
  FOLLOWS: 'follows',
});

export default Collection;

/** The id of the `follows` document for "`followerId` follows `followeeId`". */
export function followDocumentId(followerId, followeeId) {
  return `${followerId}_${followeeId}`;
}

/** Firestore accepts at most this many values in an `in` filter. */
export const MAX_IN_VALUES = 30;
