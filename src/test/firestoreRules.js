// Reads firestore.rules as text, for tests that keep the rules and the code in sync (the rules
// can't run here: they need the Firebase emulator).
import { expect } from 'vitest';
import rules from '../../firestore.rules?raw';

export { rules };

/** The text of one `match /<collection>/{...} { ... }` block. */
export function blockOf(collectionName) {
  const start = rules.indexOf(`match /${collectionName}/`);
  expect(start, `no match block for ${collectionName}`).toBeGreaterThan(-1);
  const next = rules.indexOf('\n    match /', start + 1);
  return rules.slice(start, next === -1 ? undefined : next);
}

/** The field names a collection's `create` rule allows (its `hasOnly([...])` list). */
export function allowedFields(collectionName) {
  const list = /hasOnly\(\s*\[([^\]]*)\]/.exec(blockOf(collectionName))?.[1] ?? '';
  return [...list.matchAll(/'(\w+)'/g)].map((match) => match[1]);
}
