// Service contracts the UI depends on (JSDoc only, no runtime code).
// Every implementation (mock in M1, Firebase in M2) must honor these shapes exactly:
// - all methods are async;
// - business failures throw ServiceError (src/domain/errors.js); anything unexpected is mapped
//   to ErrorCode.UNKNOWN, so provider errors (e.g. FirebaseError) never reach the UI;
// - write methods take the acting user's id, which must be the logged-in user
//   (NOT_AUTHENTICATED / PERMISSION_DENIED) with a username (USERNAME_REQUIRED);
// - lists are cursor-paginated with Firestore `startAfter` semantics.

/**
 * @typedef {object} User Public profile, safe to show to anyone.
 * @property {string} id
 * @property {string} fullName
 * @property {string|null} username Null only for the logged-in Google account that hasn't
 *   picked one yet. Such accounts are never listed, followed or shown as tweet authors.
 */

/**
 * @typedef {User & { email: string }} CurrentUser The logged-in user's own profile.
 */

/**
 * @typedef {object} Tweet
 * @property {string} id
 * @property {string} authorId
 * @property {string} authorFullName
 * @property {string} authorUsername
 * @property {string} body
 * @property {Date} createdAt Always a Date. Firebase: read with `serverTimestamps: 'estimate'`
 *   so a just-published tweet isn't null.
 */

/**
 * @typedef {object} PageRequest
 * @property {string|null} [cursor] Opaque `nextCursor` from the previous page; null/omitted =
 *   first page. Pages continue after that item, so new items never shift later pages.
 * @property {number} [pageSize] Integer from 1 to PAGE_SIZE (10, the default). Anything else
 *   throws INVALID_PAGE_SIZE; an unknown cursor throws INVALID_CURSOR.
 */

/**
 * @template T
 * @typedef {object} Page
 * @property {T[]} items
 * @property {string|null} nextCursor Null when this is the last page.
 * @property {number} total Total items across all pages (for "Page X of Y").
 */

/**
 * @typedef {object} AuthService
 * @property {() => Promise<CurrentUser|null>} getCurrentUser Firebase: await
 *   `auth.authStateReady()` first, or it returns null during startup.
 * @property {(listener: (user: CurrentUser|null) => void) => () => void} onAuthStateChanged
 *   Reports the current user asynchronously right after subscribing, then every change
 *   (login, logout, username claimed). Returns unsubscribe.
 * @property {(input: { fullName: string, username: string, email: string, password: string })
 *   => Promise<CurrentUser>} register Validates, rejects taken username/email (with `field`),
 *   then logs in.
 * @property {(input: { username: string, password: string }) => Promise<CurrentUser>}
 *   loginWithUsername Unknown user and wrong password both throw INVALID_CREDENTIALS.
 * @property {() => Promise<{ user: CurrentUser, needsUsername: boolean }>} loginWithGoogle
 * @property {(username: string) => Promise<CurrentUser>} claimUsername
 *   Sets the username of the logged-in Google account that has none yet (M2-06).
 * @property {() => Promise<void>} logout
 */

/**
 * @typedef {object} UserService
 * @property {(id: string) => Promise<User|null>} getUserById
 * @property {(username: string) => Promise<User|null>} getUserByUsername Case-insensitive,
 *   leading "@" optional.
 * @property {(username: string) => Promise<boolean>} isUsernameAvailable
 */

/**
 * @typedef {object} TweetService
 * @property {(input: { authorId: string, body: string }) => Promise<Tweet>} publish
 *   Trims the body; validates it (TWEET_EMPTY / TWEET_TOO_LONG, field "body").
 * @property {(authorId: string, page?: PageRequest) => Promise<Page<Tweet>>} listByAuthor
 *   Newest first.
 * @property {(userId: string, page?: PageRequest) => Promise<Page<Tweet>>} listFeed
 *   The user's tweets plus those of everyone they follow, newest first.
 */

/**
 * @typedef {object} FollowService
 * @property {(followerId: string, followeeId: string) => Promise<void>} follow
 *   Throws USER_NOT_FOUND, FOLLOW_SELF or ALREADY_FOLLOWING.
 * @property {(followerId: string, username: string) => Promise<User>} followByUsername
 *   Resolves the username first (USER_NOT_FOUND with field "username"), then like `follow`.
 * @property {(followerId: string, followeeId: string) => Promise<boolean>} isFollowing
 * @property {(followerId: string, userIds: string[]) => Promise<Record<string, boolean>>}
 *   getFollowingStatus Batch check for a page of users (Follow buttons).
 * @property {(userId: string) => Promise<{ followers: number, following: number }>} getCounts
 * @property {(userId: string, page?: PageRequest) => Promise<Page<User>>} listFollowing
 *   Alphabetical by full name (toSortKey, code-point order). Firebase: order by the sort key
 *   denormalized on each follow document (M2-02); Firestore can't order by a joined field.
 * @property {(userId: string, page?: PageRequest) => Promise<Page<User>>} listFollowers
 *   Same ordering rules as listFollowing.
 */

/**
 * @typedef {object} Services
 * @property {AuthService} authService
 * @property {UserService} userService
 * @property {TweetService} tweetService
 * @property {FollowService} followService
 */

export {};
