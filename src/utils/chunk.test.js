import { describe, expect, it } from 'vitest';
import chunk from './chunk';

describe('chunk', () => {
  it('splits into groups of the given size, the last one possibly shorter', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('keeps an exact multiple together and an empty list empty', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(chunk([], 30)).toEqual([]);
  });

  it('returns one group when the list is shorter than the size', () => {
    expect(chunk(['a'], 30)).toEqual([['a']]);
  });

  it('does not change the original list', () => {
    const items = [1, 2, 3];
    chunk(items, 2);
    expect(items).toEqual([1, 2, 3]);
  });
});
