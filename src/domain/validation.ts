// Pure validators. Each returns an ErrorCode, or null when the value is valid.
import {
  FULL_NAME_MAX_LENGTH,
  MAX_TWEET_LENGTH,
  PAGE_SIZE,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './constants';
import type { ValidationResult } from '../interfaces/errors';
import { ErrorCode } from './errors';
import { countCharacters } from './text';

const USERNAME_PATTERN = new RegExp(
  `^[A-Za-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`,
);
// Pragmatic check: something@something.tld. Real verification is the provider's job.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The username as typed, without surrounding spaces or the optional leading "@". */
export function cleanUsername(username: string) {
  return username.trim().replace(/^@/, '');
}

/** Usernames are compared case-insensitively: this is the key to look one up by. */
export function normalizeUsername(username: string) {
  return cleanUsername(username).toLowerCase();
}

export function validateFullName(fullName: string): ValidationResult {
  const value = fullName.trim();
  if (!value) return ErrorCode.REQUIRED;
  if (countCharacters(value) > FULL_NAME_MAX_LENGTH) return ErrorCode.FULL_NAME_TOO_LONG;
  return null;
}

export function validateUsername(username: string): ValidationResult {
  const value = cleanUsername(username);
  if (!value) return ErrorCode.REQUIRED;
  if (!USERNAME_PATTERN.test(value)) return ErrorCode.USERNAME_INVALID;
  return null;
}

export function validateEmail(email: string): ValidationResult {
  const value = email.trim();
  if (!value) return ErrorCode.REQUIRED;
  if (!EMAIL_PATTERN.test(value)) return ErrorCode.EMAIL_INVALID;
  return null;
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return ErrorCode.REQUIRED;
  if (password.length < PASSWORD_MIN_LENGTH) return ErrorCode.PASSWORD_TOO_SHORT;
  return null;
}

/** A tweet needs text, unless it carries media: then the text is optional (still up to 280). */
export function validateTweetBody(body: string, hasMedia = false): ValidationResult {
  const value = body.trim();
  if (!value && !hasMedia) return ErrorCode.TWEET_EMPTY;
  if (countCharacters(value) > MAX_TWEET_LENGTH) return ErrorCode.TWEET_TOO_LONG;
  return null;
}

/**
 * A page holds a whole number of items, from 1 up to PAGE_SIZE (G-09). Takes anything: the size
 * comes from the caller and is checked at runtime.
 */
export function validatePageSize(pageSize: unknown): ValidationResult {
  const valid =
    typeof pageSize === 'number' &&
    Number.isInteger(pageSize) &&
    pageSize >= 1 &&
    pageSize <= PAGE_SIZE;
  return valid ? null : ErrorCode.INVALID_PAGE_SIZE;
}
