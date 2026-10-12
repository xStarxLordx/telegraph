// Pure text helpers shared by validation, sorting and the UI.

/**
 * Counts Unicode code points, so an emoji counts as 1 (String#length counts UTF-16 units).
 * @param {string} text
 * @returns {number}
 */
export function countCharacters(text) {
  return [...text].length;
}

// Letters that Unicode normalization does not decompose into base letter + accent.
const SPECIAL_LETTERS = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', đ: 'd', ł: 'l', þ: 'th' };

/**
 * Builds the key used to sort people alphabetically: lowercase, accents removed, so
 * "Ángela" sorts with "a" and "Émilie" with "e". Stored as-is in Firestore (M2-02) so the
 * database orders exactly like this function.
 * @param {string} text
 * @returns {string}
 */
export function toSortKey(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[øæœßđłþ]/g, (letter) => SPECIAL_LETTERS[letter])
    .replace(/\s+/g, ' ');
}
