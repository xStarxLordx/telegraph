import { describe, expect, it, vi } from 'vitest';
import createAppServices from './createAppServices';
import createMockServices from './mock/createMockServices';

// No Firebase project is contacted: the SDK handles are stubbed and nothing is called on them.
vi.mock('./firebase/firebaseApp', () => ({
  getFirebaseAuth: () => ({}),
  getFirebaseDb: () => ({}),
}));

describe('createAppServices', () => {
  it('provides the four services, each with the methods of the contract', () => {
    const services = createAppServices();
    const reference = createMockServices();

    expect(Object.keys(services).sort()).toEqual([
      'authService',
      'followService',
      'tweetService',
      'userService',
    ]);
    Object.keys(services).forEach((name) => {
      expect(Object.keys(services[name]).sort(), name).toEqual(Object.keys(reference[name]).sort());
      Object.values(services[name]).forEach((method) => expect(method).toBeInstanceOf(Function));
    });
  });
});
