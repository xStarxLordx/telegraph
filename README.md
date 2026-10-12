# Telegraph

A clone of the social network X (formerly Twitter), built as a class project: a React
single-page application backed by Firebase. Users register, log in, publish short posts
("tweets", up to 280 characters), follow other users and read a feed of the people they follow.

The UI has two themes: **Brass & Soot**, a dark steampunk retro theme (the default), and
**Ivory Wash**, a light watercolor theme. It is available in Spanish and English.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) (JavaScript)
- [React Router](https://reactrouter.com/)
- [Firebase](https://firebase.google.com/): Authentication and Cloud Firestore (from Milestone 2)

## Getting started

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Until Milestone 2 connects Firebase, the app runs on **mock services** with demo data. Every
demo account uses the password `telegraph`. Try `ada`, who has the most data. Changes are kept
in the browser's `localStorage`; delete the `telegraph.mock.v1` key to restore the demo data. Use a single tab: the mock
storage isn't synced between tabs.

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
├── utils/       Generic helpers (storage)
├── hooks/       React hooks (data access goes through useServices)
├── components/  Reusable UI components
├── pages/       One component per route
├── i18n/        Translations (es, en)
└── styles/      Design tokens and global styles
```

`hooks/`, `components/`, `pages/`, `i18n/` and `styles/` are created by the tasks that fill them
(M1-04 to M1-17).

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
