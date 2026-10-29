import PropTypes from 'prop-types';
import { ServicesContext } from './ServicesContext';

/** Injects the service implementations (mock or Firebase) into the component tree. */
function ServicesProvider({ services, children }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

ServicesProvider.propTypes = {
  // Each service is an object of async methods (see contracts.js).
  services: PropTypes.shape({
    authService: PropTypes.objectOf(PropTypes.func).isRequired,
    userService: PropTypes.objectOf(PropTypes.func).isRequired,
    tweetService: PropTypes.objectOf(PropTypes.func).isRequired,
    followService: PropTypes.objectOf(PropTypes.func).isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

export default ServicesProvider;
