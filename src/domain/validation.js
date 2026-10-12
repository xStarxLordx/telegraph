// Pure validators. Each returns an ErrorCode, or null when the value is valid.
import {
  FULL_NAME_MAX_LENGTH,
  MAX_TWEET_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './constants';
import { ErrorCode } from './errors';
import { countCharacters } from './text';

const USERNAME_PATTERN = new RegExp(
  `^[A-Za-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`,
);
// Pragmatic check: something@something.tld. Real verification is the provider's job.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Usernames are compared and stored case-insensitively; the leading "@" is optional. */
export function normalizeUsername(username) {
  return username.trim().replace(/^@/, '').toLowerCase();
}

export function validateFullName(fullName) {
  const value = fullName.trim();
  if (!value) return ErrorCode.REQUIRED;
  if (countCharacters(value) > FULL_NAME_MAX_LENGTH) return ErrorCode.FULL_NAME_TOO_LONG;
  return null;
}

export function validateUsername(username) {
  const value = username.trim().replace(/^@/, '');
  if (!value) return ErrorCode.REQUIRED;
  if (!USERNAME_PATTERN.test(value)) return ErrorCode.USERNAME_INVALID;
  return null;
}

export function validateEmail(email) {
  const value = email.trim();
  if (!value) return ErrorCode.REQUIRED;
  if (!EMAIL_PATTERN.test(value)) return ErrorCode.EMAIL_INVALID;
  return null;
}

export function validatePassword(password) {
  if (!password) return ErrorCode.REQUIRED;
  if (password.length < PASSWORD_MIN_LENGTH) return ErrorCode.PASSWORD_TOO_SHORT;
  return null;
}

export function validateTweetBody(body) {
  const value = body.trim();
  if (!value) return ErrorCode.TWEET_EMPTY;
  if (countCharacters(value) > MAX_TWEET_LENGTH) return ErrorCode.TWEET_TOO_LONG;
  return null;
}
