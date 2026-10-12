// Pure comparators for the orders the PDF requires (G-09).
import { toSortKey } from './text';

// Code-point comparison: Firestore orders strings by UTF-8 bytes, which equals code-point
// order. Neither localeCompare (ignores punctuation) nor `<` (compares UTF-16 units, so emoji
// sort before some BMP letters) matches it, and mock and Firebase lists must agree.
function compareStrings(a, b) {
  const left = [...a];
  const right = [...b];
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const difference = left[i].codePointAt(0) - right[i].codePointAt(0);
    if (difference !== 0) return Math.sign(difference);
  }
  return Math.sign(left.length - right.length);
}

/** Alphabetical by full name, accent- and case-insensitive; username breaks ties. */
export function compareByFullName(a, b) {
  return (
    compareStrings(toSortKey(a.fullName), toSortKey(b.fullName)) ||
    compareStrings(a.username, b.username)
  );
}

/** Newest first; id breaks ties so the order is stable across pages. */
export function compareByNewest(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt) || compareStrings(b.id, a.id);
}
