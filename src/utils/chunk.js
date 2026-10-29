/**
 * Splits `items` into consecutive groups of at most `size` elements.
 * @template T
 * @param {T[]} items
 * @param {number} size A positive integer.
 * @returns {T[][]}
 */
export default function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}
