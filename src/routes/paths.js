// Every route path in one place, so links and redirects can't drift apart.
export const Paths = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHOOSE_USERNAME: '/choose-username',
  COMPOSE: '/compose',
  FEED: '/feed',
  FOLLOWING: '/following',
  FOLLOWERS: '/followers',
  USER: '/users/:username',
});

/** Path of a user's tweets page. */
export function userPath(username) {
  return `/users/${encodeURIComponent(username)}`;
}
