// The single place that decides which service implementation the app uses.
// Milestone 2 (M2-03) switches this to the Firebase implementations; nothing else changes.
import { getBrowserStorage } from '../utils/storage';
import createMockServices from './mock/createMockServices';

/** Simulated network latency, so loading states are visible while running on mocks. */
const MOCK_LATENCY_MS = 300;

export default function createAppServices() {
  return createMockServices({ storage: getBrowserStorage(), latencyMs: MOCK_LATENCY_MS });
}
