// The single place that decides which service implementation the app uses: Firebase for all
// four services. The mocks (src/services/mock) stay for the tests; nothing else changes.
import { getFirebaseAuth, getFirebaseDb } from './firebase/firebaseApp';
import createFirebaseAuthService from './firebase/firebaseAuthService';
import createFirebaseFollowService from './firebase/firebaseFollowService';
import createFirebaseTweetService from './firebase/firebaseTweetService';
import createFirebaseUserService from './firebase/firebaseUserService';

export default function createAppServices() {
  const deps = { auth: getFirebaseAuth(), db: getFirebaseDb() };
  return {
    authService: createFirebaseAuthService(deps),
    userService: createFirebaseUserService(deps),
    tweetService: createFirebaseTweetService(deps),
    followService: createFirebaseFollowService(deps),
  };
}
