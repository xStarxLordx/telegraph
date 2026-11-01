// The service contracts the UI depends on. Every implementation (mock and Firebase) honors them:
// - all methods are async;
// - business failures throw ServiceError (src/domain/errors.ts); anything unexpected is mapped
//   to ErrorCode.UNKNOWN, so provider errors (e.g. FirebaseError) never reach the UI;
// - write methods take the acting user's id, which must be the logged-in user
//   (NOT_AUTHENTICATED / PERMISSION_DENIED) with a username (USERNAME_REQUIRED);
// - lists are cursor-paginated with Firestore `startAfter` semantics (see pagination.ts).
import type { AuthService } from './authService';
import type { FollowService } from './followService';
import type { TweetService } from './tweetService';
import type { UserService } from './userService';

export interface Services {
  authService: AuthService;
  userService: UserService;
  tweetService: TweetService;
  followService: FollowService;
}
