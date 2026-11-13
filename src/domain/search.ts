import type { User } from '../interfaces/user';
import { FULL_NAME_MAX_LENGTH } from './constants';
import { compareByFullName } from './sorting';
import { toSortKey } from './text';

export function normalizeSearchTerm(term: string) {
  const value = toSortKey(term.trim().replace(/^@/, ''));
  return value && [...value].length <= FULL_NAME_MAX_LENGTH ? value : null;
}

export function matchesSearch(user: User, normalizedTerm: string) {
  const username = (user.username ?? '').toLowerCase();
  return (
    username.startsWith(normalizedTerm) ||
    ` ${toSortKey(user.fullName)}`.includes(` ${normalizedTerm}`)
  );
}

export function searchUsers(users: User[], term: string): User[] {
  const wanted = normalizeSearchTerm(term);
  if (!wanted) return [];
  return users
    .filter((user) => user.username !== null && matchesSearch(user, wanted))
    .sort(compareByFullName);
}
