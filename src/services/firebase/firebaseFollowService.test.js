import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE } from '../../domain/constants';
import { ErrorCode } from '../../domain/errors';
import { compareByFullName } from '../../domain/sorting';
import { fakeFirestore } from '../../test/fakeFirestore';
import { addAccount, collectPages, createFakeAuth, failureOf } from '../../test/firebaseFixtures';
import createFirebaseFollowService from './firebaseFollowService';

vi.mock('firebase/firestore', async () => (await import('../../test/fakeFirestore')).default);

const ADA = { uid: 'uid-ada', username: 'ada', fullName: 'Ada Lovelace' };
const EMILIE = { uid: 'uid-emilie', username: 'emilie', fullName: 'Émilie du Châtelet' };
const FOLLOW_ID = 'uid-ada_uid-emilie';

let auth;
let service;

const publicUser = ({ uid, username, fullName }) => ({ id: uid, username, fullName });

async function followAs(followerId, followeeId) {
  auth.currentUser = { uid: followerId };
  await service.follow(followerId, followeeId);
  auth.currentUser = { uid: ADA.uid };
}

beforeEach(() => {
  fakeFirestore.reset();
  auth = createFakeAuth(ADA.uid);
  addAccount(ADA);
  addAccount(EMILIE);
  service = createFirebaseFollowService({ auth, db: {} });
});

describe('follow', () => {
  it('stores one document per follow with both people’s names and their sort keys', async () => {
    await service.follow(ADA.uid, EMILIE.uid);

    expect(fakeFirestore.ids('follows')).toEqual([FOLLOW_ID]);
    expect(fakeFirestore.get(`follows/${FOLLOW_ID}`)).toMatchObject({
      followerId: 'uid-ada',
      followerUsername: 'ada',
      followerFullName: 'Ada Lovelace',
      followerFullNameLower: 'ada lovelace',
      followeeId: 'uid-emilie',
      followeeUsername: 'emilie',
      followeeFullName: 'Émilie du Châtelet',
      followeeFullNameLower: 'emilie du chatelet', // accents removed: it sorts with "e"
    });
    expect(fakeFirestore.get(`follows/${FOLLOW_ID}`).createdAt).toBeDefined();
  });

  it('tells me I already follow them, and creates nothing the second time', async () => {
    await service.follow(ADA.uid, EMILIE.uid);
    const stored = fakeFirestore.get(`follows/${FOLLOW_ID}`);

    const error = await failureOf(service.follow(ADA.uid, EMILIE.uid));

    expect(error.code).toBe(ErrorCode.ALREADY_FOLLOWING);
    expect(fakeFirestore.ids('follows')).toEqual([FOLLOW_ID]);
    expect(fakeFirestore.get(`follows/${FOLLOW_ID}`)).toBe(stored);
  });

  it('also catches a follow created between the check and the write', async () => {
    fakeFirestore.state.beforeTransaction = () =>
      fakeFirestore.set(`follows/${FOLLOW_ID}`, {
        followerId: 'uid-ada',
        followeeId: 'uid-emilie',
      });

    const error = await failureOf(service.follow(ADA.uid, EMILIE.uid));

    expect(error.code).toBe(ErrorCode.ALREADY_FOLLOWING);
    expect(fakeFirestore.get(`follows/${FOLLOW_ID}`)).toEqual({
      followerId: 'uid-ada',
      followeeId: 'uid-emilie',
    });
  });

  it('refuses to follow yourself or someone who does not exist', async () => {
    expect((await failureOf(service.follow(ADA.uid, ADA.uid))).code).toBe(ErrorCode.FOLLOW_SELF);
    expect((await failureOf(service.follow(ADA.uid, 'uid-ghost'))).code).toBe(
      ErrorCode.USER_NOT_FOUND,
    );
    expect(fakeFirestore.ids('follows')).toEqual([]);
  });

  it('needs a signed-in user acting as themselves, with a username', async () => {
    auth.currentUser = null;
    expect((await failureOf(service.follow(ADA.uid, EMILIE.uid))).code).toBe(
      ErrorCode.NOT_AUTHENTICATED,
    );

    auth.currentUser = { uid: EMILIE.uid };
    expect((await failureOf(service.follow(ADA.uid, EMILIE.uid))).code).toBe(
      ErrorCode.PERMISSION_DENIED,
    );

    auth.currentUser = { uid: 'uid-google' }; // signed in with Google, no username yet
    expect((await failureOf(service.follow('uid-google', EMILIE.uid))).code).toBe(
      ErrorCode.USERNAME_REQUIRED,
    );
    expect(fakeFirestore.ids('follows')).toEqual([]);
  });
});

