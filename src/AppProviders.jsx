import PropTypes from 'prop-types';
import AuthProvider from './auth/AuthProvider';
import ToastProvider from './components/Toast/ToastProvider';
import SocialProvider from './social/SocialProvider';

/** App-level state shared by every route: session, follow actions and toasts. */
function AppProviders({ children }) {
  return (
    <AuthProvider>
      <SocialProvider>
        <ToastProvider>{children}</ToastProvider>
      </SocialProvider>
    </AuthProvider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProviders;
