// Composition root for the mock services: builds the shared database and injects it.
import { createMemoryStorage } from '../../utils/storage';
import createMockAuthService from './mockAuthService';
import createMockDatabase from './mockDatabase';
import createMockFollowService from './mockFollowService';
import createMockTweetService from './mockTweetService';
import createMockUserService from './mockUserService';

/**
 * @param {{ storage?: Storage, storageKey?: string, latencyMs?: number, now?: () => Date }} [options]
 *   `latencyMs` simulates network delay so loading states are visible in the UI (0 in tests).
 * @returns {import('../contracts').Services & { resetMockData: () => void }}
 */
export default function createMockServices({
  storage = createMemoryStorage(),
  storageKey,
  latencyMs = 0,
  now = () => new Date(),
} = {}) {
  const db = createMockDatabase({ storage, storageKey });
  const delay = () =>
    new Promise((resolve) => {
      setTimeout(resolve, latencyMs);
    });
  const deps = { db, delay, now };

  return {
    authService: createMockAuthService(deps),
    userService: createMockUserService(deps),
    tweetService: createMockTweetService(deps),
    followService: createMockFollowService(deps),
    resetMockData: () => db.reset(),
  };
}
