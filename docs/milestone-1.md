# Milestone 1 — Layout & SPA Construction

> **Evaluated in:** first delivery (only this milestone) and again in the final delivery.
> **Source:** `Clon de X.pdf`, section "Milestone 1: Maquetación y Construcción de la SPA".
> **Goal:** every page of the app exists, is navigable and looks finished, running on
> **mocked data** behind service interfaces that Milestone 2 will swap for Firebase.

General rules `G-xx` are defined in [`../CLAUDE.md`](../CLAUDE.md#general-requirements-graded).
Visual spec: [`design-system.md`](design-system.md).

---

## Requirements (from the PDF)

| ID    | Requirement                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1.1  | **Registration page**: form with full name, username, email and password.                                                                              |
| R1.2  | **Login page**: form with username and password, plus sign-in with Google (or another provider).                                                       |
| R1.3  | **Home page**: a "Tweet" link to publish a new tweet; followers and following counters.                                                                |
| R1.4  | **Compose tweet page**: multiline text field and a "Publicar" button.                                                                                  |
| R1.5  | **Following list page**: users I follow, sorted alphabetically by full name, max 10 per page.                                                          |
| R1.6  | **Followers list page**: my followers, sorted alphabetically by full name, "Seguir" button for users I don't follow yet, max 10 per page.              |
| R1.7  | **User tweets page**: a user's tweets newest → oldest, max 10 per page, that user's followers/following counters, "Seguir" button if not followed yet. |
| R1.8  | **Feed page**: recent tweets from me and the users I follow, max 10 per page.                                                                          |
| R1.9  | **Common header**: logo/link back to home, logged-in username, logout link.                                                                            |
| R1.10 | Use hard-coded / mocked data to emulate features built in later milestones.                                                                            |

---

## Tasks

### M1-01 · Repository and project scaffold

**Description:** Create the Vite + React (JavaScript) project, run `git init`, create the GitHub
repository and push. Set up the branch model (`main` for deliveries, `develop` for integration,
`feature/<task-id>-<slug>` / `fix/<slug>` for work) and a pull-request template. Add `.gitignore`
(including `.env.local`), `react-router` (v8) and the base `npm` scripts, plus a README skeleton
that later tasks fill in (M1-19 completes it).
**Covers:** G-02, G-03.
**Depends on:** —
**Blocks:** every other task.
**Done when:** `npm run dev` serves the default page; the remote exists; `main` and `develop`
are pushed; the PR template appears when opening a PR.

### M1-02 · Linting and code style (Airbnb)

**Description:** Configure ESLint with the Airbnb JavaScript style guide (React + hooks rules) and
Prettier compatible with it. Add `npm run lint` and `npm run format`. Verify at setup time how
the Airbnb config works with the installed ESLint major version (flat config); pick the supported
path and record the choice in the README.
**Covers:** G-04.
**Depends on:** M1-01.
**Related:** M3-08 (final quality gate).
**Done when:** `npm run lint` passes on the scaffold and fails on a deliberately broken file.

### M1-03 · Architecture and mock service layer

**Description:** Define the folder structure (`pages/`, `components/`, `hooks/`, `services/`,
`i18n/`, `styles/`, `utils/`, plus `domain/` for pure business rules shared by every service
implementation) and the service contracts the UI depends on: `authService`,
`userService`, `tweetService`, `followService`. Implement them as **mock services** over in-memory
seed data (≈25 users, ≈40 tweets, follow relations, so every list shows more than one page).
Expose them through a `ServicesProvider` context so Milestone 2 swaps implementations without
touching components. Components never import data or Firebase directly.
**Covers:** R1.10, G-05.
**Depends on:** M1-01.
**Blocks:** M1-10 … M1-17. **Related:** M2-03 (Firebase implementations of the same contracts).
**Done when:** every service method used by the pages exists in the mock and returns
promises (same async shape as Firebase will have).

### M1-04 · Design tokens and theming (dark / light)

**Description:** Translate [`design-system.md`](design-system.md) into CSS custom properties under
`:root[data-theme="dark"]` and `:root[data-theme="light"]` (themes differ **only** in token
values: same fonts, icons and shapes), load the Google Fonts (Cinzel, Lora, Special Elite), create a `ThemeProvider` + `useTheme` hook and a theme toggle.
Dark is the default; the choice persists in `localStorage`. Set `data-theme` with an inline
script in `index.html` before React mounts, so there is no flash of the wrong theme.
**Covers:** G-08 (UX/UI), design brief.
**Depends on:** M1-01.
**Blocks:** M1-07, M1-08.
**Done when:** toggling switches every surface and color; reloading keeps the theme; no hex
colors appear outside the token file (`grep` check).

### M1-05 · Internationalization (es / en)

**Description:** Set up `react-i18next` with `es` (default) and `en` resource files, a language
detector that persists the choice, and a `LanguageSwitcher` (ES | EN) for the header and the
auth pages. All visible copy goes through `t()`. Dates in tweets use `Intl.DateTimeFormat` with
the active locale.
**Covers:** G-07.
**Depends on:** M1-01.
**Blocks:** every page task (they consume translation keys).
**Done when:** switching language changes all visible text on every page, with no hard-coded
strings left (review each page).

### M1-06 · Routing, layouts and route guards

**Description:** Configure React Router with the public routes (`/login`, `/register`) and the
private ones (`/`, `/compose`, `/feed`, `/following`, `/followers`, `/users/:username`) plus a
404 page. Create `AuthLayout` (auth pages) and `AppLayout` (header + nav + content).
`ProtectedRoute` reads the session from the mock `authService`, so the login → home → logout flow
works end to end.
**Covers:** R1.9 (navigation part), R1.10.
**Depends on:** M1-03.
**Blocks:** M1-07, M1-10 … M1-17. **Related:** M2-07 (real session).
**Done when:** visiting a private route while logged out redirects to `/login`; after mock
login every route renders; an unknown URL shows the 404 page.

### M1-07 · Common header

**Description:** Header with the Telegraph logo linking to home, the logged-in user's
`@username`, a logout link, the theme toggle and the language switcher. Responsive: wraps on
phone widths.
**Covers:** R1.9.
**Depends on:** M1-04, M1-05, M1-06.
**Done when:** it appears on every private page; logout returns to `/login`; it looks right at
360 px and at 1280 px in both themes.

### M1-08 · Shared UI components

**Description:** Build the reusable components used across pages: `Button` (primary /
secondary / ghost), `TextField` and `TextArea` with label and error, `Card`, `TweetCard`,
`UserListItem` (name, @username, optional Follow button), `Pagination` (Previous / "Page X of Y" /
Next), `CounterGauge` (followers / following), `Notice` / `Toast`, `EmptyState`, `Spinner`.
`TweetCard` **must** render the format from G-06.
**Covers:** G-05, G-06, G-08.
**Depends on:** M1-04, M1-05.
**Blocks:** M1-10 … M1-17.
**Done when:** each component is used at least once and renders correctly in both themes and
both languages.

### M1-09 · Pagination hook and tests

**Description:** Services return cursor pages (`{ items, nextCursor, total }`, see
`src/services/contracts.js`). Build a reusable `usePaginatedList(fetchPage)` hook that keeps a
stack of cursors and exposes `{ items, page, totalPages, hasNext, hasPrev, next, prev, loading,
error, reload }` with `PAGE_SIZE = 10`, so every list page and the `Pagination` component share
it. Test it (Vitest was set up in M1-03): empty list, exactly 10, 11, going forward and back,
reload after a mutation, and a failing fetch.
**Covers:** R1.5, R1.6, R1.7, R1.8, G-09.
**Depends on:** M1-03.
**Blocks:** M1-14 … M1-17. **Related:** M3-01 (Firestore cursors behind the same contract).
**Done when:** `npm test` passes and the edge cases above are covered.

### M1-10 · Registration page

**Description:** `/register` form with full name, username, email and password (plus
password confirmation). Client-side validation messages (required fields, email format,
password length, username characters) shown through `TextField` errors. On submit it calls
the mock `authService.register` and goes to home.
**Covers:** R1.1.
**Depends on:** M1-03, M1-05, M1-06, M1-08.
**Related:** M2-04 (real registration and uniqueness checks).
**Done when:** invalid input shows translated errors; valid input logs in the mock user.

### M1-11 · Login page

**Description:** `/login` form with username and password, a "Continue with Google" button and
a link to `/register`. Uses the mock `authService.loginWithUsername` and
`authService.loginWithGoogle`. Shows an error notice on wrong credentials.
**Covers:** R1.2.
**Depends on:** M1-03, M1-05, M1-06, M1-08.
**Related:** M2-05, M2-06.
**Done when:** a seeded user can log in; wrong credentials show the error; the Google button
logs in a mock Google user.

### M1-12 · Home page

**Description:** `/` shows a welcome block, a prominent **"Tweet"** link to `/compose`, and the
followers / following counters (`CounterGauge`) linking to `/followers` and `/following`. It
also reserves the slot for the "follow by username" form, built in M2-10.
**Covers:** R1.3.
**Depends on:** M1-03, M1-07, M1-08.
**Related:** M2-09 (real counters), M2-10.
**Done when:** the Tweet link navigates to `/compose`; the counters show mock values and link
to their lists.

### M1-13 · Compose tweet page

**Description:** `/compose` with a multiline `TextArea`, a live character counter (`n / 280`)
that changes color near and over the limit, and a **"Publicar"** button disabled when the text
is empty or over 280 characters. On submit it calls the mock `tweetService.publish` and shows a
success toast.
**Covers:** R1.4.
**Depends on:** M1-03, M1-05, M1-06, M1-08.
**Related:** M2-08 (real publishing and validation), G-10.
**Done when:** the counter counts code points (`[...text].length`, so an emoji counts 1); the button state follows the rules;
the new tweet appears at the top of the mock feed.

### M1-14 · Following list page

**Description:** `/following` lists the users I follow, sorted alphabetically by full name,
10 per page with `Pagination`. Each item links to `/users/:username`.
**Covers:** R1.5.
**Depends on:** M1-03, M1-05, M1-06, M1-08, M1-09.
**Related:** M3-02.
**Done when:** with the seed data there are at least 2 pages; the order is alphabetical across
pages, not just within one page.

### M1-15 · Followers list page

**Description:** `/followers` lists my followers, sorted alphabetically by full name, 10 per
page. Users I don't follow yet show a **"Seguir"** button (mock `followService.follow`) that
updates the item after the click.
**Covers:** R1.6.
**Depends on:** M1-03, M1-05, M1-06, M1-08, M1-09.
**Related:** M3-03.
**Done when:** only non-followed followers show the button; clicking it hides the button and
the following counter grows.

### M1-16 · User tweets page

**Description:** `/users/:username` shows the user's header (full name, @username),
followers / following counters, a **"Seguir"** button when I don't follow them yet (hidden on my
own profile), and their tweets newest → oldest, 10 per page.
**Covers:** R1.7.
**Depends on:** M1-03, M1-05, M1-06, M1-08, M1-09.
**Related:** M2-11, M3-04, M3-05.
**Done when:** it works for my profile and for another user's; an unknown username shows a
"user not found" state.

