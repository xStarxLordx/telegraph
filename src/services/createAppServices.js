// The single place that decides which service implementation the app uses.
// Milestone 2 (M2-03) swaps them one by one: sessions already run on Firebase; users, tweets and
// follows stay on the mocks until their own tasks (M2-08 to M2-12). Nothing else changes.
import { getBrowserStorage } from '../utils/storage';
import { getFirebaseAuth, getFirebaseDb } from './firebase/firebaseApp';
import createFirebaseAuthService from './firebase/firebaseAuthService';
import createMockServices from './mock/createMockServices';

/** Simulated network latency, so loading states are visible while running on mocks. */
const MOCK_LATENCY_MS = 300;

export default function createAppServices() {
  const mockServices = createMockServices({
    storage: getBrowserStorage(),
    latencyMs: MOCK_LATENCY_MS,
  });
  return {
    ...mockServices,
    authService: createFirebaseAuthService({ auth: getFirebaseAuth(), db: getFirebaseDb() }),
  };
}
