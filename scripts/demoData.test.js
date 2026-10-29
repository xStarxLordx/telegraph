// Loads the demo dataset into the fake Firestore and runs the REAL services over it, so each
// scenario it claims to demonstrate is checked through the same code the app uses.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE } from '../src/domain/constants';
import { countCharacters, toSortKey } from '../src/domain/text';
import { validateTweetBody, validateUsername } from '../src/domain/validation';
import createFirebaseFollowService from '../src/services/firebase/firebaseFollowService';
import createFirebaseTweetService from '../src/services/firebase/firebaseTweetService';
import createFirebaseUserService from '../src/services/firebase/firebaseUserService';
import { fakeFirestore } from '../src/test/fakeFirestore';
import { collectPages, createFakeAuth } from '../src/test/firebaseFixtures';
import { allowedFields } from '../src/test/firestoreRules';
import {
  buildDemoDataset,
  buildFollowsOf,
  DEMO_PASSWORD,
  DEMO_UID_PREFIX,
  demoUid,
} from './demoData';

vi.mock('firebase/firestore', async () => (await import('../src/test/fakeFirestore')).default);

const NOW = new Date('2026-10-28T20:00:00Z');
const dataset = buildDemoDataset({ now: NOW });

let users;
let tweets;
let follows;

const sizesOf = (pages) => pages.map((page) => page.items.length);
const followingOf = (username) =>
  collectPages((page) => follows.listFollowing(demoUid(username), page));
const followersOf = (username) =>
  collectPages((page) => follows.listFollowers(demoUid(username), page));
const tweetsOf = (username) => collectPages((page) => tweets.listByAuthor(demoUid(username), page));
const feedOf = (username) => collectPages((page) => tweets.listFeed(demoUid(username), page));

beforeEach(() => {
  fakeFirestore.reset();
  dataset.users.forEach(({ id, data }) => fakeFirestore.set(`users/${id}`, data));
  dataset.tweets.forEach(({ id, data }) => fakeFirestore.set(`tweets/${id}`, data));
  dataset.follows.forEach(({ id, data }) => fakeFirestore.set(`follows/${id}`, data));
  const auth = createFakeAuth(demoUid('ada'));
  users = createFirebaseUserService({ db: {} });
  tweets = createFirebaseTweetService({ auth, db: {} });
  follows = createFirebaseFollowService({ auth, db: {} });
});

