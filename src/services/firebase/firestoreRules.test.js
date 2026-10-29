// The security rules can't run here (no emulator), so this keeps them from drifting away from
// the code: the fields the services write and the limits from src/domain must match the file.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FULL_NAME_MAX_LENGTH,
  MAX_TWEET_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../../domain/constants';
import { fakeFirestore } from '../../test/fakeFirestore';
import { allowedFields, blockOf, rules } from '../../test/firestoreRules';
import { addAccount, createFakeAuth } from '../../test/firebaseFixtures';
import createFirebaseFollowService from './firebaseFollowService';
import createFirebaseTweetService from './firebaseTweetService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

const numberAfter = (pattern) => Number(pattern.exec(rules)?.[1]);

describe('firestore.rules', () => {
  let auth;
  const ADA = { uid: 'uid-ada', username: 'ada', fullName: 'Ada Lovelace' };

  beforeEach(() => {
    fakeFirestore.reset();
    auth = createFakeAuth(ADA.uid);
    addAccount(ADA);
    addAccount({ uid: 'uid-emilie', username: 'emilie', fullName: 'Émilie du Châtelet' });
  });

  it('allows exactly the fields a published tweet has', async () => {
    const tweets = createFirebaseTweetService({ auth, db: {} });
    const { id } = await tweets.publish({ authorId: ADA.uid, body: 'hola' });

    expect(allowedFields('tweets').sort()).toEqual(
      Object.keys(fakeFirestore.get(`tweets/${id}`)).sort(),
    );
  });

  it('allows exactly the fields a follow has, and its id is follower_followee', async () => {
    const follows = createFirebaseFollowService({ auth, db: {} });
    await follows.follow(ADA.uid, 'uid-emilie');

    const [id] = fakeFirestore.ids('follows');
    expect(id).toBe('uid-ada_uid-emilie');
    expect(allowedFields('follows').sort()).toEqual(
      Object.keys(fakeFirestore.get(`follows/${id}`)).sort(),
    );
    expect(blockOf('follows')).toContain("followId == request.resource.data.followerId + '_' + ");
  });

  it('uses the same limits as src/domain/constants.js', () => {
    expect(numberAfter(/body\.size\(\) <= (\d+)/)).toBe(MAX_TWEET_LENGTH);
    expect(numberAfter(/fullName\.size\(\) <= (\d+)/)).toBe(FULL_NAME_MAX_LENGTH);
    expect(rules).toContain(`{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}`);
  });

  it('never lets a tweet, a follow or a profile be edited or deleted', () => {
    ['users', 'tweets', 'follows'].forEach((collectionName) => {
      expect(blockOf(collectionName)).toContain('allow update, delete: if false;');
    });
  });
});