describe('followByUsername', () => {
  it('follows by username in any case, with or without "@", and returns that user', async () => {
    const followed = await service.followByUsername(ADA.uid, '@EMILIE');

    expect(followed).toEqual(publicUser(EMILIE));
    expect(fakeFirestore.ids('follows')).toEqual([FOLLOW_ID]);
  });

  it('reports each outcome with its own error, in order: unknown, myself, already following', async () => {
    const unknown = await failureOf(service.followByUsername(ADA.uid, 'ghost'));
    expect(unknown).toMatchObject({ code: ErrorCode.USER_NOT_FOUND, field: 'username' });
    const malformed = await failureOf(service.followByUsername(ADA.uid, 'a/b'));
    expect(malformed).toMatchObject({ code: ErrorCode.USER_NOT_FOUND, field: 'username' });

    expect((await failureOf(service.followByUsername(ADA.uid, '@Ada'))).code).toBe(
      ErrorCode.FOLLOW_SELF,
    );

    await service.followByUsername(ADA.uid, 'emilie');
    expect((await failureOf(service.followByUsername(ADA.uid, 'emilie'))).code).toBe(
      ErrorCode.ALREADY_FOLLOWING,
    );
    expect(fakeFirestore.ids('follows')).toEqual([FOLLOW_ID]);
  });

  it('needs a signed-in user acting as themselves', async () => {
    auth.currentUser = null;
    expect((await failureOf(service.followByUsername(ADA.uid, 'emilie'))).code).toBe(
      ErrorCode.NOT_AUTHENTICATED,
    );
  });
});

describe('isFollowing and getFollowingStatus', () => {
  beforeEach(async () => {
    await service.follow(ADA.uid, EMILIE.uid);
  });

  it('only counts the direction that exists', async () => {
    expect(await service.isFollowing(ADA.uid, EMILIE.uid)).toBe(true);
    expect(await service.isFollowing(EMILIE.uid, ADA.uid)).toBe(false);
  });

  it('checks a whole page of users at once, ignoring repeats', async () => {
    const status = await service.getFollowingStatus(ADA.uid, [EMILIE.uid, 'uid-x', EMILIE.uid]);
    expect(status).toEqual({ 'uid-emilie': true, 'uid-x': false });
  });

  it('answers nothing for nobody, without querying', async () => {
    fakeFirestore.state.queries = [];
    expect(await service.getFollowingStatus(ADA.uid, [])).toEqual({});
    expect(fakeFirestore.state.queries).toEqual([]);
  });

  it('splits more than 30 users into several queries', async () => {
    const strangers = Array.from({ length: 70 }, (_, index) => `uid-s${index}`);
    fakeFirestore.state.queries = [];

    const status = await service.getFollowingStatus(ADA.uid, [EMILIE.uid, ...strangers]);

    expect(Object.keys(status)).toHaveLength(71);
    expect(Object.values(status).filter(Boolean)).toHaveLength(1);
    expect(fakeFirestore.state.queries).toHaveLength(3); // 71 ids -> 30 + 30 + 11
  });
});

describe('getCounts', () => {
  it('counts each direction separately and follows the data', async () => {
    addAccount({ uid: 'uid-tesla', username: 'tesla', fullName: 'Nikola Tesla' });
    expect(await service.getCounts(ADA.uid)).toEqual({ followers: 0, following: 0 });

    await followAs(ADA.uid, EMILIE.uid);
    await followAs(ADA.uid, 'uid-tesla');
    await followAs(EMILIE.uid, ADA.uid);

    expect(await service.getCounts(ADA.uid)).toEqual({ followers: 1, following: 2 });
    expect(await service.getCounts(EMILIE.uid)).toEqual({ followers: 1, following: 1 });
    expect(await service.getCounts('uid-tesla')).toEqual({ followers: 1, following: 0 });
  });
});

