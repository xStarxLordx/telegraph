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
  USER_FOLLOWING: '/users/:username/following',
  USER_FOLLOWERS: '/users/:username/followers',
  SEARCH: '/search',
});

/** Path of a user's tweets page. */
export function userPath(username: string) {
  return `/users/${encodeURIComponent(username)}`;
}

export function userFollowingPath(username: string) {
  return `${userPath(username)}/following`;
}

export function userFollowersPath(username: string) {
  return `${userPath(username)}/followers`;
}

export function searchPath(term: string) {
  return term ? `${Paths.SEARCH}?q=${encodeURIComponent(term)}` : Paths.SEARCH;
}
