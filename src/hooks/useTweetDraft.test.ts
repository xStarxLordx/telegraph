import { describe, expect, it } from 'vitest';
import { CounterState, getTweetCounter } from './useTweetDraft';

describe('getTweetCounter', () => {
  it('cannot publish an empty or blank draft', () => {
    expect(getTweetCounter('')).toMatchObject({ count: 0, canPublish: false, state: 'ok' });
    expect(getTweetCounter('   \n ')).toMatchObject({ canPublish: false });
  });

  it('counts code points, so an emoji counts 1', () => {
    expect(getTweetCounter('🚂🚂').count).toBe(2);
    expect(getTweetCounter('🚂'.repeat(280))).toMatchObject({ count: 280, canPublish: true });
  });

  it('counts like the service: surrounding whitespace is ignored', () => {
    expect(getTweetCounter(`  ${'a'.repeat(280)}\n`)).toMatchObject({
      count: 280,
      canPublish: true,
    });
    expect(getTweetCounter('   ').count).toBe(0);
  });

  it('warns in the last 20 characters and blocks over 280', () => {
    expect(getTweetCounter('a'.repeat(259)).state).toBe(CounterState.OK);
    expect(getTweetCounter('a'.repeat(260)).state).toBe(CounterState.NEAR);
    expect(getTweetCounter('a'.repeat(280))).toMatchObject({ state: 'near', canPublish: true });
    expect(getTweetCounter('a'.repeat(281))).toMatchObject({ state: 'over', canPublish: false });
  });
});
