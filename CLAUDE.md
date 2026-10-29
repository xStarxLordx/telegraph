# Telegraph — X (Twitter) clone · class project

React SPA (Vite, JavaScript, CSS Modules) + Firebase (Auth, Firestore). Individual project.
Spec: `Clon de X.pdf` in this folder. If it disagrees with these docs, the PDF wins: fix the docs.

## Where the work is planned

Read the milestone file for the task you are working on **before** coding:

- [`docs/milestone-1.md`](docs/milestone-1.md): layout and SPA on mocked data. **First delivery = M1 only.**
- [`docs/milestone-2.md`](docs/milestone-2.md): Firebase auth, publishing tweets, counters, follow by username.
- [`docs/milestone-3.md`](docs/milestone-3.md): paginated follower/following lists, follow actions, final quality.
- [`docs/design-system.md`](docs/design-system.md): color tokens, fonts and visual details for both themes, plus the mockup link.

Task IDs (`M1-07`), requirement IDs (`R2.6`) and rule IDs (`G-09`) cross-reference each other.
When a task is finished, mark it in that file's **Tracking** table: `[X]`, the date
(`YYYY-MM-DD`) and optional notes. Never mark a task that wasn't verified.

**Final delivery = M1 + M2 + M3 + every G-xx rule.**

The PDF also refers to a separate **repository rules document** shared in the course channel.
It isn't in this folder yet. When it is added, it overrides G-02 and G-03 where they differ:
update them.

## General requirements (graded)

