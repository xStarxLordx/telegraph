// People as the services return them.

/** Public profile, safe to show to anyone. */
export interface User {
  id: string;
  fullName: string;
  /**
   * Null only for the logged-in Google account that hasn't picked one yet. Such accounts are
   * never listed, followed or shown as tweet authors.
   */
  username: string | null;
}

/** The logged-in user's own profile. */
export interface CurrentUser extends User {
  email: string;
}
