import { describe, expect, it } from 'vitest';
import { PAGE_SIZE } from '../../domain/constants';
import { validateTweetBody, validateUsername } from '../../domain/validation';
import { createSeedState, DEMO_USERNAME } from './seed';

describe('seed data', () => {
  const state = createSeedState();
  const ada = state.users.find((user) => user.username === DEMO_USERNAME);
  const following = state.follows.filter((f) => f.followerId === ada.id).map((f) => f.followeeId);
  const followers = state.follows.filter((f) => f.followeeId === ada.id).map((f) => f.followerId);

  it('has 25 users with unique ids and valid, unique usernames', () => {
    expect(state.users).toHaveLength(25);
    expect(new Set(state.users.map((u) => u.id)).size).toBe(25);
    expect(new Set(state.users.map((u) => u.username)).size).toBe(25);
    state.users.forEach((user) => expect(validateUsername(user.username)).toBeNull());
  });

  it('has valid tweets whose authors exist and match the denormalized fields', () => {
    expect(state.tweets.length).toBeGreaterThanOrEqual(40);
    expect(new Set(state.tweets.map((t) => t.id)).size).toBe(state.tweets.length);
    state.tweets.forEach((tweet) => {
      const author = state.users.find((user) => user.id === tweet.authorId);
      expect(author.username).toBe(tweet.authorUsername);
      expect(author.fullName).toBe(tweet.authorFullName);
      expect(validateTweetBody(tweet.body)).toBeNull();
    });
  });

  it('has no self-follows or duplicates', () => {
    expect(new Set(state.follows.map((f) => f.id)).size).toBe(state.follows.length);
    state.follows.forEach((f) => expect(f.followerId).not.toBe(f.followeeId));
  });

  it('gives the demo user 2+ pages in every list', () => {
    const adaTweets = state.tweets.filter((t) => t.authorId === ada.id);
    expect(following.length).toBeGreaterThan(PAGE_SIZE);
    expect(followers.length).toBeGreaterThan(PAGE_SIZE);
    expect(adaTweets.length).toBeGreaterThan(PAGE_SIZE);
  });

  it('includes followers the demo user does not follow back (Follow buttons)', () => {
    const notFollowedBack = followers.filter((id) => !following.includes(id));
    expect(notFollowedBack.length).toBeGreaterThan(0);
  });

  it('keeps id counters past the seeded ids', () => {
    expect(state.counters.tweet).toBe(state.tweets.length);
    expect(state.counters.user).toBe(state.users.length);
  });

  it('builds independent copies', () => {
    const other = createSeedState();
    other.users.pop();
    expect(createSeedState().users).toHaveLength(25);
  });
});
