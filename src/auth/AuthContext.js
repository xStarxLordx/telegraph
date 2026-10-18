import { createContext, useContext } from 'react';

export const AuthStatus = Object.freeze({
  /** Waiting for the first report from authService.onAuthStateChanged. */
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
});

/**
 * @type {import('react').Context<{ status: string, signedOut: boolean,
 *   user: import('../services/contracts').CurrentUser|null }|null>}
 */
export const AuthContext = createContext(null);

/**
 * Returns the session from <AuthProvider>: `status`, the logged-in `user`, and `signedOut`
 * (true after a logout in this tab, until someone logs in again).
 */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}

/**
 * Returns the logged-in user. Only for components rendered behind <RequireAuth>, where a user
 * with a username is guaranteed.
 */
export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useCurrentUser must be used behind <RequireAuth>.');
  }
  return user;
}
