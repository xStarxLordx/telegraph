# Telegraph

A clone of the social network X (formerly Twitter), built as a class project: a React
single-page application backed by Firebase. Users register, log in, publish short posts
("tweets", up to 280 characters), follow other users and read a feed of the people they follow.

The UI has two themes: **Brass & Soot**, a dark steampunk retro theme (the default), and
**Ivory Wash**, a light watercolor theme. It is available in Spanish (the default) and English.

## Features

The app has these pages:

| Route              | Page                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| `/login`           | Log in with username and password, or with Google                            |
| `/register`        | Create an account (full name, username, email, password)                     |
| `/choose-username` | First Google login: pick a username before entering the app                  |
| `/`                | Home: welcome and the "Tweet" link; followers / following gauges on the side |
| `/compose`         | Write a tweet with a live `n / 280` counter and publish it                   |
| `/feed`            | My tweets and those of the people I follow, newest first                     |
| `/following`       | People I follow, alphabetical by full name                                   |
| `/followers`       | My followers, alphabetical, with "Follow" for those I don't follow back      |
| `/users/:username` | A user's tweets, counters and a "Follow" button                              |

Every list shows 10 items per page. Private pages share a header with the logo, the logged-in
`@username`, logout, the theme toggle and the language switcher. Unknown URLs show a 404 page.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) (JavaScript)
- [React Router](https://reactrouter.com/) (declarative mode: `BrowserRouter` + `Routes`)
- [i18next](https://www.i18next.com/) + `react-i18next` for Spanish / English
- CSS Modules over the design tokens in `src/styles/tokens.css`
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (jsdom) for tests
- [Firebase](https://firebase.google.com/): Authentication and Cloud Firestore (from Milestone 2)

## Getting started

Requirements: Node.js 22+ and npm, and a Firebase project (see [Firebase setup](#firebase-setup)).

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase web config
npm run dev
```

Open <http://localhost:5173>. The app talks to Firebase (Authentication + Cloud Firestore) for
accounts, tweets and follows. If a `VITE_FIREBASE_*` variable is missing the app doesn't start:
the console names the missing variables.

The **mock services** in `src/services/mock/` (an in-memory copy of the backend with demo
data) are what the tests run on; the running app doesn't use them. Their demo accounts (`ada`,
password `telegraph`…) don't exist in Firebase.

## Firebase setup

1. In the [Firebase console](https://console.firebase.google.com/) create a project, add a
   **Web app**, enable **Authentication** (Email/Password and Google) and **Cloud Firestore**.
2. Copy the web app config into `.env.local` (see `.env.example`). It is not secret: the
   security rules protect the data.
3. Deploy the rules and indexes (`firebase.json` and `.firebaserc` already point at the project):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```

   Indexes take a few minutes to build; until then the lists fail with "requires an index".

### Data model

Three collections (`src/services/firebase/collections.js`); the rules are in `firestore.rules`.

| Collection / document id            | Fields                                                                                                  | Notes                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `users/{usernameLower}`             | `uid`, `fullName`, `username`, `email`, `createdAt`                                                     | The key makes a username unique and lets the login find the email of a username.                  |
| `tweets/{autoId}`                   | `authorId`, `authorFullName`, `authorUsername`, `body`, `createdAt`                                     | Author's name copied in, so a feed needs no joins. Never edited or deleted.                       |
| `follows/{followerId}_{followeeId}` | `followerId/Username/FullName/FullNameLower`, `followeeId/Username/FullName/FullNameLower`, `createdAt` | One document per follow: the id rules out duplicates. `...FullNameLower` is the alphabetical key. |

Decisions and trade-offs:

- **One document per account** (`users/{usernameLower}`) is the profile, the username claim and
  the login lookup. A profile is found by `uid` with a query, so signed-in users can list `users`.
- **Public read of one `users` document** exposes the email of a username you already know. It is
  needed to log in with a username, and accepted for this class project.
- **The rules cannot limit an account to one profile**, so a signed-in client could claim
  several usernames by writing to Firestore directly. Also accepted.
- **Copies of names are checked by the rules** against the author's profile (`get()`), so nobody
  can publish or follow under a name that isn't theirs, or follow a username nobody has.
- **Counters are never stored**: followers and following come from `getCountFromServer`, so they
  can't drift.
- **Timestamps come from the server** (`createdAt == request.time`), so they can't be forged
  from a client.

### Pagination and the feed

Firestore's web SDK has no offset, so every list is cursor-paginated: a page is
`startAfter(<last document shown>)` + `limit`, the cursor is that document's id, and the total
for "Page X of Y" comes from `getCountFromServer` (`src/services/firebase/paginateQuery.js`).

The feed is "my tweets + those of everyone I follow". Firestore allows at most 30 values in an
`in` filter, so the authors are split into chunks of 30 and every chunk is queried on its own.
All chunks share one order (newest first), so **one cursor serves all of them**: the last tweet
shown. Each page asks every chunk for up to 11 tweets after it, merges them, shows the 10
newest, and there is a next page when more than 10 came back. What a chunk didn't return can
only come after the last tweet shown, so nothing is skipped or repeated, even if the people I
follow change between pages.

Known limits: every page reads the whole list of people I follow (one read per follow) and
does one query and one count per chunk, so a feed costs more reads as the follow list grows.

### Demo data

`npm run seed` fills the project with a demo network: 42 accounts, 97 tweets and 200 follows.
It builds on the mock seed and adds people and tweets for every screen and edge case
(`scripts/demoData.js`; its tests run the real services over it). Every account has the
password `telegraph` and the email `<username>@telegraph.test`.

| Log in as          | To see                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| `ada`              | The full tour: 2 pages of following, followers and tweets, and followers to follow back |
| `telegrafista`     | A feed over 32 followed people (two `in` chunks)                                        |
| `diez`             | Exactly 10 tweets, followers and following: one page, no paging                         |
| `once`             | Exactly 11 of each: a second page with a single item                                    |
| `novato`           | A brand-new account: every empty state                                                  |
| `diez` → following | Two people named Mary Shelley (`mshelley`, `mshelley2`), ordered by username            |
| `Hypatia`          | A username stored with capitals; it is found in any case                                |

`ada` also has a 280-character tweet, one with emoji and one over several lines. Google
sign-in can't be seeded: try it with a real Google account.

```bash
npm run seed -- --dry-run   # show what would be written (needs no credentials)
npm run seed                # create everything (safe to repeat: ids are fixed)
npm run seed -- --clean     # delete the demo accounts and whatever they published or follow
```

The script uses the Admin SDK, which skips the security rules, so it needs a **service account
key** of the project in `.firebaserc` (Firebase console › Project settings › Service accounts ›
Generate new private key). Keep that file **outside the repository** (it is a secret; `.gitignore`
only catches the usual names) and point `GOOGLE_APPLICATION_CREDENTIALS` at it:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run seed
```

It refuses a key from another project, and stops without writing if a real account already uses
one of the demo usernames or emails. `--clean` only touches accounts whose uid starts with
`demo-`. Mind that the demo accounts are real Firebase Authentication accounts with a published
password: run `--clean` when the demo is over.

## Scripts

| Script                 | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Start the development server                                          |
| `npm run build`        | Build for production into `dist/`                                     |
| `npm run preview`      | Preview the production build                                          |
| `npm run lint`         | Lint the source code                                                  |
| `npm run lint:fix`     | Lint and auto-fix what ESLint can                                     |
| `npm run format`       | Format every file with Prettier                                       |
| `npm run format:check` | Check formatting without writing                                      |
| `npm run seed`         | Load / remove the demo data in Firebase (see [Demo data](#demo-data)) |
| `npm test`             | Run the test suite once (Vitest)                                      |
| `npm run test:watch`   | Run tests in watch mode                                               |

## Architecture

```text
src/
├── domain/      Pure business rules: limits, validation, sort keys, ServiceError codes
├── services/    Service contracts, the ServicesProvider and their implementations
│   ├── firebase/ Firebase implementation: Auth + Firestore, pagination helper
│   └── mock/    In-memory implementation with demo data, used by the tests
├── auth/        AuthProvider + useAuth: the session, mirrored from authService
├── social/      SocialProvider + useSocial: follow actions shared by every screen
├── theme/       ThemeProvider, useTheme and the saved theme preference
├── i18n/        i18next setup, es/en translations and error-code messages
├── hooks/       Data and form hooks (usePaginatedList, useForm, useFollowCounts…)
├── components/  Reusable UI components, one folder each with its CSS Module
├── layouts/     AuthLayout (public pages) and AppLayout (header · nav · page · gauges)
├── routes/      Route table, paths and guards (RequireAuth, PublicOnly)
├── pages/       One component per route
├── styles/      Design tokens (tokens.css) and global styles
├── utils/       Generic helpers (storage, date formatting)
└── test/        Test helpers (renderApp: the whole app on mocks at a given URL)
```

Data flows one way: **pages → hooks → services**. Pages and components never import Firebase or
the mock data, and business logic stays out of JSX.

- The UI talks to four services (`authService`, `userService`, `tweetService`,
  `followService`) through `useServices()`. Their contracts are documented in
  `src/services/contracts.js`. Every method is async and every list is cursor-paginated:
  `{ items, nextCursor, total }`.
- `src/services/createAppServices.js` is the only place that picks an implementation: Firebase
  for the running app, the mocks for the tests. No component knows which one it talks to.
- Business failures throw a `ServiceError` with a stable `code` (for example
  `follow/already-following`), which the UI translates.
- Validation and limits (280 characters counted in code points, username format, alphabetical sort
  keys) live in `src/domain/`, so the mocks and Firebase enforce the same rules.
- Colors exist only in `src/styles/tokens.css`, as CSS custom properties (see
  [the design system](docs/design-system.md)). A theme only changes their values: `data-theme`
  on `<html>` selects the palette, dark by default. An inline script in `index.html` applies the
  saved theme (`localStorage` key `telegraph.theme`) before React mounts, so the page never
  flashes the wrong theme. Components style themselves with CSS Modules.
- Lists use `usePaginatedList(fetchPage)`, which keeps a stack of cursors for Previous / Next and
  feeds `PagedList` (spinner, error with retry, empty state, "Page X of Y").
- After a follow, `SocialProvider` bumps a version that makes counters and Follow buttons reload,
  so every part of the screen agrees without a page reload.
- Every visible string goes through i18next (`src/i18n/locales/es.json` and `en.json`, same
  keys; a test checks it). Error codes map to `errors.<code>` messages. The language choice is
  saved in `localStorage` (`telegraph.language`) and kept in sync with `<html lang>`.
- Accessibility: labelled inputs with linked error messages, a skip link, visible focus rings,
  touch targets of at least 44 px and keyboard-only flows; no horizontal scroll at 360 px. Text
  colors keep a contrast of at least 4.5:1 in both themes.

## Testing

`npm test` runs unit tests (domain rules, mock services, `usePaginatedList`, translations,
`TweetCard`) and integration tests that render the whole app on mock services with Testing
Library: route guards, login and logout, Google onboarding, publishing, following and the
paginated lists. Tests that need a DOM declare `// @vitest-environment jsdom` at the top.

The Firebase services are tested against `src/test/fakeFirestore.js`, an in-memory Firestore
that orders, filters and pages like the real one and **rejects** what Firestore rejects when a
query runs: more than 30 values in an `in`, and a query whose composite index is missing from
`firestore.indexes.json`. It does **not** run the security rules (they need the Firebase
emulator): `firestoreRules.test.js` only checks that the rules' fields and limits match the
code. Tests never contact a Firebase project.

## Code style

The project follows the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript),
enforced by ESLint, with Prettier owning formatting.

- **ESLint 9** (`maintenance` line) with
  [`eslint-config-airbnb-extended`](https://eslint-airbnb-extended.nishargshah.dev/), the
  flat-config port of the official Airbnb rules (base, React, JSX a11y and hooks). The official
  `eslint-config-airbnb` only supports ESLint 7/8, which are end-of-life, and
  `airbnb-extended` doesn't support ESLint 10 yet. Upgrade ESLint once it does.
- The React 17+ JSX runtime preset disables `react/react-in-jsx-scope`. `eslint-plugin-react-refresh`
  guards Vite's hot reload.
- `react/require-default-props` is set to `defaultArguments`: React 19 ignores `defaultProps` on
  function components, so optional props get their defaults when destructuring.
- **Prettier 3** (`.prettierrc.json`: single quotes, semicolons, trailing commas, 100 columns,
  LF) runs last through `eslint-config-prettier`, so the two tools never disagree.
- `npm audit` reports 4 high-severity advisories, all from `@grpc/grpc-js` ≤ 1.13.5, which
  `firebase` pins (`@firebase/firestore` depends on `~1.9`; `firebase` 13.1.0 is the latest). They
  concern gRPC server code that only Node loads: the browser bundle doesn't contain it. They are
  there since Firebase was added, and there is nothing to upgrade to yet. Don't run
  `npm audit fix --force`: it downgrades `firebase` to 9.x. Revisit when a newer `firebase`
  moves to a patched `@grpc/grpc-js`.

## Project documentation

- [Milestone 1 — Layout & SPA](docs/milestone-1.md)
- [Milestone 2 — User features & tweet publishing](docs/milestone-2.md)
- [Milestone 3 — Following features & lists](docs/milestone-3.md)
- [Design system](docs/design-system.md)
- [AI usage log](bitacora.md)

## Contributing

- Branches: `main` holds the delivered versions and `develop` is for integration. Work happens
  on `feature/<task-id>-<slug>` or `fix/<slug>`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- Every change reaches `develop` through a pull request (see the PR template).
