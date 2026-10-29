import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_TWEET_LENGTH, PAGE_SIZE } from '../../domain/constants';
import { ErrorCode } from '../../domain/errors';
import { fakeFirestore } from '../../test/fakeFirestore';
import {
  addAccount,
  collectPages,
  createFakeAuth,
  failureOf,
  setClock,
} from '../../test/firebaseFixtures';
import createFirebaseFollowService from './firebaseFollowService';
import createFirebaseTweetService from './firebaseTweetService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

const ADA = { uid: 'uid-ada', username: 'ada', fullName: 'Ada Lovelace' };

let auth;
let tweetService;
let followService;

/** Publishes as `uid` when the fake server's clock says `minute`. */
async function publishAs(uid, body, minute) {
  auth.currentUser = { uid };
  setClock(minute);
  return tweetService.publish({ authorId: uid, body });
}

async function followAs(followerId, followeeId) {
  auth.currentUser = { uid: followerId };
  await followService.follow(followerId, followeeId);
}

const bodiesOf = (page) => page.items.map((tweet) => tweet.body);

beforeEach(() => {
  fakeFirestore.reset();
  auth = createFakeAuth(ADA.uid);
  addAccount(ADA);
  tweetService = createFirebaseTweetService({ auth, db: {} });
  followService = createFirebaseFollowService({ auth, db: {} });
});

describe('publish', () => {
  it('stores the tweet with the author’s data, trimmed and stamped by the server', async () => {
    const tweet = await publishAs(ADA.uid, '  Hola, Telegraph  ', 5);

    expect(tweet).toEqual({
      id: expect.any(String),
      authorId: ADA.uid,
      authorFullName: 'Ada Lovelace',
      authorUsername: 'ada',
      body: 'Hola, Telegraph',
      createdAt: new Date(Date.UTC(2026, 9, 1, 0, 5)),
    });
    expect(fakeFirestore.get(`tweets/${tweet.id}`)).toMatchObject({
      authorId: ADA.uid,
      authorFullName: 'Ada Lovelace',
      authorUsername: 'ada',
      body: 'Hola, Telegraph',
    });
  });

  it('counts an emoji as one character, like the UI and the rules', async () => {
    await expect(publishAs(ADA.uid, '😀'.repeat(MAX_TWEET_LENGTH), 1)).resolves.toBeDefined();
    const error = await failureOf(publishAs(ADA.uid, '😀'.repeat(MAX_TWEET_LENGTH + 1), 2));
    expect(error).toMatchObject({ code: ErrorCode.TWEET_TOO_LONG, field: 'body' });
  });

  it('rejects an empty or blank tweet and stores nothing', async () => {
    const error = await failureOf(publishAs(ADA.uid, '   ', 1));
    expect(error).toMatchObject({ code: ErrorCode.TWEET_EMPTY, field: 'body' });
    expect(fakeFirestore.ids('tweets')).toEqual([]);
  });

  it('needs a signed-in user acting as themselves, with a username', async () => {
    auth.currentUser = null;
    const loggedOut = await failureOf(tweetService.publish({ authorId: ADA.uid, body: '   ' }));
    expect(loggedOut.code).toBe(ErrorCode.NOT_AUTHENTICATED); // before the body is even checked

    auth.currentUser = { uid: 'uid-someone-else' };
    const other = await failureOf(tweetService.publish({ authorId: ADA.uid, body: 'hola' }));
    expect(other.code).toBe(ErrorCode.PERMISSION_DENIED);

    auth.currentUser = { uid: 'uid-google' }; // signed in with Google, no username yet
    const noUsername = await failureOf(
      tweetService.publish({ authorId: 'uid-google', body: 'hola' }),
    );
    expect(noUsername.code).toBe(ErrorCode.USERNAME_REQUIRED);
    expect(fakeFirestore.ids('tweets')).toEqual([]);
  });
});

