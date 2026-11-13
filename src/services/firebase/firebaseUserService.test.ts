import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserService } from '../../interfaces/userService';
import { addAccount, collectPages, fakeDeps } from '../../test/firebaseFixtures';
import { fakeFirestore } from '../../test/fakeFirestore';
import createFirebaseUserService from './firebaseUserService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

let service: UserService;

beforeEach(() => {
  fakeFirestore.reset();
  addAccount({ uid: 'uid-ada', username: 'Ada', fullName: 'Ada Lovelace' });
  service = createFirebaseUserService(fakeDeps());
});

describe('getUserById', () => {
  it('returns the public profile only, never the email', async () => {
    expect(await service.getUserById('uid-ada')).toEqual({
      id: 'uid-ada',
      fullName: 'Ada Lovelace',
      username: 'Ada',
    });
  });

  it('returns null for an id without a profile', async () => {
    expect(await service.getUserById('nobody')).toBeNull();
  });
});

describe('getUserByUsername', () => {
  it('ignores case and the leading "@", and keeps the username as it was typed', async () => {
    const expected = { id: 'uid-ada', fullName: 'Ada Lovelace', username: 'Ada' };
    expect(await service.getUserByUsername('@ADA')).toEqual(expected);
    expect(await service.getUserByUsername(' ada ')).toEqual(expected);
  });

  it('returns null for an unknown or malformed username instead of failing', async () => {
    expect(await service.getUserByUsername('ghost')).toBeNull();
    expect(await service.getUserByUsername('users/ada')).toBeNull();
    expect(await service.getUserByUsername('')).toBeNull();
  });
});

describe('isUsernameAvailable', () => {
  it('is false for a taken username, whatever its case', async () => {
    expect(await service.isUsernameAvailable('ada')).toBe(false);
    expect(await service.isUsernameAvailable('@ADA')).toBe(false);
  });

  it('is true for a free valid username and false for one nobody could claim', async () => {
    expect(await service.isUsernameAvailable('grace')).toBe(true);
    expect(await service.isUsernameAvailable('no')).toBe(false);
    expect(await service.isUsernameAvailable('has space')).toBe(false);
  });
});

describe('search', () => {
  beforeEach(() => {
    addAccount({ uid: 'uid-babbage', username: 'Babbage', fullName: 'Charles Babbage' });
    addAccount({ uid: 'uid-bly', username: 'nbly', fullName: 'Nellie Bly' });
    addAccount({ uid: 'uid-ab', username: 'abc_1', fullName: 'Abc One' });
    addAccount({ uid: 'uid-abd', username: 'abd', fullName: 'Abd Two' });
    addAccount({ uid: 'uid-dora', username: 'ddiaz', fullName: 'Dora Díaz' });
  });

  const usernames = async (term: string) =>
    (await service.search(term)).items.map((user) => user.username);

  it('finds usernames that start with the term, ignoring case and "@"', async () => {
    expect(await usernames('@A')).toEqual(['abc_1', 'abd', 'Ada']);
  });

  it('finds people by their name, not only by their username', async () => {
    expect(await usernames('Dora')).toEqual(['ddiaz']);
    expect(await usernames('diaz')).toEqual(['ddiaz']);
    expect(await usernames('dora di')).toEqual(['ddiaz']);
    expect(await usernames('charles')).toEqual(['Babbage']);
    expect(await usernames('lovelace')).toEqual(['Ada']);
  });

  it('lists the matches alphabetically by full name', async () => {
    expect(await usernames('b')).toEqual(['Babbage', 'nbly']);
  });

  it('returns the public profile only', async () => {
    const result = await service.search('babb');

    expect(result.items).toEqual([
      { id: 'uid-babbage', fullName: 'Charles Babbage', username: 'Babbage' },
    ]);
  });

  it('pages the results with no repeats and no gaps', async () => {
    const pages = await collectPages((page) => service.search('a', { ...page, pageSize: 2 }));

    expect(pages.map((page) => page.items.map((user) => user.username))).toEqual([
      ['abc_1', 'abd'],
      ['Ada'],
    ]);
    expect(pages.map((page) => page.total)).toEqual([3, 3]);
  });

  it('reads the users once for repeated searches', async () => {
    fakeFirestore.state.queries = [];

    await service.search('a');
    await service.search('dora');
    await service.search('nel');

    expect(fakeFirestore.state.queries).toHaveLength(1);
  });

  it('returns an empty page for an empty or unknown term', async () => {
    const empty = { items: [], nextCursor: null, total: 0 };

    expect(await service.search('')).toEqual(empty);
    expect(await service.search('zzz')).toEqual(empty);
    expect(await service.search('users/ada')).toEqual(empty);
  });
});

describe('suggest', () => {
  it('returns the newest accounts first, as public profiles', async () => {
    addAccount({ uid: 'uid-babbage', username: 'Babbage', fullName: 'Charles Babbage' });
    addAccount({ uid: 'uid-tesla', username: 'tesla', fullName: 'Nikola Tesla' });
    const stamp = (key: string, createdAt: Date) =>
      fakeFirestore.set(`users/${key}`, { ...fakeFirestore.get(`users/${key}`), createdAt });
    stamp('ada', new Date('2026-03-01T00:00:00Z'));
    stamp('babbage', new Date('2026-05-01T00:00:00Z'));
    stamp('tesla', new Date('2026-04-01T00:00:00Z'));

    expect(await service.suggest()).toEqual([
      { id: 'uid-babbage', fullName: 'Charles Babbage', username: 'Babbage' },
      { id: 'uid-tesla', fullName: 'Nikola Tesla', username: 'tesla' },
      { id: 'uid-ada', fullName: 'Ada Lovelace', username: 'Ada' },
    ]);
  });
});
