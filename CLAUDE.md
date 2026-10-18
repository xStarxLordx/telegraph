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
  M1 ships mock implementations; M2 swaps in Firebase ones without changing components.
  The contracts live in `src/services/contracts.js`, and `src/services/createAppServices.js`
  is the only place that picks an implementation.
- Business rules (validation, limits, sort keys) are pure functions in `src/domain/`, shared by
  every implementation. Failures throw `ServiceError` with a `code`; the UI translates the
  code and never parses messages.
- Lists are **cursor-paginated** in the contract (`{ items, nextCursor, total }`), so the UI
  never slices arrays and Firestore can use `startAfter`.
- Write methods take the acting user's id, and it must be the logged-in user
  (`PERMISSION_DENIED` otherwise). The mock enforces it because the Firestore rules will.
- Mock data persists in `localStorage` (`telegraph.mock.v1`). All demo accounts use the password
  `telegraph` (e.g. `@ada`). Remove that key to go back to the seed. One tab at a time:
  two tabs writing at once overwrite each other (mock-only limitation).
- Colors, fonts, radii: CSS custom properties from `design-system.md` only. Themes switch with
  `data-theme` on `<html>`, dark by default.
- **One app, two palettes:** a theme changes only color-token values. Never branch markup, icons,
  fonts or shapes on the theme (the sun/moon toggle icon is the only exception).
- Follows go through `useSocial().follow` (or `useFollowUser`), never straight to
  `followService.follow`: it bumps the version that makes counters and Follow buttons reload.
- Redirects after login, register and logout belong to the route guards (`src/routes/guards.jsx`):
  auth pages only call the service and let `PublicOnly` / `RequireAuth` react to the session.

## Traps (non-obvious)

- **Firebase Auth has no username login.** Resolve `usernames/{usernameLower}` → email first
  (M2-05). Google users have no username: force the onboarding step (M2-06).
- **Auth calls can't run inside a Firestore transaction.** Registration = create the Auth user,
  then claim the username in a transaction, and delete the Auth user if the claim fails (M2-04).
- **Firestore `in` accepts at most 30 values**, so the feed queries authors in chunks and merges
  the results (M2-12).
- **No offset pagination in the Firestore web SDK.** Use cursors (`startAfter`) plus
  `getCountFromServer` for "Page X of Y" (M3-01).
- Firebase web config goes in `.env.local` as `VITE_FIREBASE_*` (no `VITE_` prefix means
  `undefined` at runtime). The config isn't secret: **security rules** protect the data.
- **Tweet length:** JS `.length` counts UTF-16 units (an emoji counts 2). Count with
  `[...text].length` (code points) in the UI and the service, and check with the emulator what
  the rules' `size()` returns for emoji before trusting the three limits to agree (M2-13).
- **Feed pagination over chunked queries:** keep one cursor per chunk. Each page fetches up to
  10 from every chunk, merges them, keeps the 10 newest and advances only the cursors it
  consumed (M2-12).
- **ESLint stays on 9.x.** Airbnb comes from `eslint-config-airbnb-extended`, which doesn't support
  ESLint 10 yet. The official `eslint-config-airbnb` is stuck on ESLint 8. Never run
  `npm audit fix --force`: it downgrades the Airbnb config. The `braces` advisories are dev-only
  (see README › Code style).
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