describe('the dataset is well formed', () => {
  it('marks every account with the "demo-" prefix that --clean relies on', () => {
    // A literal on purpose: changing the prefix would orphan the accounts already seeded.
    expect(DEMO_UID_PREFIX).toBe('demo-');
    expect(dataset.accounts.every(({ uid }) => uid.startsWith('demo-'))).toBe(true);
  });

  it('has unique accounts that match their profiles, all marked as demo', () => {
    expect(new Set(dataset.accounts.map((a) => a.uid)).size).toBe(dataset.accounts.length);
    expect(new Set(dataset.accounts.map((a) => a.email)).size).toBe(dataset.accounts.length);
    expect(dataset.accounts).toHaveLength(dataset.users.length);
    dataset.users.forEach(({ id, data }) => {
      const account = dataset.accounts.find((candidate) => candidate.uid === data.uid);
      expect(account.email, id).toBe(data.email);
      expect(account.password).toBe(DEMO_PASSWORD);
      expect(data.uid.startsWith(DEMO_UID_PREFIX)).toBe(true);
    });
  });

  it('has profiles keyed by lowercase username, with valid usernames and names', () => {
    dataset.users.forEach(({ id, data }) => {
      expect(validateUsername(data.username), data.username).toBeNull();
      expect(id).toBe(data.username.toLowerCase());
      expect(countCharacters(data.fullName)).toBeLessThanOrEqual(50);
    });
    expect(new Set(dataset.users.map(({ id }) => id)).size).toBe(dataset.users.length);
  });

  it('has tweets with valid bodies whose author copies match the profile', () => {
    expect(new Set(dataset.tweets.map(({ id }) => id)).size).toBe(dataset.tweets.length);
    dataset.tweets.forEach(({ id, data }) => {
      const profile = dataset.users.find((user) => user.data.uid === data.authorId).data;
      expect(data.authorUsername, id).toBe(profile.username);
      expect(data.authorFullName, id).toBe(profile.fullName);
      expect(validateTweetBody(data.body), id).toBeNull();
      expect(data.body, id).toBe(data.body.trim());
      expect(data.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
    });
  });

  it('has follows whose copies match both profiles, with sort keys and no duplicates', () => {
    expect(new Set(dataset.follows.map(({ id }) => id)).size).toBe(dataset.follows.length);
    dataset.follows.forEach(({ id, data }) => {
      expect(data.followerId).not.toBe(data.followeeId);
      expect(id).toBe(`${data.followerId}_${data.followeeId}`);
      const follower = dataset.users.find((user) => user.data.uid === data.followerId).data;
      const followee = dataset.users.find((user) => user.data.uid === data.followeeId).data;
      expect([data.followerUsername, data.followerFullName]).toEqual([
        follower.username,
        follower.fullName,
      ]);
      expect([data.followeeUsername, data.followeeFullName]).toEqual([
        followee.username,
        followee.fullName,
      ]);
      expect(data.followerFullNameLower).toBe(toSortKey(follower.fullName));
      expect(data.followeeFullNameLower).toBe(toSortKey(followee.fullName));
    });
  });

  it('writes exactly the fields the security rules accept', () => {
    const fieldsOf = (docs) => [
      ...new Set(docs.map(({ data }) => Object.keys(data).sort().join())),
    ];
    expect(fieldsOf(dataset.users)).toEqual([[...allowedFields('users')].sort().join()]);
    expect(fieldsOf(dataset.tweets)).toEqual([[...allowedFields('tweets')].sort().join()]);
    expect(fieldsOf(dataset.follows)).toEqual([[...allowedFields('follows')].sort().join()]);
  });

  it('is the same every time for the same moment (so seeding twice changes nothing)', () => {
    expect(buildDemoDataset({ now: NOW })).toEqual(dataset);
  });
});

describe('what each demo account shows', () => {
  it('@ada has two pages in every list, and followers she does not follow back', async () => {
    expect(await follows.getCounts(demoUid('ada'))).toEqual({ followers: 14, following: 14 });
    expect(sizesOf(await followingOf('ada'))).toEqual([PAGE_SIZE, 4]);
    expect(sizesOf(await followersOf('ada'))).toEqual([PAGE_SIZE, 4]);
    expect(sizesOf(await tweetsOf('ada'))).toEqual([PAGE_SIZE, 5]);

    const followerIds = (await followersOf('ada')).flatMap((page) => page.items.map((u) => u.id));
    const status = await follows.getFollowingStatus(demoUid('ada'), followerIds);
    expect(Object.values(status).filter((followed) => !followed)).toHaveLength(8);
  });

  it('@diez has exactly one full page of everything', async () => {
    expect(sizesOf(await tweetsOf('diez'))).toEqual([PAGE_SIZE]);
    expect(sizesOf(await followersOf('diez'))).toEqual([PAGE_SIZE]);
    expect(sizesOf(await followingOf('diez'))).toEqual([PAGE_SIZE]);
  });

  it('@once has one item more than a page of everything', async () => {
    expect(sizesOf(await tweetsOf('once'))).toEqual([PAGE_SIZE, 1]);
    expect(sizesOf(await followersOf('once'))).toEqual([PAGE_SIZE, 1]);
    expect(sizesOf(await followingOf('once'))).toEqual([PAGE_SIZE, 1]);
  });

  it('@novato has nothing: every empty state', async () => {
    const empty = { items: [], nextCursor: null, total: 0 };
    expect(await tweets.listByAuthor(demoUid('novato'))).toEqual(empty);
    expect(await tweets.listFeed(demoUid('novato'))).toEqual(empty);
    expect(await follows.listFollowing(demoUid('novato'))).toEqual(empty);
    expect(await follows.listFollowers(demoUid('novato'))).toEqual(empty);
    expect(await follows.getCounts(demoUid('novato'))).toEqual({ followers: 0, following: 0 });
  });

  it('@telegrafista follows more than 30 people, and the feed pages across chunks in order', async () => {
    expect((await follows.getCounts(demoUid('telegrafista'))).following).toBe(32);
    fakeFirestore.state.queries = [];

    const pages = await feedOf('telegrafista');

    const items = pages.flatMap((page) => page.items);
    const followed = new Set([
      demoUid('telegrafista'),
      ...(await followingOf('telegrafista')).flatMap((page) => page.items.map((u) => u.id)),
    ]);
    const expectedCount = dataset.tweets.filter(({ data }) => followed.has(data.authorId)).length;
    expect(items).toHaveLength(expectedCount);
    expect(pages.at(-1).total).toBe(expectedCount);
    expect(new Set(items.map((tweet) => tweet.id)).size).toBe(items.length);
    items.slice(1).forEach((tweet, index) => {
      expect(tweet.createdAt.getTime()).toBeLessThanOrEqual(items[index].createdAt.getTime());
    });
    const feedQueries = fakeFirestore.state.queries.filter((query) =>
      query.wheres.some(({ operator }) => operator === 'in'),
    );
    expect(feedQueries.length).toBeGreaterThanOrEqual(2 * pages.length);
  });

  it('puts the two Mary Shelleys next to each other, ordered by username', async () => {
    const names = (await followingOf('diez')).flatMap((page) => page.items.map((u) => u.username));
    expect(names.indexOf('mshelley')).toBe(names.indexOf('mshelley2') - 1);
  });

  it('keeps the case a username was typed with, and finds it in any case', async () => {
    expect(await users.getUserByUsername('@HYPATIA')).toMatchObject({ username: 'Hypatia' });
    const [first] = (await tweetsOf('Hypatia'))[0].items;
    expect(first.authorUsername).toBe('Hypatia');
  });

  it('includes a tweet of exactly 280 characters, one with emoji and one over several lines', async () => {
    const bodies = (await tweetsOf('ada')).flatMap((page) => page.items.map((tweet) => tweet.body));
    expect(bodies.some((body) => countCharacters(body) === 280)).toBe(true);
    expect(bodies.some((body) => body.includes('🚂'))).toBe(true);
    expect(bodies.some((body) => body.includes('\n'))).toBe(true);
  });

  it('keeps names that sort with their base letter in alphabetical order', async () => {
    const names = (await followingOf('telegrafista')).flatMap((page) =>
      page.items.map((u) => toSortKey(u.fullName)),
    );
    expect(names).toEqual([...names].sort());
  });
});

describe('--follow: a real account following demo accounts', () => {
  const real = { uid: 'real-uid', username: 'Fran', fullName: 'Francisco López' };
  const realFollows = buildFollowsOf(real, dataset, { now: NOW });

  beforeEach(() => {
    fakeFirestore.set('users/fran', { ...real, email: 'fran@example.com', createdAt: NOW });
    realFollows.forEach(({ id, data }) => fakeFirestore.set(`follows/${id}`, data));
  });

  it('writes follows of demo accounts only, shaped as the security rules expect', () => {
    const profiles = new Map(dataset.users.map(({ data }) => [data.uid, data]));
    expect(new Set(realFollows.map(({ id }) => id)).size).toBe(realFollows.length);
    realFollows.forEach(({ id, data }) => {
      expect(id).toBe(`real-uid_${data.followeeId}`);
      expect(data).toMatchObject({ followerId: 'real-uid', followerUsername: 'Fran' });
      expect(data.followerFullNameLower).toBe(toSortKey(real.fullName));
      const followee = profiles.get(data.followeeId);
      expect([data.followeeUsername, data.followeeFullName]).toEqual([
        followee.username,
        followee.fullName,
      ]);
      expect(Object.keys(data).sort()).toEqual([...allowedFields('follows')].sort());
    });
  });

  it('fills several feed pages, newest first, and leaves demo accounts to follow', async () => {
    const pages = await collectPages((page) => tweets.listFeed('real-uid', page));
    expect(pages.length).toBeGreaterThan(2);
    const dates = pages.flatMap((page) => page.items.map((tweet) => Date.parse(tweet.createdAt)));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));

    const following = await collectPages((page) => follows.listFollowing('real-uid', page));
    expect(sizesOf(following)).toEqual([PAGE_SIZE, PAGE_SIZE, realFollows.length - 2 * PAGE_SIZE]);
    expect(realFollows.length).toBeLessThan(dataset.users.length);
  });
});
