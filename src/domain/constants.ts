// Business limits shared by the UI, the services and (in Milestone 2) the Firestore rules.

/** Max items per page in every list and feed (G-09). */
export const PAGE_SIZE = 10;

/** Max tweet length in Unicode code points (G-10). */
export const MAX_TWEET_LENGTH = 280;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const FULL_NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
