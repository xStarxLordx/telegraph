import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useServices } from '../services/ServicesContext';
import { AuthContext, AuthStatus } from './AuthContext';

const INITIAL_SESSION = { status: AuthStatus.LOADING, user: null, signedOut: false };

/** Mirrors authService's session into React state (login, logout, username claimed). */
function AuthProvider({ children }) {
  const { authService } = useServices();
  const [session, setSession] = useState(INITIAL_SESSION);

  useEffect(
    () =>
      authService.onAuthStateChanged((user) => {
        setSession((previous) => ({
          status: user ? AuthStatus.AUTHENTICATED : AuthStatus.ANONYMOUS,
          user,
          // True right after a logout, so the guards don't send the next person who logs in
          // back to the previous user's page.
          signedOut: user ? false : previous.user !== null || previous.signedOut,
        }));
      }),
    [authService],
  );

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