### M1-17 · Feed page

**Description:** `/feed` shows my tweets plus those of the users I follow, newest → oldest,
10 per page, with an empty state that suggests following someone.
**Covers:** R1.8.
**Depends on:** M1-03, M1-05, M1-06, M1-08, M1-09.
**Related:** M2-12.
**Done when:** tweets from users I don't follow never appear; the order holds across pages.

### M1-18 · Responsive and accessibility pass

**Description:** Review every page at 360, 768 and 1280 px in both themes: labels on every
input, keyboard navigation and visible focus, `aria-label` on icon-only buttons, ≥ 44 px touch
targets, text contrast ≥ 4.5:1 (tokens in `design-system.md` already meet it).
**Covers:** G-08.
**Depends on:** M1-10 … M1-17.
**Done when:** no horizontal scroll at 360 px; every flow can be completed with the keyboard
only.

### M1-19 · README and project documentation

**Description:** Write the README in English: what the app is, the stack, how to install and
run it, the scripts, the folder architecture, the branch/commit conventions and links to the
milestone docs.
**Covers:** G-05 (documentation), G-01.
**Depends on:** M1-01 … M1-18.
**Done when:** someone without context can clone, install and run the app following only the
README.

### M1-20 · AI log (`bitacora.md`)

**Description:** Keep `bitacora.md` in the repository root, append-only, committed **throughout**
the project (not in one final commit). Each entry: date and time, tool and model, the student's
message verbatim, a summary of the answer, and the files created or modified. Web chats: add
the shared link or the full export.
**Covers:** G-11.
**Depends on:** M1-01 (to version it).
**Related:** all tasks in all milestones (ongoing).
**Done when:** the file is in the first commits and grows with every AI session.

