// Firestore collection names (data model: see the README, added with M2-02).

const Collection = Object.freeze({
  /**
   * `users/{usernameLower}`: one document per account, keyed by its lowercase username so a
   * username can belong to only one account. Holds `uid`, `fullName`, `username` (as typed),
   * `email` and `createdAt`. Also resolves a username to its email at login.
   */
  USERS: 'users',
});

export default Collection;
