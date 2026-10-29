# Milestone 2 — User Features & Tweet Publishing

> **Evaluated in:** final delivery (together with Milestones 1 and 3).
> **Source:** `Clon de X.pdf`, section "Milestone 2: Funcionalidades de Usuario y Publicación de Tweets".
> **Goal:** replace the mock services from [Milestone 1](milestone-1.md) with Firebase
> (Authentication + Firestore) for accounts, sessions, tweets, counters and following by username.

General rules `G-xx` are defined in [`../CLAUDE.md`](../CLAUDE.md#general-requirements-graded).

---

## Requirements (from the PDF)

| ID    | Requirement                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------- |
| R2.1  | **User registration**: implement the logic to register a new user.                                 |
| R2.2  | Registration must reject a **username** or **email** that already exists.                          |
| R2.3  | **Login**: implement login with **username** and password.                                         |
| R2.4  | Integrate login with **Google** (or another provider).                                             |
| R2.5  | **Publish tweets**: implement the logic to publish a tweet.                                        |
| R2.6  | A tweet must not exceed **280 characters**.                                                        |
| R2.7  | Tell the user whether the tweet was published successfully.                                        |
| R2.8  | **Counters**: show the number of followers and following on the user's home page.                  |
| R2.9  | **View tweets of followers and following**: be able to see the tweets of the people in both lists. |
| R2.10 | **Follow by username**: a form to follow another user by their username.                           |
| R2.11 | If I already follow that user, detect it and tell me.                                              |

---

## Tasks

### M2-01 · Firebase project and SDK setup

**Description:** Create the Firebase project, register the web app, enable Authentication
(Email/Password and Google providers) and Cloud Firestore. Read the web config from
`VITE_FIREBASE_*` variables in `.env.local` (ignored by git) and commit a `.env.example`.
Initialize the SDK once in `src/services/firebase/firebaseApp.js`. Optionally enable the Firebase
Emulator Suite for local development and tests.
**Covers:** prerequisite for R2.x.
**Depends on:** M1-01, M1-03.
**Blocks:** M2-02 … M2-12.
**Done when:** the app boots with the real config; a missing variable produces a clear console
error instead of a blank page.

### M2-02 · Firestore data model, indexes and security rules

**Description:** Define and document (in the README) the collections:
`users/{usernameLower}` (uid, fullName, username, email, createdAt: one document per account,
keyed by its lowercase username, which guarantees uniqueness and resolves logins. It must be
readable before login, which exposes the email of a known username, an accepted trade-off for
this class project that is noted in the README; a profile by `uid` is a query on the `uid`
field),
`tweets/{id}` (authorId, authorFullName, authorUsername, body, createdAt),
`follows/{followerId_followeeId}` (followerId, followeeId, plus the denormalized full name and
username of both sides, and `followerFullNameLower` / `followeeFullNameLower` sort keys
(lowercase, accents removed) for the alphabetical lists in M3-02 and M3-03; the username breaks
ties, like `compareByFullName`).
Write `firestore.rules`: users write only their own documents; tweet `body` is a string of
1–280 characters and `authorId == request.auth.uid` and `createdAt == request.time` (no forged
timestamps); the copied names on tweets and follows must match the author's profile (`get()`);
a follow can only be created by its follower; nobody can follow themselves. Add the composite
indexes the queries need to `firestore.indexes.json`.
**Covers:** R2.2, R2.6 (server-side), G-05.
**Depends on:** M2-01.
**Blocks:** M2-03 … M2-12.
**Done when:** the rules are deployed; a 281-character tweet written straight from the console
SDK is rejected.

### M2-03 · Firebase implementations of the service contracts

**Description:** Implement `authService`, `userService`, `tweetService` and `followService`
against Firebase with **the same contracts** as the M1 mocks, and switch the `ServicesProvider`
to them (keep the mocks for tests and demos). Map Firebase error codes to i18n keys in one place
(`mapFirebaseError`).
**Covers:** G-05 (dependency inversion).
**Depends on:** M2-02.
**Blocks:** M2-04 … M2-12.
**Done when:** no page or component changed to make the switch, only the provider wiring.

### M2-04 · User registration logic

**Description:** Auth calls can't run inside a Firestore transaction, so the flow is:
(1) pre-check that `users/{usernameLower}` doesn't exist (fast feedback);
(2) `createUserWithEmailAndPassword` (a duplicate email fails here with
`auth/email-already-in-use`); (3) in a Firestore **transaction**, create `users/{usernameLower}`
(abort if someone took it since step 1); (4) if step 3 fails, delete
the Auth user just created so no half-created account is left behind. Show translated errors
next to the matching field.
**Covers:** R2.1, R2.2.
**Depends on:** M2-03, M2-07, M1-10.
**Done when:** registering with a taken username or email shows the specific error and creates
nothing; a valid registration logs in and lands on home.

### M2-05 · Login with username and password

**Description:** Firebase Auth signs in with email, not username. Read
`users/{usernameLower}` → email, then call `signInWithEmailAndPassword`. Show one generic
error ("invalid username or password") for both an unknown username and a wrong password, so the
form doesn't reveal which usernames exist.
**Covers:** R2.3.
**Depends on:** M2-03, M2-07, M1-11.
**Done when:** valid credentials log in; both failure cases show the same message.

### M2-06 · Google sign-in and username onboarding

**Description:** `signInWithPopup` with `GoogleAuthProvider`. On a first-time Google login there is
no username yet: send the user to a **"choose your username"** step (same validation and
uniqueness transaction as M2-04) before entering the app. Returning Google users go straight to
home.
**Covers:** R2.4, R2.2.
**Depends on:** M2-04, M2-07.
**Done when:** a new Google account must pick a unique username exactly once; next logins skip
the step.

### M2-07 · Real auth session and route guards

**Description:** `AuthProvider` subscribes to `onAuthStateChanged`, loads the `users/{uid}`
profile and exposes `{ user, profile, loading }`. `ProtectedRoute` waits for `loading` to finish
(spinner, no flash of `/login`). Logout calls `signOut` and returns to `/login`.
**Covers:** R2.3 (session), R1.9.
**Depends on:** M2-03, M1-06.
**Done when:** reloading a private page keeps the session; logout from the header works; a
logged-in user who opens `/login` is sent to home.

### M2-08 · Publish tweet logic

**Description:** `tweetService.publish` writes `tweets/{id}` with `serverTimestamp()` and the
author's denormalized name and username. The 280-character limit is enforced in three places
from one constant `MAX_TWEET_LENGTH`: the composer's counter, the service and the security rules.
Length = Unicode code points (`[...text].length`), not `.length`.
Trim whitespace; reject empty tweets. Show a success toast, clear the form, then offer to go to the
feed. On error, show the message and keep the text.
**Covers:** R2.5, R2.6, R2.7, G-10.
**Depends on:** M2-03, M1-13.
**Related:** M2-02 (rule).
**Done when:** a valid tweet appears in my feed and on my profile; 281 characters cannot be
sent; the success and error notifications appear.

### M2-09 · Followers and following counters on home

**Description:** Compute the counters with Firestore aggregation queries (`getCountFromServer`
over `follows` where `followeeId == uid` / `followerId == uid`) inside a reusable
`useFollowCounts(uid)` hook, so stored counters can't drift. Refresh after follow actions.
**Covers:** R2.8.
**Depends on:** M2-03, M1-12.
**Related:** M3-04 (same hook on the user tweets page).
**Done when:** the numbers on home match the documents in Firestore, including after following
someone.

### M2-10 · Follow a user by username

**Description:** Form on home (designed in the mockup as "Seguir por usuario"):
input + "Seguir" button. `followService.followByUsername` resolves the username and checks, in
order: the user exists → it is not me → I don't already follow them. Then it creates
`follows/{me_them}` with the denormalized names. Each case has its own notice: not found,
can't follow yourself, **"You already follow @x"**, success.
**Covers:** R2.10, R2.11.
**Depends on:** M2-03.
**Related:** M2-09 (refresh counters after following), M3-03, M3-05 (reuse `followService.follow`).
**Done when:** every one of the four outcomes shows its message; following twice never creates
a second document.

### M2-11 · View tweets of followers and following

**Description:** Wire `/users/:username` to Firestore: load the profile by username and their
tweets (`authorId == uid`, `orderBy createdAt desc`). Every user in the followers and following
lists links to this page, so the tweets of anyone in either list can be viewed.
**Covers:** R2.9.
**Depends on:** M2-03, M1-16.
**Related:** M3-01 (pagination), M3-06.
**Done when:** clicking any user in either list opens their tweets in the right order.

### M2-12 · Real feed data

**Description:** Feed = my tweets + those of the users I follow, newest first. Firestore limits
`in` filters to 30 values, so split the author IDs into chunks of up to 30, query each chunk
with `orderBy createdAt desc`, and merge the results by date. **Pagination:** one cursor serves
every chunk, because they share one order: the last tweet shown. Each page fetches up to 11
after it from every chunk, merges them and keeps the 10 newest; there is a next page when more
than 10 came back (total = the sum of the per-chunk counts). Whatever a chunk didn't return can
only come after the last tweet shown, so nothing is skipped or repeated. Document this
limitation and the chosen approach in the README.
**Covers:** R2.9, R1.8.
**Depends on:** M2-08, M2-10.
**Related:** M3-01.
**Done when:** the feed shows the right tweets with 0, 1 and more than 30 followed users
(seed script or emulator).

### M2-13 · Tests for validation and services

**Description:** Unit tests (Vitest) for the pure validators (username format, email, password,
tweet length, including emoji and surrogate pairs) and `mapFirebaseError`. Against the Firebase
emulator: check that the rules' `size()` agrees with `[...text].length` for emoji at the 280
limit, and (optionally) test registration uniqueness and follow-twice.
**Covers:** G-05 (quality), R2.2, R2.6, R2.11.
**Depends on:** M2-04, M2-08, M2-10.
**Done when:** `npm test` is green and covers every validation branch.

### M2-14 · Milestone 2 wrap-up

**Description:** Update the README (Firebase setup, `.env.example`, data model, feed
limitation), check that every new string exists in `es` and `en`, run lint and tests, merge to
`develop` through PRs, and add the bitácora entries.
**Covers:** G-01 … G-12.
**Depends on:** M2-01 … M2-13.
**Done when:** every row of the tracking table below is marked.

---

## Tracking

Mark a task with `X` when it is done and write the date (`YYYY-MM-DD`). Notes are optional.

| Done | ID    | Task                                              | Date       | Notes                                                                                                                                                                                                          |
| :--: | ----- | ------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ]  | M2-01 | Firebase project and SDK setup                    |            |                                                                                                                                                                                                                |
| [X]  | M2-02 | Firestore data model, indexes and security rules  | 2026-10-28 | Rules + 3 composite indexes deployed; on the real project 13 malicious writes were denied, incl. a 281-character tweet. Tweet length counted in code points with an RE2 regex (280 emoji accepted, 281 denied) |
| [X]  | M2-03 | Firebase implementations of the service contracts | 2026-10-28 | Auth, user, tweet and follow services on Firebase; no page or component changed. Mocks kept for tests                                                                                                          |
| [ ]  | M2-04 | User registration logic                           |            |                                                                                                                                                                                                                |
| [ ]  | M2-05 | Login with username and password                  |            |                                                                                                                                                                                                                |
| [ ]  | M2-06 | Google sign-in and username onboarding            |            | `/choose-username` page and guard already built in M1 on the mock; wire Firebase                                                                                                                               |
| [ ]  | M2-07 | Real auth session and route guards                |            |                                                                                                                                                                                                                |
| [X]  | M2-08 | Publish tweet logic                               | 2026-10-28 | Real project: published tweet shows in the feed, 281 characters denied in the service and the rules, 280 emoji accepted. Toasts not viewed in a browser against Firebase                                       |
| [X]  | M2-09 | Followers and following counters on home          | 2026-10-28 | getCountFromServer; checked through the service on the real project (ada 14/14, novato 0/1 after a follow). Gauges not viewed in a browser                                                                     |
| [X]  | M2-10 | Follow a user by username                         | 2026-10-28 | Not found, self, already following and success all checked through the service on the real project                                                                                                             |
| [X]  | M2-11 | View tweets of followers and following            | 2026-10-28 | Tweets by author newest first, checked on the real project (ada 15 in pages 10 + 5). Pages not viewed in a browser                                                                                             |
| [X]  | M2-12 | Real feed data                                    | 2026-10-28 | One cursor for all chunks. Real project: 32 followees = 65 tweets in 7 pages, unique and ordered                                                                                                               |
| [ ]  | M2-13 | Tests for validation and services                 |            |                                                                                                                                                                                                                |
| [ ]  | M2-14 | Milestone 2 wrap-up                               |            |                                                                                                                                                                                                                |
