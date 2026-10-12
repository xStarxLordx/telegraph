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

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the source code |

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

<!-- Sections to complete in later tasks: architecture (M1-03), linting (M1-02),
     Firebase setup and data model (M2-01, M2-02), feed limitations (M2-12). -->
