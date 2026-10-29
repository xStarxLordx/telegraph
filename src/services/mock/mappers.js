// Map stored records to the shapes declared in src/services/contracts.js.

/** @returns {import('../contracts').User} */
export function toPublicUser({ id, fullName, username }) {
  return { id, fullName, username };
}

/** @returns {import('../contracts').CurrentUser} */
export function toCurrentUser(user) {
  return { ...toPublicUser(user), email: user.email };
}

/** @returns {import('../contracts').Tweet} */
export function toTweet(record) {
  return { ...record, createdAt: new Date(record.createdAt) };
}
