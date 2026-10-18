# Telegraph

A clone of the social network X (formerly Twitter), built as a class project: a React
single-page application backed by Firebase. Users register, log in, publish short posts
("tweets", up to 280 characters), follow other users and read a feed of the people they follow.

The UI has two themes: **Brass & Soot**, a dark steampunk retro theme (the default), and
**Ivory Wash**, a light watercolor theme. It is available in Spanish (the default) and English.

## Features

Milestone 1 delivers every page of the app on mock data:

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

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Until Milestone 2 connects Firebase, the app runs on **mock
services** with demo data:

- Every demo account uses the password `telegraph`. Try `ada`, who has the most data (every list
  has two or more pages).
- "Continue with Google" logs in a demo Google account, which first has to choose a username.
- Changes are kept in the browser's `localStorage`; delete the `telegraph.mock.v1` key to restore
  the demo data. Use a single tab: the mock storage isn't synced between tabs.
- The mocks add 300 ms of latency on purpose, so loading states are visible.

## Scripts

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the development server      |
| `npm run build`        | Build for production into `dist/` |
| `npm run preview`      | Preview the production build      |
| `npm run lint`         | Lint the source code              |
| `npm run lint:fix`     | Lint and auto-fix what ESLint can |
| `npm run format`       | Format every file with Prettier   |
| `npm run format:check` | Check formatting without writing  |
| `npm test`             | Run the test suite once (Vitest)  |
| `npm run test:watch`   | Run tests in watch mode           |

## Architecture

```text
src/
├── domain/      Pure business rules: limits, validation, sort keys, ServiceError codes
├── services/    Service contracts, the ServicesProvider and their implementations
│   └── mock/    In-memory implementation with demo data (Milestone 1)
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
- `src/services/createAppServices.js` is the only place that picks an implementation. Milestone 2
  replaces the mocks with Firebase there, and no component changes.
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
- `npm audit` reports high-severity advisories in `braces`, pulled in through
  `@next/eslint-plugin-next`, a dependency of the Airbnb config. They affect **dev tooling only**:
  `npm audit --omit=dev` is clean. Don't run `npm audit fix --force`, because it downgrades the
  Airbnb config to an unusable 0.1.x.

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

<!-- Sections to complete in later tasks: Firebase setup and data model (M2-01, M2-02),
     feed limitations (M2-12). -->
