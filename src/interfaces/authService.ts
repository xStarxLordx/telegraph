import type { CurrentUser } from './user';

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface UsernameLoginInput {
  username: string;
  password: string;
}

export interface GoogleLoginResult {
  user: CurrentUser;
  needsUsername: boolean;
}

export type AuthStateListener = (user: CurrentUser | null) => void;

export interface AuthService {
  /** Firebase: awaits `auth.authStateReady()` first, or it would return null during startup. */
  getCurrentUser(): Promise<CurrentUser | null>;
  /**
   * Reports the current user asynchronously right after subscribing, then every change (login,
   * logout, username claimed). Returns unsubscribe.
   */
  onAuthStateChanged(listener: AuthStateListener): () => void;
  /** Validates, rejects taken username/email (with `field`), then logs in. */
  register(input: RegisterInput): Promise<CurrentUser>;
  /** Unknown user and wrong password both throw INVALID_CREDENTIALS. */
  loginWithUsername(input: UsernameLoginInput): Promise<CurrentUser>;
  loginWithGoogle(): Promise<GoogleLoginResult>;
  /** Sets the username of the logged-in Google account that has none yet (M2-06). */
  claimUsername(username: string): Promise<CurrentUser>;
  logout(): Promise<void>;
}
