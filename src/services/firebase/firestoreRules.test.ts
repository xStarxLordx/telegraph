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
import type { FakeAuth } from '../../interfaces/testing';
import { addAccount, createFakeAuth, fakeDeps } from '../../test/firebaseFixtures';
import createFirebaseFollowService from './firebaseFollowService';
import createFirebaseTweetService from './firebaseTweetService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

const numberAfter = (pattern: RegExp) => Number(pattern.exec(rules)?.[1]);

describe('firestore.rules', () => {
  let auth: FakeAuth;
  const ADA = { uid: 'uid-ada', username: 'ada', fullName: 'Ada Lovelace' };

  beforeEach(() => {
    fakeFirestore.reset();
    auth = createFakeAuth(ADA.uid);
    addAccount(ADA);
    addAccount({ uid: 'uid-emilie', username: 'emilie', fullName: 'Émilie du Châtelet' });
  });

  it('allows exactly the fields a published tweet has', async () => {
    const tweets = createFirebaseTweetService(fakeDeps(auth));
    const media = {
      kind: 'image' as const,
      url: 'https://firebasestorage.googleapis.com/v0/b/b/o/tweet-media%2Fuid-ada%2Fab-12.png?alt=media&token=ab-12',
      path: 'tweet-media/uid-ada/ab-12.png',
    };
    const { id } = await tweets.publish({ authorId: ADA.uid, body: 'hola', media });

    expect(allowedFields('tweets').sort()).toEqual(
      Object.keys(fakeFirestore.get(`tweets/${id}`) ?? {}).sort(),
    );
  });

  it('requires every tweet field but `media`, which only a tweet with media has', async () => {
    const tweets = createFirebaseTweetService(fakeDeps(auth));
    const { id } = await tweets.publish({ authorId: ADA.uid, body: 'hola' });

    const required = allowedFields('tweets').filter((field) => field !== 'media');
    expect(Object.keys(fakeFirestore.get(`tweets/${id}`) ?? {}).sort()).toEqual(required.sort());
    expect(blockOf('tweets')).toContain(
      "request.resource.data.keys().hasAll(\n          ['authorId', 'authorFullName', 'authorUsername', 'body', 'createdAt'])",
    );
  });

  it('lets the body be empty only when the tweet has media, and keeps the 280 limit', () => {
    const tweetRule = blockOf('tweets');
    expect(tweetRule).toContain(
      "('media' in request.resource.data && request.resource.data.body == '')",
    );
    expect(tweetRule).toContain("body.matches('(?s)^.{1,280}$')");
  });

  it('only accepts media that is the author’s own file, through isOwnMedia', () => {
    expect(blockOf('tweets')).toContain(
      'isOwnMedia(request.resource.data.media, request.auth.uid)',
    );
  });

  it('allows exactly the fields a follow has, and its id is follower_followee', async () => {
    const follows = createFirebaseFollowService(fakeDeps(auth));
    await follows.follow(ADA.uid, 'uid-emilie');

    const [id] = fakeFirestore.ids('follows');
    expect(id).toBe('uid-ada_uid-emilie');
    expect(allowedFields('follows').sort()).toEqual(
      Object.keys(fakeFirestore.get(`follows/${id}`) ?? {}).sort(),
    );
    expect(blockOf('follows')).toContain("followId == request.resource.data.followerId + '_' + ");
  });

  it('uses the same limits as src/domain/constants.ts', () => {
    expect(numberAfter(/body\.matches\('\(\?s\)\^\.\{1,(\d+)\}\$'\)/)).toBe(MAX_TWEET_LENGTH);
    expect(numberAfter(/fullName\.size\(\) <= (\d+)/)).toBe(FULL_NAME_MAX_LENGTH);
    expect(rules).toContain(`{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}`);
  });

  it('counts a tweet in code points, like the app: size() would count an emoji twice', () => {
    expect(blockOf('tweets')).not.toContain('body.size()');
  });

  it('never lets a tweet, a follow or a profile be edited or deleted', () => {
    ['users', 'tweets', 'follows'].forEach((collectionName) => {
      expect(blockOf(collectionName)).toContain('allow update, delete: if false;');
    });
  });
});
