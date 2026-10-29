import { describe, expect, it } from 'vitest';
import { MAX_TWEET_LENGTH, PAGE_SIZE } from './constants';
import { ErrorCode, ServiceError } from './errors';
import { compareByFullName, compareByNewest } from './sorting';
import { countCharacters, toSortKey } from './text';
import {
  cleanUsername,
  normalizeUsername,
  validateEmail,
  validateFullName,
  validatePageSize,
  validatePassword,
  validateTweetBody,
  validateUsername,
} from './validation';

describe('countCharacters', () => {
  it('counts an emoji as one character', () => {
    expect('⚙️'.length).toBe(2);
    expect(countCharacters('🚂')).toBe(1);
    expect(countCharacters('a🚂b')).toBe(3);
  });
});

describe('toSortKey', () => {
  it('ignores case and accents', () => {
    expect(toSortKey('Ángela Ruiz')).toBe('angela ruiz');
    expect(toSortKey('Émilie du Châtelet')).toBe('emilie du chatelet');
  });

  it('maps letters that normalization does not decompose', () => {
    expect(toSortKey('Hans Ørsted')).toBe('hans orsted');
    expect(toSortKey('Straße')).toBe('strasse');
  });

  it('collapses whitespace', () => {
    expect(toSortKey('  Ada   Lovelace ')).toBe('ada lovelace');
  });
});

describe('validators', () => {
  it('validates full names', () => {
    expect(validateFullName('  ')).toBe(ErrorCode.REQUIRED);
    expect(validateFullName('x'.repeat(51))).toBe(ErrorCode.FULL_NAME_TOO_LONG);
    expect(validateFullName('Ada Lovelace')).toBeNull();
  });

  it('validates usernames', () => {
    expect(validateUsername('')).toBe(ErrorCode.REQUIRED);
    expect(validateUsername('ab')).toBe(ErrorCode.USERNAME_INVALID);
    expect(validateUsername('a'.repeat(16))).toBe(ErrorCode.USERNAME_INVALID);
    expect(validateUsername('has space')).toBe(ErrorCode.USERNAME_INVALID);
    expect(validateUsername('ñandú')).toBe(ErrorCode.USERNAME_INVALID);
    expect(validateUsername('@ada_99')).toBeNull();
  });

  it('cleans usernames keeping their case, and normalizes them for comparison', () => {
    expect(cleanUsername(' @Ada ')).toBe('Ada');
    expect(normalizeUsername(' @Ada ')).toBe('ada');
  });

  it('validates emails', () => {
    expect(validateEmail('')).toBe(ErrorCode.REQUIRED);
    expect(validateEmail('ada@')).toBe(ErrorCode.EMAIL_INVALID);
    expect(validateEmail('ada@telegraph.test')).toBeNull();
  });

  it('validates passwords', () => {
    expect(validatePassword('')).toBe(ErrorCode.REQUIRED);
    expect(validatePassword('1234567')).toBe(ErrorCode.PASSWORD_TOO_SHORT);
    expect(validatePassword('12345678')).toBeNull();
  });

  it('validates tweet bodies at the 280 code-point limit', () => {
    expect(validateTweetBody('   ')).toBe(ErrorCode.TWEET_EMPTY);
    expect(validateTweetBody('x'.repeat(MAX_TWEET_LENGTH))).toBeNull();
    expect(validateTweetBody('x'.repeat(MAX_TWEET_LENGTH + 1))).toBe(ErrorCode.TWEET_TOO_LONG);
    // 280 emoji = 560 UTF-16 units, still valid.
    expect(validateTweetBody('🚂'.repeat(MAX_TWEET_LENGTH))).toBeNull();
    // Surrounding whitespace doesn't count.
    expect(validateTweetBody(`  ${'x'.repeat(MAX_TWEET_LENGTH)}  `)).toBeNull();
  });

  it('accepts page sizes from 1 to PAGE_SIZE and nothing else', () => {
    expect(validatePageSize(1)).toBeNull();
    expect(validatePageSize(PAGE_SIZE)).toBeNull();
    [0, -1, PAGE_SIZE + 1, 2.5, NaN, null, '10'].forEach((pageSize) => {
      expect(validatePageSize(pageSize)).toBe(ErrorCode.INVALID_PAGE_SIZE);
    });
  });
});

describe('comparators', () => {
  const person = (fullName, username) => ({ fullName, username });

  it('sorts by full name ignoring accents and case, then username', () => {
    const people = [
      person('Émilie du Châtelet', 'emilie'),
      person('ada Lovelace', 'ada2'),
      person('Ángela Ruiz Robles', 'aruizrobles'),
      person('Ada Lovelace', 'ada'),
      person('Zuse', 'zuse'),
    ];
    expect(people.sort(compareByFullName).map((p) => p.username)).toEqual([
      'ada',
      'ada2',
      'aruizrobles',
      'emilie',
      'zuse',
    ]);
  });

  it('orders by code point like Firestore, also for characters outside the BMP', () => {
    // '😀' (U+1F600) is above 'ｱ' (U+FF71), although its first UTF-16 unit is below it.
    expect(compareByFullName(person('😀 Bob', 'a'), person('ｱ', 'b'))).toBe(1);
    expect(compareByFullName(person('H. G. Wells', 'a'), person('Hedy', 'b'))).toBe(-1);
  });

  it('sorts newest first with a stable tie-break on id', () => {
    const tweets = [
      { id: 't1', createdAt: '2026-01-01T00:00:00Z' },
      { id: 't3', createdAt: '2026-01-02T00:00:00Z' },
      { id: 't2', createdAt: '2026-01-02T00:00:00Z' },
    ];
    expect(tweets.sort(compareByNewest).map((t) => t.id)).toEqual(['t3', 't2', 't1']);
  });
});

describe('ServiceError', () => {
  it('carries the code and optional field', () => {
    const error = new ServiceError(ErrorCode.USERNAME_TAKEN, { field: 'username' });
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('user/username-taken');
    expect(error.field).toBe('username');
    expect(new ServiceError(ErrorCode.FOLLOW_SELF).field).toBeNull();
  });

  it('keeps the original error as the cause', () => {
    const original = new Error('provider failure');
    expect(new ServiceError(ErrorCode.UNKNOWN, { cause: original }).cause).toBe(original);
    expect(new ServiceError(ErrorCode.UNKNOWN).cause).toBeUndefined();
  });
});
