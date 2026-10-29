import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAccount } from '../../test/firebaseFixtures';
import { fakeFirestore } from '../../test/fakeFirestore';
import createFirebaseUserService from './firebaseUserService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

let service;

beforeEach(() => {
  fakeFirestore.reset();
  addAccount({ uid: 'uid-ada', username: 'Ada', fullName: 'Ada Lovelace' });
  service = createFirebaseUserService({ db: {} });
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