| ID   | Rule                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | All code identifiers, comments and documentation in **English**. User-visible copy is the exception (G-07).                                                                                                     |
| G-02 | Branches for every feature and fix: `feature/<task-id>-<slug>`, `fix/<slug>`; `develop` = integration, `main` = deliveries.                                                                                     |
| G-03 | Clear, concise commits (Conventional Commits, imperative, ≤ 72 chars) and merges only through **pull requests** with a review (working solo: self-review the PR against its task's "Done when" before merging). |
| G-04 | Airbnb JavaScript Style Guide, enforced by ESLint (`npm run lint` must pass).                                                                                                                                   |
| G-05 | Modular, reusable components; business logic in services/hooks, never in JSX; documentation kept current.                                                                                                       |
| G-06 | Every tweet is shown as: `Full Name, @username - date and time` on the first line and the body below, between separator rules. Single source: `TweetCard`.                                                      |
| G-07 | Every visible string goes through i18next (`es` default, `en`). No hard-coded copy. _(Project decision, not from the PDF.)_                                                                                     |
| G-08 | UX/UI is graded as a differentiator: follow `docs/design-system.md` in both themes.                                                                                                                             |
| G-09 | Lists and feeds paginate at **10 items** per page (`PAGE_SIZE`). User lists sort alphabetically by full name; tweets sort newest first.                                                                         |
| G-10 | Tweets are limited to **280 characters** (`MAX_TWEET_LENGTH`), enforced in the UI, the service and the Firestore rules.                                                                                         |
| G-11 | `bitacora.md` (AI log) at the repo root: append-only, committed throughout the project. See below.                                                                                                              |
| G-12 | Graded on visible repo activity (commits, PRs, issues, reviews): no participation, no grade.                                                                                                                    |

## AI log — `bitacora.md` (mandatory while AI is used)

At the end of every AI work session, **append** an entry to `bitacora.md` with: date and time,
tool and model, the student's messages **verbatim**, a summary of the answer, and the files
created or modified. For web chats (ChatGPT, Claude.ai, Gemini…), add the conversation's
shared link or full export. Never edit or delete earlier entries; the file's Git history is
graded. Commit it with the session's work, never in one final batch commit.

## Architecture rules

- UI → hooks → **service contracts** (`authService`, `userService`, `tweetService`,
  `followService`) provided by `ServicesProvider`. Components never import Firebase or mock data.
  The contracts live in `src/services/contracts.js`; `src/services/createAppServices.js` is the
  only place that picks an implementation (Firebase for the app). The mocks stay for the tests.
- Business rules (validation, limits, sort keys) are pure functions in `src/domain/`, shared by
  every implementation. Failures throw `ServiceError` with a `code`; the UI translates the
  code and never parses messages.
- Lists are **cursor-paginated** in the contract (`{ items, nextCursor, total }`), so the UI
  never slices arrays and Firestore can use `startAfter`.
- Write methods take the acting user's id, and it must be the logged-in user
  (`PERMISSION_DENIED` otherwise). The mock enforces it because the Firestore rules will.
- Mock data persists in `localStorage` (`telegraph.mock.v1`); the tests (`src/test/renderApp.jsx`)
  run entirely on it. Its demo accounts (`@ada`…, password `telegraph`) exist **only inside the
  mock**: the running app signs in through Firebase, so they can't log in there. Remove that key
  to go back to the seed. One tab at a time: two tabs writing at once overwrite each other
  (mock-only limitation).
- Colors, fonts, radii: CSS custom properties from `design-system.md` only. Themes switch with
  `data-theme` on `<html>`, dark by default.
- **One app, two palettes:** a theme changes only color-token values. Never branch markup, icons,
  fonts or shapes on the theme (the sun/moon toggle icon is the only exception).
- Follows go through `useSocial().follow` (or `useFollowUser`), never straight to
  `followService.follow`: it bumps the version that makes counters and Follow buttons reload.
- Redirects after login, register and logout belong to the route guards (`src/routes/guards.jsx`):
  auth pages only call the service and let `PublicOnly` / `RequireAuth` react to the session.

## Firebase

The tracking tables in `docs/` say which tasks are finished; this is only what the code can't say.

- **Data model: one `users/{usernameLower}` document per account** (`uid`, `fullName`, `username`,
  `email`, `createdAt`). It is the profile, the username claim (the key makes it unique) and the
  login lookup: there is no `usernames/` collection and no `users/{uid}`. A profile by `uid` is a
  query on the `uid` field, so `list` is open to signed-in users, and `get` is public (it exposes
  the email of a username you already know). The rules can't limit an account to one profile, so
  a client could claim several usernames directly. Both are accepted trade-offs, noted in the README.
- **The rules, the indexes and the services must agree, and none of them can be tried without
  deploying.** `firestore.rules` duplicates the field lists and limits of the code
  (`firestoreRules.test.js` fails when they drift), and every ordered query needs its composite
  index in `firestore.indexes.json` (the test fake `src/test/fakeFirestore.js` rejects a query whose
  index is missing). Changing a document's fields means changing the service, the rules and the
  README together.
- **Deploy** with `npx firebase-tools deploy --only firestore:rules,firestore:indexes` (project
  `x-clone-desarrollo1`, from `.firebaserc`); there is no global `firebase` command on this
  machine. Indexes take minutes to build; until then the lists fail with "requires an index".
- **The fake does not run the security rules.** Testing them needs the Firebase emulator, which
  needs a JDK newer than the Java 8 installed here. Until then the rules are verified by reading
  them and by trying the deployed project: a throwaway test that signs in as a demo account and
  calls the services and raw `addDoc`/`setDoc` against the real backend (2026-10-28: reads,
  indexes and 13 malicious writes behaved as designed). The service account can't call the
  rules-testing API (403), so a rule can't be evaluated without deploying it.
- **Demo data: `npm run seed` (Admin SDK, bypasses the rules).** 42 accounts whose uid starts with
  `demo-` (the prefix `--clean` relies on; a test pins it), all with the password `telegraph`.
  Needs `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service account key **outside the repo**:
  it is a secret, never read, print or commit it. The script refuses a key from another project
  and aborts instead of overwriting a real account. Any test that writes to the real project
  (e.g. as `novato`) must delete what it created: `novato` has to stay empty for the demo.
- **An account can hold several profiles** (a signed-in client can write `users/<other>` with its
  own uid; verified). `findProfileByUid` takes `limit(1)`, so which one it returns is arbitrary:
  delete stray profiles with the Admin SDK.
- **`.env.local` needs all six `VITE_FIREBASE_*` values** (`.env.example` lists them). A missing
  one makes `readFirebaseConfig` throw while `main.jsx` builds the services, before React
  renders: the page is blank and the message is only in the console. Tests never read the config
  or contact Firebase (`vi.mock('firebase/firestore', ...)` with the fake, as the service tests do).
- **Tweets and follows carry copies of people's names** (`authorFullName`, `followeeFullName`…).
  The rules check them against the profile. There is no way to rename an account, so they can't go
  stale; if renaming is ever added, those copies need updating.

## Traps (non-obvious)

- **Firebase Auth has no username login.** Read `users/{usernameLower}` (public `get`) to get the
  account's email first (M2-05). Google users have no username: force the onboarding step
  (M2-06).
- **Auth calls can't run inside a Firestore transaction.** Registration = create the Auth user,
  then claim the username in a transaction, and delete the Auth user if the claim fails (M2-04).
- **Firestore `in` accepts at most 30 values**, so the feed queries authors in chunks and merges
  the results (M2-12).
- **No offset pagination in the Firestore web SDK.** Use cursors (`startAfter`) plus
  `getCountFromServer` for "Page X of Y" (M3-01).
- Firebase web config goes in `.env.local` as `VITE_FIREBASE_*` (no `VITE_` prefix means
  `undefined` at runtime). The config isn't secret: **security rules** protect the data.
- **Tweet length: the three limits do NOT agree for emoji.** The UI and the service count code
  points (`[...text].length`); the rules' `size()` counts UTF-16 units (measured on the deployed
  project, 2026-10-28: 280 × `ñ` and 140 × 😀 are accepted, 141 × 😀 is denied). Accented text
  is unaffected, but a tweet with many emoji can pass the UI and be denied by the rules
  (`auth/permission-denied`). Not fixed yet.
- **Feed pagination over chunked queries:** one cursor (the last tweet shown) serves every chunk,
  because all chunks share the same order. Each page asks every chunk for 11 after it, merges and
  keeps the 10 newest (M2-12). Don't add a cursor per chunk: it is redundant.
- **ESLint stays on 9.x.** Airbnb comes from `eslint-config-airbnb-extended`, which doesn't support
  ESLint 10 yet. The official `eslint-config-airbnb` is stuck on ESLint 8. Never run
  `npm audit fix --force`: it downgrades `firebase` to 9.x. The 4 advisories left are
  `@grpc/grpc-js` ones pinned by `firebase` (Node-only code, not in the browser bundle; see
  README › Code style).
- Airbnb enforces `react/prop-types` in plain JS: components declare `propTypes`. React 19 ignores
  `defaultProps` on function components, so optional props default in the destructuring
  (`react/require-default-props` is set to `defaultArguments`).
- **`react-hooks/set-state-in-effect`** rejects `setState` called synchronously inside an effect
  (e.g. `setLoading(true)` before a fetch). Derive "loading" from which request settled last,
  as `useAsyncData` and `usePaginatedList` do, and only set state in the async callbacks.
- Vitest runs in Node by default: a test that renders to the DOM starts with
  `// @vitest-environment jsdom`. `src/test/renderApp.jsx` mounts the whole app on fresh mocks.

## Repository etiquette

- Remote: <https://github.com/xStarxLordx/telegraph> (public). Default branch on GitHub is
  `develop`, so PRs target it; `main` only receives delivery merges.
- **Account trap:** this machine's active `gh`/Git identity is a work account. The repo sets its
  author (`Francisco López <lopezfrancisco1506@gmail.com>`) and a credential helper that uses the
  `xStarxLordx` token in local `.git/config`. Never commit or push with the global identity, and
  never run `gh auth switch` for this repo. Use `GH_TOKEN=$(gh auth token -u xStarxLordx) gh ...`.
- Never commit, push or open a PR without the student's explicit confirmation.
- No AI signatures or `Co-Authored-By` trailers in commits; AI use is recorded in `bitacora.md`.
