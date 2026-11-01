// Composition root for the mock services: builds the shared database and injects it.
import type { MockServices, MockServicesOptions } from '../../interfaces/mock';
import { createMemoryStorage } from '../../utils/storage';
import createMockAuthService from './mockAuthService';
import createMockDatabase from './mockDatabase';
import createMockFollowService from './mockFollowService';
import createMockTweetService from './mockTweetService';
import createMockUserService from './mockUserService';

export default function createMockServices({
  storage = createMemoryStorage(),
  storageKey,
  latencyMs = 0,
  now = () => new Date(),
}: MockServicesOptions = {}): MockServices {
  const db = createMockDatabase({ storage, storageKey });
  const delay = () =>
    new Promise<void>((resolve) => {
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