describe('listFollowing and listFollowers', () => {
  // Tricky on purpose: accents, a letter with no accent form (Ø), different case, and two people
  // with the same name (the username breaks the tie, like in the mocks).
  const PEOPLE = [
    { uid: 'uid-p01', username: 'angela', fullName: 'Ángela Ruiz Robles' },
    { uid: 'uid-p02', username: 'zoe', fullName: 'zoe quinn' },
    { uid: 'uid-p03', username: 'orsted', fullName: 'Hans Christian Ørsted' },
    { uid: 'uid-p04', username: 'maryB', fullName: 'Mary Shelley' },
    { uid: 'uid-p05', username: 'maryA', fullName: 'Mary Shelley' },
    { uid: 'uid-p06', username: 'charles', fullName: 'Charles Babbage' },
    { uid: 'uid-p07', username: 'grace', fullName: 'Grace Hopper' },
    { uid: 'uid-p08', username: 'hedy', fullName: 'Hedy Lamarr' },
    { uid: 'uid-p09', username: 'isaac', fullName: 'Isaac Peral' },
    { uid: 'uid-p10', username: 'james', fullName: 'James Watt' },
    { uid: 'uid-p11', username: 'konrad', fullName: 'Konrad Zuse' },
    { uid: 'uid-p12', username: 'lise', fullName: 'Lise Meitner' },
  ];
  const alphabetical = [...PEOPLE].sort(compareByFullName).map(publicUser);

  beforeEach(async () => {
    PEOPLE.forEach(addAccount);
    await PEOPLE.reduce(
      (previous, person) =>
        previous.then(async () => {
          await followAs(ADA.uid, person.uid); // Ada follows everyone...
          await followAs(person.uid, ADA.uid); // ...and everyone follows Ada
        }),
      Promise.resolve(),
    );
    await followAs(EMILIE.uid, ADA.uid); // a 13th follower who isn't followed back
  });

  it('lists who I follow alphabetically, accent- and case-insensitive, across pages', async () => {
    const pages = await collectPages((page) => service.listFollowing(ADA.uid, page));

    expect(pages.map((page) => page.items.length)).toEqual([PAGE_SIZE, 2]);
    expect(pages.map((page) => page.total)).toEqual([12, 12]);
    expect(pages.flatMap((page) => page.items)).toEqual(alphabetical);
    expect(pages[1].nextCursor).toBeNull();
  });

  it('lists my followers alphabetically too, including those I do not follow back', async () => {
    const pages = await collectPages((page) => service.listFollowers(ADA.uid, page));

    const expected = [...PEOPLE, EMILIE].sort(compareByFullName).map(publicUser);
    expect(pages.map((page) => page.items.length)).toEqual([PAGE_SIZE, 3]);
    expect(pages.map((page) => page.total)).toEqual([13, 13]);
    expect(pages.flatMap((page) => page.items)).toEqual(expected);
  });

  it('puts the two people with the same name in username order', async () => {
    const pages = await collectPages((page) => service.listFollowing(ADA.uid, page));
    const names = pages.flatMap((page) => page.items.map(({ username }) => username));
    expect(names.indexOf('maryB')).toBeGreaterThan(-1);
    expect(names.indexOf('maryA')).toBe(names.indexOf('maryB') - 1);
  });

  it('returns only public fields', async () => {
    const [first] = (await service.listFollowing(ADA.uid)).items;
    expect(Object.keys(first).sort()).toEqual(['fullName', 'id', 'username']);
  });

  it('answers a user who follows nobody with an empty page', async () => {
    expect(await service.listFollowing('uid-p01')).toMatchObject({
      items: [{ id: ADA.uid }],
      total: 1,
    });
    expect(await service.listFollowing(EMILIE.uid)).toMatchObject({ total: 1 });
    expect(await service.listFollowers('uid-lonely')).toEqual({
      items: [],
      nextCursor: null,
      total: 0,
    });
  });

  it('rejects a cursor that points nowhere and an invalid page size', async () => {
    expect((await failureOf(service.listFollowing(ADA.uid, { cursor: 'nope' }))).code).toBe(
      ErrorCode.INVALID_CURSOR,
    );
    expect((await failureOf(service.listFollowers(ADA.uid, { pageSize: 11 }))).code).toBe(
      ErrorCode.INVALID_PAGE_SIZE,
    );
  });
});
