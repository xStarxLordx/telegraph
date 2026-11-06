import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeSearchTerm, searchUsers } from './search';

const user = (fullName: string, username: string | null) => ({
  id: `id-${username ?? fullName}`,
  fullName,
  username,
});

const PEOPLE = [
  user('Dora Díaz', 'ddiaz'),
  user('Ada Lovelace', 'ada'),
  user('Eduardo Dora', 'edu'),
  user('Ángela Ruiz Robles', 'aruizrobles'),
  user('Sin Usuario', null),
];

const usernamesFor = (term: string) => searchUsers(PEOPLE, term).map((person) => person.username);

describe('normalizeSearchTerm', () => {
  it('ignores case, accents, spaces and a leading "@"', () => {
    expect(normalizeSearchTerm('  @ÁNGELA  ')).toBe('angela');
    expect(normalizeSearchTerm('Dora   Díaz')).toBe('dora diaz');
  });

  it('is null for an empty term or one longer than any name', () => {
    expect(normalizeSearchTerm('')).toBeNull();
    expect(normalizeSearchTerm('  @ ')).toBeNull();
    expect(normalizeSearchTerm('a'.repeat(51))).toBeNull();
  });
});

describe('matchesSearch', () => {
  it('matches the start of the username', () => {
    expect(matchesSearch(PEOPLE[3], 'aruiz')).toBe(true);
  });

  it('matches the start of any word of the full name, not the middle of one', () => {
    expect(matchesSearch(PEOPLE[0], 'dora')).toBe(true);
    expect(matchesSearch(PEOPLE[0], 'diaz')).toBe(true);
    expect(matchesSearch(PEOPLE[0], 'ora')).toBe(false);
  });

  it('matches several words of the name in order', () => {
    expect(matchesSearch(PEOPLE[0], 'dora di')).toBe(true);
    expect(matchesSearch(PEOPLE[0], 'diaz dora')).toBe(false);
  });
});

describe('searchUsers', () => {
  it('finds people by name or by username, alphabetical by full name', () => {
    expect(usernamesFor('dora')).toEqual(['ddiaz', 'edu']);
    expect(usernamesFor('ada')).toEqual(['ada']);
    expect(usernamesFor('angela')).toEqual(['aruizrobles']);
  });

  it('never lists accounts without a username', () => {
    expect(usernamesFor('sin')).toEqual([]);
  });

  it('returns nothing for an empty term', () => {
    expect(searchUsers(PEOPLE, '')).toEqual([]);
  });
});
