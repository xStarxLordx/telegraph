// Reads firestore.rules as text, for tests that keep the rules and the code in sync (the rules
// can't run here: they need the Firebase emulator).
import { expect } from 'vitest';
import rules from '../../firestore.rules?raw';

export { rules };

/** The text of one `match /<collection>/{...} { ... }` block. */
export function blockOf(collectionName: string) {
  const start = rules.indexOf(`match /${collectionName}/`);
  expect(start, `no match block for ${collectionName}`).toBeGreaterThan(-1);
  const next = rules.indexOf('\n    match /', start + 1);
  return rules.slice(start, next === -1 ? undefined : next);
}

/**
 * The patterns `isOwnMedia` demands of a tweet's `media.path` and `media.url` for account `uid`,
 * read from the rules and turned into JavaScript regular expressions (the rules use RE2, and
 * these patterns only use syntax both share). The rules can't run here, so this is how a test
 * checks what they accept.
 */
export function ownMediaPatterns(uid: string) {
  const patternOf = (field: 'path' | 'url') => {
    const found = new RegExp(
      `media\\.${field}\\.matches\\(\\s*'([^']*)'\\s*\\+\\s*uid\\s*\\+\\s*'([^']*)'\\)`,
    ).exec(rules);
    expect(found, `isOwnMedia has no pattern for media.${field}`).not.toBeNull();
    return new RegExp(`${found?.[1]}${uid}${found?.[2]}`);
  };
  return { path: patternOf('path'), url: patternOf('url') };
}

/** The field names a collection's `create` rule allows (its `hasOnly([...])` list). */
export function allowedFields(collectionName: string) {
  const list = /hasOnly\(\s*\[([^\]]*)\]/.exec(blockOf(collectionName))?.[1] ?? '';
  return [...list.matchAll(/'(\w+)'/g)].map((match) => match[1]);
}
