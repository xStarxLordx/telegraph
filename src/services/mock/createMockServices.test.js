import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE } from '../../domain/constants';
import { ErrorCode } from '../../domain/errors';
import { createMemoryStorage } from '../../utils/storage';
import createMockServices from './createMockServices';
import { MOCK_STORAGE_KEY } from './mockDatabase';
import { createSeedState, DEMO_PASSWORD } from './seed';

const FIXED_NOW = new Date('2026-10-13T08:00:00Z');

const rejectsWith = (promise, code, field) =>
  expect(promise).rejects.toMatchObject(field ? { code, field } : { code });

const flushMicrotasks = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** Walks every page of a cursor-paginated list. */
async function collectAllPages(listPage) {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    // eslint-disable-next-line no-await-in-loop -- pages must be fetched in sequence
    const page = await listPage({ cursor });
    expect(page.items.length).toBeLessThanOrEqual(PAGE_SIZE);
    items.push(...page.items);
    cursor = page.nextCursor;
    pages += 1;
  } while (cursor !== null);
  return { items, pages };
}

const names = (page) => page.items.map((user) => user.fullName);

describe('mock services', () => {
  let storage;
  let services;
  let ada;

  const loginAs = (username) =>
    services.authService.loginWithUsername({ username, password: DEMO_PASSWORD });

  beforeEach(async () => {
    storage = createMemoryStorage();
    services = createMockServices({ storage, now: () => FIXED_NOW });
    ada = await loginAs('ada');
  });

  describe('authService', () => {
    it('logs in by username case-insensitively and returns the current user', async () => {
      const user = await loginAs('@ADA');
      expect(user).toEqual({
        id: ada.id,
        fullName: 'Ada Lovelace',
        username: 'ada',
        email: 'ada@telegraph.test',
      });
      expect(await services.authService.getCurrentUser()).toEqual(user);
    });

    it('uses the same error for an unknown user and a wrong password', async () => {
      await rejectsWith(loginAs('nobody'), ErrorCode.INVALID_CREDENTIALS);
      await rejectsWith(
        services.authService.loginWithUsername({ username: 'ada', password: 'wrong-pass' }),
        ErrorCode.INVALID_CREDENTIALS,
      );
    });

    it('registers a new user and logs them in', async () => {
      const user = await services.authService.register({
        fullName: '  Grace Murray ',
        username: 'GMurray',
        email: 'Grace@Example.com',
        password: 'navy-1906',
      });
      expect(user).toMatchObject({
        fullName: 'Grace Murray',
        username: 'gmurray',
        email: 'grace@example.com',
      });
      expect((await services.authService.getCurrentUser()).id).toBe(user.id);
      await services.authService.logout();
      await expect(
        services.authService.loginWithUsername({ username: 'gmurray', password: 'navy-1906' }),
      ).resolves.toMatchObject({ id: user.id });
    });

    it('rejects a taken username or email, case-insensitively, with the field', async () => {
      const input = {
        fullName: 'Someone',
        username: 'someone',
        email: 'someone@x.io',
        password: '12345678',
      };
      await rejectsWith(
        services.authService.register({ ...input, username: 'ADA' }),
        ErrorCode.USERNAME_TAKEN,
        'username',
      );
      await rejectsWith(
        services.authService.register({ ...input, email: 'ADA@telegraph.test' }),
        ErrorCode.EMAIL_TAKEN,
        'email',
      );
    });

    it('validates registration fields before touching the data', async () => {
      await rejectsWith(
        services.authService.register({
          fullName: 'X',
          username: 'ok_name',
          email: 'bad',
          password: '12345678',
        }),
        ErrorCode.EMAIL_INVALID,
        'email',
      );
      expect(await services.userService.getUserByUsername('ok_name')).toBeNull();
    });

    it('asks a first-time Google user for a username, once', async () => {
      const first = await services.authService.loginWithGoogle();
      expect(first.needsUsername).toBe(true);
      await rejectsWith(services.authService.claimUsername('ada'), ErrorCode.USERNAME_TAKEN);
      const claimed = await services.authService.claimUsername('googler');
      expect(claimed.username).toBe('googler');
      await rejectsWith(
        services.authService.claimUsername('other'),
        ErrorCode.USERNAME_ALREADY_SET,
      );
      const again = await services.authService.loginWithGoogle();
      expect(again).toMatchObject({ needsUsername: false, user: { username: 'googler' } });
    });

    it('never lets a password-less Google account log in with a username', async () => {
      await services.authService.loginWithGoogle();
      await services.authService.claimUsername('googler');
      await services.authService.logout();
      await rejectsWith(
        services.authService.loginWithUsername({ username: 'googler' }),
        ErrorCode.INVALID_CREDENTIALS,
      );
      await rejectsWith(
        services.authService.loginWithUsername({ username: 'googler', password: '' }),
        ErrorCode.INVALID_CREDENTIALS,
      );
    });

    it('requires a session to claim a username', async () => {
      await services.authService.logout();
      await rejectsWith(services.authService.claimUsername('anyone'), ErrorCode.NOT_AUTHENTICATED);
    });
  });

  describe('auth state listeners', () => {
    it('report the current user asynchronously, then login and logout', async () => {
      const listener = vi.fn();
      services.authService.onAuthStateChanged(listener);
      expect(listener).not.toHaveBeenCalled();
      await flushMicrotasks();
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ id: ada.id }));
      await services.authService.logout();
      await flushMicrotasks();
      expect(listener).toHaveBeenLastCalledWith(null);
      await loginAs('tesla');
      await flushMicrotasks();
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ username: 'tesla' }));
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('stop after unsubscribing, independently for the same function subscribed twice', async () => {
      const listener = vi.fn();
      const unsubscribeFirst = services.authService.onAuthStateChanged(listener);
      services.authService.onAuthStateChanged(listener);
      unsubscribeFirst();
      await flushMicrotasks();
      expect(listener).toHaveBeenCalledTimes(1);
      await services.authService.logout();
      await flushMicrotasks();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('report the logout caused by resetting the demo data', async () => {
      const listener = vi.fn();
      services.authService.onAuthStateChanged(listener);
      await flushMicrotasks();
      services.resetMockData();
      await flushMicrotasks();
      expect(listener).toHaveBeenLastCalledWith(null);
    });

    it('cannot break the write that triggered them by throwing', async () => {
      const failing = vi.fn(() => {
        throw new Error('listener bug');
      });
      const errors = [];
      const onError = (error) => errors.push(error);
      process.on('uncaughtException', onError);
      services.authService.onAuthStateChanged(failing);
      await flushMicrotasks();
      await expect(
        services.authService.register({
          fullName: 'New Person',
          username: 'newperson',
          email: 'new@person.io',
          password: '12345678',
        }),
      ).resolves.toMatchObject({ username: 'newperson' });
      await flushMicrotasks();
      process.off('uncaughtException', onError);
      expect(failing).toHaveBeenCalledTimes(2);
    });
  });

  describe('persistence', () => {
    it('restores data and session from storage in a new instance', async () => {
      await services.tweetService.publish({ authorId: ada.id, body: 'Persisted dispatch' });
      const zuse = await services.followService.followByUsername(ada.id, 'zuse');
      const reloaded = createMockServices({ storage });
      expect((await reloaded.authService.getCurrentUser()).id).toBe(ada.id);
      const page = await reloaded.tweetService.listByAuthor(ada.id);
      expect(page.items[0].body).toBe('Persisted dispatch');
      expect(await reloaded.followService.isFollowing(ada.id, zuse.id)).toBe(true);
    });

    it('keeps registered users and unique ids across reloads', async () => {
      const first = await services.authService.register({
        fullName: 'First New',
        username: 'firstnew',
        email: 'first@new.io',
        password: '12345678',
      });
      const reloaded = createMockServices({ storage });
      await expect(
        reloaded.authService.loginWithUsername({ username: 'firstnew', password: '12345678' }),
      ).resolves.toMatchObject({ id: first.id });
      const second = await reloaded.authService.register({
        fullName: 'Second New',
        username: 'secondnew',
        email: 'second@new.io',
        password: '12345678',
      });
      expect(second.id).not.toBe(first.id);
    });

    it.each([
      ['corrupt JSON', '{not json'],
      ['null', 'null'],
      ['an empty object', '{}'],
      ['an array', '[]'],
      ['an old schema', JSON.stringify({ ...createSeedState(), schemaVersion: 0 })],
    ])('falls back to the seed when storage holds %s', async (_, saved) => {
      storage.setItem(MOCK_STORAGE_KEY, saved);
      const recovered = createMockServices({ storage });
      expect(await recovered.userService.getUserByUsername('tesla')).not.toBeNull();
      expect(await recovered.authService.getCurrentUser()).toBeNull();
    });

    it('resets to the seed data', async () => {
      await services.tweetService.publish({ authorId: ada.id, body: 'Temporary' });
      services.resetMockData();
      const page = await services.tweetService.listByAuthor(ada.id);
      expect(page.items.map((t) => t.body)).not.toContain('Temporary');
      expect(await services.authService.getCurrentUser()).toBeNull();
    });
  });

  describe('write permissions', () => {
    it('only lets the logged-in user act as themselves', async () => {
      const tesla = await services.userService.getUserByUsername('tesla');
      await rejectsWith(
        services.tweetService.publish({ authorId: tesla.id, body: 'Not me' }),
        ErrorCode.PERMISSION_DENIED,
      );
      await rejectsWith(
        services.followService.follow(tesla.id, ada.id),
        ErrorCode.PERMISSION_DENIED,
      );
      await services.authService.logout();
      await rejectsWith(
        services.tweetService.publish({ authorId: ada.id, body: 'Logged out' }),
        ErrorCode.NOT_AUTHENTICATED,
      );
      await rejectsWith(
        services.followService.followByUsername(ada.id, 'tesla'),
        ErrorCode.NOT_AUTHENTICATED,
      );
    });

    it('requires a username to publish or follow, and hides users without one', async () => {
      const { user: googleUser } = await services.authService.loginWithGoogle();
      await rejectsWith(
        services.tweetService.publish({ authorId: googleUser.id, body: 'Hi' }),
        ErrorCode.USERNAME_REQUIRED,
      );
      await rejectsWith(
        services.followService.followByUsername(googleUser.id, 'ada'),
        ErrorCode.USERNAME_REQUIRED,
      );
      await loginAs('ada');
      await rejectsWith(
        services.followService.follow(ada.id, googleUser.id),
        ErrorCode.USER_NOT_FOUND,
      );
    });
  });

  describe('userService', () => {
    it('finds users by id and username and hides private fields', async () => {
      const byUsername = await services.userService.getUserByUsername('Tesla');
      expect(byUsername).toEqual({
        id: expect.any(String),
        fullName: 'Nikola Tesla',
        username: 'tesla',
      });
      expect(await services.userService.getUserById(byUsername.id)).toEqual(byUsername);
      expect(await services.userService.getUserById('missing')).toBeNull();
    });

    it('reports username availability case-insensitively', async () => {
      expect(await services.userService.isUsernameAvailable('ADA')).toBe(false);
      expect(await services.userService.isUsernameAvailable('free_name')).toBe(true);
    });

    it('returns copies, so callers cannot change stored data', async () => {
      const user = await services.userService.getUserByUsername('tesla');
      user.fullName = 'Changed';
      expect((await services.userService.getUserByUsername('tesla')).fullName).toBe('Nikola Tesla');
    });
  });

  describe('tweetService', () => {
    it('publishes a trimmed tweet that tops the author list and the feed', async () => {
      const tweet = await services.tweetService.publish({ authorId: ada.id, body: '  Hola  ' });
      expect(tweet).toMatchObject({
        body: 'Hola',
        authorFullName: 'Ada Lovelace',
        authorUsername: 'ada',
        createdAt: FIXED_NOW,
      });
      expect(tweet.createdAt).toBeInstanceOf(Date);
      expect((await services.tweetService.listByAuthor(ada.id)).items[0].id).toBe(tweet.id);
      expect((await services.tweetService.listFeed(ada.id)).items[0].id).toBe(tweet.id);
    });

    it('enforces the 280 character limit counting emoji as one', async () => {
      await expect(
        services.tweetService.publish({ authorId: ada.id, body: '🚂'.repeat(280) }),
      ).resolves.toBeDefined();
      await rejectsWith(
        services.tweetService.publish({ authorId: ada.id, body: 'x'.repeat(281) }),
        ErrorCode.TWEET_TOO_LONG,
        'body',
      );
      await rejectsWith(
        services.tweetService.publish({ authorId: ada.id, body: '   ' }),
        ErrorCode.TWEET_EMPTY,
        'body',
      );
    });

    it('lists an author newest first across pages', async () => {
      const { items, pages } = await collectAllPages((page) =>
        services.tweetService.listByAuthor(ada.id, page),
      );
      expect(pages).toBe(2);
      expect(items).toHaveLength(12);
      expect(items.every((t) => t.authorId === ada.id)).toBe(true);
      const times = items.map((t) => t.createdAt.getTime());
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('builds the feed from exactly the user and the people they follow, newest first', async () => {
      // Expected result computed straight from the seed, without the services.
      const seed = createSeedState();
      const authors = new Set([
        ada.id,
        ...seed.follows.filter((f) => f.followerId === ada.id).map((f) => f.followeeId),
      ]);
      const expectedIds = seed.tweets
        .filter((t) => authors.has(t.authorId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((t) => t.id);

      const { items, pages } = await collectAllPages((page) =>
        services.tweetService.listFeed(ada.id, page),
      );
      expect(pages).toBeGreaterThanOrEqual(2);
      expect(items.map((t) => t.id)).toEqual(expectedIds);
    });

    it('does not repeat items on the next page after a new tweet is published', async () => {
      const first = await services.tweetService.listFeed(ada.id);
      await services.tweetService.publish({ authorId: ada.id, body: 'Breaking news' });
      const second = await services.tweetService.listFeed(ada.id, { cursor: first.nextCursor });
      const firstIds = new Set(first.items.map((t) => t.id));
      expect(second.items.some((t) => firstIds.has(t.id))).toBe(false);
      expect(second.total).toBe(first.total + 1);
    });
  });

  describe('followService', () => {
    it('follows by username and reports duplicates, self-follows and unknown users', async () => {
      const zuse = await services.followService.followByUsername(ada.id, '@Zuse');
      expect(zuse.username).toBe('zuse');
      expect(await services.followService.isFollowing(ada.id, zuse.id)).toBe(true);
      await rejectsWith(
        services.followService.followByUsername(ada.id, 'zuse'),
        ErrorCode.ALREADY_FOLLOWING,
      );
      await rejectsWith(
        services.followService.followByUsername(ada.id, 'ada'),
        ErrorCode.FOLLOW_SELF,
      );
      await rejectsWith(
        services.followService.followByUsername(ada.id, 'ghost'),
        ErrorCode.USER_NOT_FOUND,
        'username',
      );
      await rejectsWith(services.followService.follow(ada.id, 'missing'), ErrorCode.USER_NOT_FOUND);
    });

    it('updates the counts of both sides after a follow', async () => {
      const zuse = await services.userService.getUserByUsername('zuse');
      const before = {
        ada: await services.followService.getCounts(ada.id),
        zuse: await services.followService.getCounts(zuse.id),
      };
      expect(before.ada).toEqual({ followers: 13, following: 14 });
      await services.followService.follow(ada.id, zuse.id);
      expect(await services.followService.getCounts(ada.id)).toEqual({
        followers: 13,
        following: 15,
      });
      expect(await services.followService.getCounts(zuse.id)).toEqual({
        ...before.zuse,
        followers: before.zuse.followers + 1,
      });
    });

    it('lists following alphabetically, accent-insensitive, 10 per page', async () => {
      const first = await services.followService.listFollowing(ada.id);
      expect(names(first)).toEqual([
        'Ángela Ruiz Robles',
        'Charles Babbage',
        'Émilie du Châtelet',
        'H. G. Wells',
        'Hedy Lamarr',
        'Isaac Peral',
        'Isambard Kingdom Brunel',
        'Jules Verne',
        'Leonardo Torres Quevedo',
        'Marie Curie',
      ]);
      expect(first.total).toBe(14);
      const second = await services.followService.listFollowing(ada.id, {
        cursor: first.nextCursor,
      });
      expect(names(second)).toEqual([
        'Mary Shelley',
        'Nikola Tesla',
        'Santiago Ramón y Cajal',
        'Thomas Edison',
      ]);
      expect(second.nextCursor).toBeNull();
    });

    it('lists followers alphabetically, including special letters like Ø', async () => {
      const { items, pages } = await collectAllPages((page) =>
        services.followService.listFollowers(ada.id, page),
      );
      expect(pages).toBe(2);
      expect(items.map((u) => u.fullName)).toEqual([
        'Ángela Ruiz Robles',
        'Émilie du Châtelet',
        'Grace Hopper',
        'Hans Christian Ørsted',
        'Isaac Peral',
        'James Clerk Maxwell',
        'James Watt',
        'Leonardo Torres Quevedo',
        'Mary Somerville',
        'Michael Faraday',
        'Santiago Ramón y Cajal',
        'Sofia Kovalévskaya',
        'Thomas Edison',
      ]);
    });

    it('checks the following status of many users in one call', async () => {
      const { items: followers } = await collectAllPages((page) =>
        services.followService.listFollowers(ada.id, page),
      );
      const status = await services.followService.getFollowingStatus(
        ada.id,
        followers.map((u) => u.id),
      );
      const notFollowedBack = followers.filter((u) => !status[u.id]).map((u) => u.fullName);
      expect(notFollowedBack).toEqual([
        'Grace Hopper',
        'Hans Christian Ørsted',
        'James Clerk Maxwell',
        'James Watt',
        'Mary Somerville',
        'Michael Faraday',
        'Sofia Kovalévskaya',
      ]);
    });
  });
});