describe('listByAuthor', () => {
  beforeEach(async () => {
    addAccount({ uid: 'uid-babbage', username: 'babbage', fullName: 'Charles Babbage' });
    for (let minute = 1; minute <= 25; minute += 1) {
      // Sequential on purpose: each tweet is stamped with the clock at that moment.
      // eslint-disable-next-line no-await-in-loop
      await publishAs(ADA.uid, `ada ${minute}`, minute);
    }
    await publishAs('uid-babbage', 'babbage 1', 30);
  });

  it('pages the author’s tweets newest first, with no repeats or gaps', async () => {
    const pages = await collectPages((page) => tweetService.listByAuthor(ADA.uid, page));

    expect(pages.map((page) => page.items.length)).toEqual([10, 10, 5]);
    expect(pages.map((page) => page.total)).toEqual([25, 25, 25]);
    expect(pages.map((page) => page.nextCursor === null)).toEqual([false, false, true]);
    const bodies = pages.flatMap(bodiesOf);
    expect(bodies).toEqual(Array.from({ length: 25 }, (_, index) => `ada ${25 - index}`));
  });

  it('returns Date objects and the author’s own fields', async () => {
    const [first] = (await tweetService.listByAuthor(ADA.uid)).items;
    expect(first).toMatchObject({ authorId: ADA.uid, authorUsername: 'ada', body: 'ada 25' });
    expect(first.createdAt).toEqual(new Date(Date.UTC(2026, 9, 1, 0, 25)));
  });

  it('is one page when there are exactly PAGE_SIZE tweets, two when there is one more', async () => {
    for (let minute = 1; minute <= PAGE_SIZE; minute += 1) {
      // eslint-disable-next-line no-await-in-loop
      await publishAs('uid-babbage', `b ${minute}`, 40 + minute);
    }
    // Babbage now has 1 + 10 = 11 tweets.
    const eleven = await collectPages((page) => tweetService.listByAuthor('uid-babbage', page));
    expect(eleven.map((page) => page.items.length)).toEqual([10, 1]);

    fakeFirestore.state.docs.delete(`tweets/${eleven[1].items[0].id}`);
    const ten = await collectPages((page) => tweetService.listByAuthor('uid-babbage', page));
    expect(ten.map((page) => page.items.length)).toEqual([10]);
    expect(ten[0].nextCursor).toBeNull();
  });

  it('answers an author with no tweets with an empty page', async () => {
    expect(await tweetService.listByAuthor('uid-nobody')).toEqual({
      items: [],
      nextCursor: null,
      total: 0,
    });
  });

  it('keeps page 2 stable when a tweet is published after page 1 was read', async () => {
    const first = await tweetService.listByAuthor(ADA.uid);
    const secondBefore = await tweetService.listByAuthor(ADA.uid, { cursor: first.nextCursor });
    await publishAs(ADA.uid, 'late arrival', 99);

    const secondAfter = await tweetService.listByAuthor(ADA.uid, { cursor: first.nextCursor });
    expect(bodiesOf(secondAfter)).toEqual(bodiesOf(secondBefore));
    expect(secondAfter.total).toBe(secondBefore.total + 1);
  });

  it('honors a smaller page size', async () => {
    const page = await tweetService.listByAuthor(ADA.uid, { pageSize: 3 });
    expect(bodiesOf(page)).toEqual(['ada 25', 'ada 24', 'ada 23']);
    expect(page.nextCursor).not.toBeNull();
  });

  it('rejects a cursor that points nowhere and a page size outside 1..PAGE_SIZE', async () => {
    const cursors = ['not-a-tweet', '', 'tweets/auto0001', 42];
    const cursorErrors = await Promise.all(
      cursors.map((cursor) => failureOf(tweetService.listByAuthor(ADA.uid, { cursor }))),
    );
    expect(cursorErrors.map((error) => error.code)).toEqual(
      cursors.map(() => ErrorCode.INVALID_CURSOR),
    );

    const sizes = [0, PAGE_SIZE + 1, 1.5, -1, null];
    const sizeErrors = await Promise.all(
      sizes.map((pageSize) => failureOf(tweetService.listByAuthor(ADA.uid, { pageSize }))),
    );
    expect(sizeErrors.map((error) => error.code)).toEqual(
      sizes.map(() => ErrorCode.INVALID_PAGE_SIZE),
    );
  });
});

