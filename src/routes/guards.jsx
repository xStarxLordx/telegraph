// Route guards. They read the session from <AuthProvider>, which mirrors authService.
import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthStatus, useAuth } from '../auth/AuthContext';
import Spinner from '../components/Spinner/Spinner';
import { Paths } from './paths';

/**
 * Private routes: logged-out visitors go to /login (and come back afterwards, unless they
 * just logged out: the next person shouldn't land on the previous user's page); an account
 * without a username (first Google login) must choose one first.
 */
export function RequireAuth() {
  const { status, user, signedOut } = useAuth();
  const location = useLocation();

  if (status === AuthStatus.LOADING) return <Spinner />;
  if (!user) {
    return <Navigate to={Paths.LOGIN} replace state={signedOut ? null : { from: location }} />;
  }
  if (user.username === null) return <Navigate to={Paths.CHOOSE_USERNAME} replace />;
  return <Outlet />;
}

/** /login and /register: a logged-in user goes back to where they were heading (or home). */
export function PublicOnly() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === AuthStatus.LOADING) return <Spinner />;
  if (user) {
    const target = user.username === null ? Paths.CHOOSE_USERNAME : location.state?.from;
    return <Navigate to={target ?? Paths.HOME} replace />;
  }
  return <Outlet />;
}

/** The username step: only for a logged-in account that has none yet. */
export function RequireMissingUsername() {
  const { status, user } = useAuth();

  if (status === AuthStatus.LOADING) return <Spinner />;
  if (!user) return <Navigate to={Paths.LOGIN} replace />;
  if (user.username !== null) return <Navigate to={Paths.HOME} replace />;
  return <Outlet />;
}
