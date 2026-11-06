// Business limits shared by the UI, the services and (in Milestone 2) the Firestore rules.

/** Max items per page in every list and feed (G-09). */
export const PAGE_SIZE = 10;

/** Max tweet length in Unicode code points (G-10). */
export const MAX_TWEET_LENGTH = 280;

/** People shown in the search box dropdown. */
export const SUGGESTION_COUNT = 5;
/** Newest accounts the "people you may want to follow" list is picked from. */
export const SUGGESTION_POOL = 30;
/** Pause after the last keystroke before the dropdown looks anything up. */
export const SUGGESTION_DELAY_MS = 200;
/** Profiles the Firebase search loads (it filters them in the browser): more are not found. */
export const DIRECTORY_LIMIT = 1000;
/** How long the loaded profiles are reused before the next search reads them again. */
export const DIRECTORY_TTL_MS = 60_000;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const FULL_NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