describe('listFeed', () => {
  it('shows my tweets and those of the people I follow, not anyone else’s', async () => {
    addAccount({ uid: 'uid-babbage', username: 'babbage', fullName: 'Charles Babbage' });
    addAccount({ uid: 'uid-tesla', username: 'tesla', fullName: 'Nikola Tesla' });
    await followAs(ADA.uid, 'uid-babbage');
    await publishAs(ADA.uid, 'mine', 1);
    await publishAs('uid-babbage', 'followed', 2);
    await publishAs('uid-tesla', 'stranger', 3);

    const feed = await tweetService.listFeed(ADA.uid);

    expect(bodiesOf(feed)).toEqual(['followed', 'mine']);
    expect(feed).toMatchObject({ nextCursor: null, total: 2 });
  });

  it('is empty for someone with no tweets and no follows', async () => {
    expect(await tweetService.listFeed(ADA.uid)).toEqual({ items: [], nextCursor: null, total: 0 });
  });

  describe('when I follow more than 30 people', () => {
    const FOLLOWEES = 35;
    const ids = Array.from(
      { length: FOLLOWEES },
      (_, index) => `uid-f${String(index + 1).padStart(2, '0')}`,
    );
    let published; // { id, minute } of every tweet in my feed

    const publishInFeed = async (uid, body, minute) => {
      const tweet = await publishAs(uid, body, minute);
      published.push({ id: tweet.id, minute });
      return tweet;
    };

    beforeEach(async () => {
      published = [];
      ids.forEach((uid, index) => {
        addAccount({ uid, username: `f${index + 1}x`, fullName: `Follower ${index + 1}` });
      });
      // Sequential on purpose: the fake server's clock is a single shared value.
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < FOLLOWEES; i += 1) await followAs(ADA.uid, ids[i]);
      // 9 newer tweets, then a tie between the first and the last followee (they fall in
      // different chunks) that straddles the page boundary, then 10 older ones.
      for (let i = 0; i < 9; i += 1) await publishInFeed(ADA.uid, `new ${i}`, 100 + i);
      await publishInFeed(ids[0], 'tie A', 50);
      await publishInFeed(ids[FOLLOWEES - 1], 'tie B', 50);
      for (let i = 0; i < 10; i += 1) await publishInFeed(ids[10 + i], `old ${i}`, 1 + i);
      /* eslint-enable no-await-in-loop */
    });

    const expectedIds = () =>
      [...published]
        .sort((a, b) => b.minute - a.minute || (a.id < b.id ? 1 : -1))
        .map((tweet) => tweet.id);

    it('pages across the chunks with no repeats, no gaps and a stable order', async () => {
      fakeFirestore.state.queries = [];
      const pages = await collectPages((page) => tweetService.listFeed(ADA.uid, page));

      expect(pages.map((page) => page.items.length)).toEqual([10, 10, 1]);
      expect(pages.map((page) => page.total)).toEqual([21, 21, 21]);
      expect(pages.flatMap((page) => page.items.map((tweet) => tweet.id))).toEqual(expectedIds());
      const inQueries = fakeFirestore.state.queries.filter((query) =>
        query.wheres.some((where) => where.operator === 'in'),
      );
      expect(inQueries.length).toBeGreaterThanOrEqual(2 * pages.length); // 2 chunks per page
    });

    it('keeps the next page stable when someone tweets after the first was read', async () => {
      const first = await tweetService.listFeed(ADA.uid);
      const secondBefore = await tweetService.listFeed(ADA.uid, { cursor: first.nextCursor });
      await publishAs(ids[20], 'late arrival', 200);

      const secondAfter = await tweetService.listFeed(ADA.uid, { cursor: first.nextCursor });
      expect(bodiesOf(secondAfter)).toEqual(bodiesOf(secondBefore));
    });
  });

  it('rejects a cursor that points nowhere', async () => {
    const error = await failureOf(tweetService.listFeed(ADA.uid, { cursor: 'nope' }));
    expect(error.code).toBe(ErrorCode.INVALID_CURSOR);
  });
});
