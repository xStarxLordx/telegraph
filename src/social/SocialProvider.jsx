import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ErrorCode, ServiceError } from '../domain/errors';
import { useServices } from '../services/ServicesContext';
import { SocialContext } from './SocialContext';

/** Follow actions for the logged-in user, plus the version that tells readers to reload. */
function SocialProvider({ children }) {
  const { followService } = useServices();
  const { user } = useAuth();
  const [followVersion, setFollowVersion] = useState(0);
  const userId = user?.id ?? null;

  const follow = useCallback(
    async (followeeId) => {
      if (!userId) throw new ServiceError(ErrorCode.NOT_AUTHENTICATED);
      await followService.follow(userId, followeeId);
      setFollowVersion((version) => version + 1);
    },
    [followService, userId],
  );

  const value = useMemo(() => ({ followVersion, follow }), [followVersion, follow]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

SocialProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SocialProvider;
