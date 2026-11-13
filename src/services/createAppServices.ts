// The single place that decides which service implementation the app uses: Firebase for all
// five services. The mocks (src/services/mock) stay for the tests; nothing else changes.
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase/firebaseApp';
import createFirebaseAuthService from './firebase/firebaseAuthService';
import createFirebaseFollowService from './firebase/firebaseFollowService';
import createFirebaseMediaService from './firebase/firebaseMediaService';
import createFirebaseTweetService from './firebase/firebaseTweetService';
import createFirebaseUserService from './firebase/firebaseUserService';
import type { Services } from '../interfaces/services';

export default function createAppServices(): Services {
  const deps = { auth: getFirebaseAuth(), db: getFirebaseDb() };
  return {
    authService: createFirebaseAuthService(deps),
    userService: createFirebaseUserService(deps),
    tweetService: createFirebaseTweetService(deps),
    followService: createFirebaseFollowService(deps),
    mediaService: createFirebaseMediaService({ auth: deps.auth, storage: getFirebaseStorage() }),
  };
}