### M1-21 · First delivery release

**Description:** Merge `develop` → `main` through a PR, tag `v0.1.0`, and check the delivery
list: every R1.x requirement works, lint and tests are green, the README is up to date, and the
bitácora is committed.
**Covers:** R1.1 … R1.10, G-01 … G-12.
**Depends on:** M1-01 … M1-20.
**Done when:** the tag exists on `main` and every item in the tracking table below is marked.

---

## Tracking

Mark a task with `X` when it is done and write the date (`YYYY-MM-DD`). Notes are optional.

| Done | ID    | Task                                | Date       | Notes                                                                                                                                         |
| :--: | ----- | ----------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [X]  | M1-01 | Repository and project scaffold     | 2026-10-12 | Vite 8 + React 19 + react-router 8. Template ships oxlint; replace with ESLint + Airbnb in M1-02                                              |
| [X]  | M1-02 | Linting and code style (Airbnb)     | 2026-10-12 | ESLint 9 + eslint-config-airbnb-extended 3.3 + Prettier 3; Vite demo replaced by a placeholder                                                |
| [X]  | M1-03 | Architecture and mock service layer | 2026-10-12 | Cursor-paginated contracts, `src/domain/` rules, mocks persisted in localStorage, Vitest moved here (74 tests); reviewed by a Sonnet subagent |
| [X]  | M1-04 | Design tokens and theming           | 2026-10-18 | `src/styles/tokens.css` + `src/theme/`; inline script in `index.html`; verified in headless Chrome (toggle, reload, no hex outside tokens)    |
| [X]  | M1-05 | Internationalization (es / en)      | 2026-10-18 | react-i18next 17 + language detector (localStorage only, so new visitors get `es`); `errors.<code>` messages; key-parity test                 |
| [X]  | M1-06 | Routing, layouts and route guards   | 2026-10-18 | Declarative `BrowserRouter`; guards `RequireAuth` / `PublicOnly` / `RequireMissingUsername`; `AuthProvider` over `onAuthStateChanged`         |
| [X]  | M1-07 | Common header                       | 2026-10-18 | Brushed header; `@username` links to my tweets; checked at 360 and 1280 px in both themes                                                     |
| [X]  | M1-08 | Shared UI components                | 2026-10-18 | Plus `PagedList`, `PageHeader`, `Logo`, `LanguageSwitcher`; `ToastProvider` + `useToast`                                                      |
| [X]  | M1-09 | Pagination hook and tests           | 2026-10-18 | Cursor stack; loading derived from the settled request (`react-hooks/set-state-in-effect`); 9 tests, mutation-checked                         |
| [X]  | M1-10 | Registration page                   | 2026-10-18 | Domain validators + password confirmation; service field errors land on their field                                                           |
| [X]  | M1-11 | Login page                          | 2026-10-18 | Google demo account goes to `/choose-username` first (M2-06 UI built early on the mock)                                                       |
| [X]  | M1-12 | Home page                           | 2026-10-18 | Counters live in the app shell aside (`SocialPanel`), visible on Home                                                                         |
| [X]  | M1-13 | Compose tweet page                  | 2026-10-18 | Counter (trimmed, code points) warns at 20 left and blocks over 280; publishes, toasts and opens the feed                                     |
| [X]  | M1-14 | Following list page                 | 2026-10-18 | Integration test checks the order across both pages                                                                                           |
| [X]  | M1-15 | Followers list page                 | 2026-10-18 | Button only when the follow status is known to be false; counters refresh via `SocialProvider`                                                |
| [X]  | M1-16 | User tweets page                    | 2026-10-18 | Own profile: no button, counters link to my lists; other users' lists wait for M3-06                                                          |
| [X]  | M1-17 | Feed page                           | 2026-10-18 | Empty state links to my followers                                                                                                             |
| [X]  | M1-18 | Responsive and accessibility pass   | 2026-10-18 | Headless audit at 360/768/1280: 44 px targets, labels, one h1, no overflow; skip link; keyboard-only login; new color pairs ≥ 4.5:1           |
| [X]  | M1-19 | README and project documentation    | 2026-10-18 | Features, stack, setup, architecture, testing, code style                                                                                     |
| [ ]  | M1-20 | AI log (`bitacora.md`)              |            | Ongoing; started 2026-10-12, one entry per task or session                                                                                    |
| [ ]  | M1-21 | First delivery release              |            |                                                                                                                                               |
