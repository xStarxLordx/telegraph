# Milestone 3 — Following Features & Lists

> **Evaluated in:** final delivery (together with Milestones 1 and 2 and all general rules).
> **Source:** `Clon de X.pdf`, section "Milestone 3: Funcionalidades de Seguimiento y Listas".
> **Goal:** real, paginated follower / following lists for any user, follow actions from lists
> and profiles, and the final quality and UX pass before the last delivery.

General rules `G-xx` are defined in [`../CLAUDE.md`](../CLAUDE.md#general-requirements-graded).
Builds on [Milestone 1](milestone-1.md) (pages) and [Milestone 2](milestone-2.md) (Firebase services).

---

## Requirements (from the PDF)

| ID | Requirement |
|----|-------------|
| R3.1 | **Following list**: implement the logic to show the users I follow, with pagination. |
| R3.2 | **Followers list**: implement the logic to show my followers, with pagination. |
| R3.3 | Followers list: implement the "Seguir" button and the logic to follow a follower. |
| R3.4 | **User tweets page**: show that user's followers and following counters. |
| R3.5 | **User tweets page**: implement the "Seguir" button and the logic to follow that user. |
| R3.6 | **Any user's lists**: show the followers and following lists of a user, with pagination. |

Inherited constraints from M1: lists sorted alphabetically by full name (R1.5, R1.6), max 10
items per page (G-09).

---

## Tasks

### M3-01 · Server-side paginated query hook
**Description:** Firestore has no offset in the web SDK, so build a reusable
`usePaginatedQuery(baseQuery, { pageSize: 10 })` hook using cursors: `limit(pageSize)` plus
`startAfter(lastDoc)`, keeping a stack of cursors so "Previous" works. It gets the total with
`getCountFromServer` to show "Page X of Y". It returns
`{ items, page, totalPages, next, prev, loading, error }` with the same shape as the M1
`usePagination` hook, so the `Pagination` component doesn't change.
**Covers:** R3.1, R3.2, R3.6, G-09.
**Depends on:** M2-03, M1-09.
**Blocks:** M3-02, M3-03, M3-06. **Related:** M2-11 (the user tweets list moves to this hook); M2-12 (the feed keeps its own
multi-cursor paging but must return the same shape).
**Done when:** going forward and back through 3+ pages shows the right items with no duplicates
or gaps.

### M3-02 · Following list with real data
**Description:** `/following` queries `follows where followerId == me orderBy followeeFullNameLower`
through `usePaginatedQuery`. Each item links to `/users/:username`. Needs a composite index.
**Covers:** R3.1, R1.5.
**Depends on:** M3-01.
**Done when:** the order is alphabetical across all pages (accents and upper/lower case don't
break the order); pages hold 10 items.

### M3-03 · Followers list with real data and follow-back
**Description:** `/followers` queries `follows where followeeId == me orderBy followerFullNameLower`.
For the users on the current page, check in one batch which ones I already follow (`follows`
document IDs `me_their`) and show **"Seguir"** only for the rest. The button reuses
`followService.follow` (M2-10), with an optimistic update and rollback if it fails, and refreshes
the counters.
**Covers:** R3.2, R3.3, R1.6.
**Depends on:** M3-01, M2-10.
**Done when:** the button appears only for followers I don't follow; after clicking it the
button disappears, the "following" count grows by one, and reloading keeps the result.

### M3-04 · Counters on the user tweets page
**Description:** Reuse `useFollowCounts(uid)` (M2-09) on `/users/:username` for the viewed user.
The counters link to that user's lists (M3-06).
**Covers:** R3.4, R1.7.
**Depends on:** M2-09, M2-11.
**Done when:** the counters on any profile match Firestore and update after a follow.

### M3-05 · Follow from the user tweets page
**Description:** On `/users/:username`, show **"Seguir"** when I don't follow that user and it is
not my own profile. It uses `followService.follow`, updates the button and the viewed user's
followers counter.
**Covers:** R3.5, R1.7.
**Depends on:** M2-10, M3-04.
**Done when:** following from the profile hides the button and adds one follower; my own
profile never shows the button.

### M3-06 · Followers and following lists of any user
**Description:** Add routes `/users/:username/followers` and `/users/:username/following` that
reuse the list pages, parameterized by user (one `UserListPage` with a `mode` prop, not two copies
of the same code). `/followers` and `/following` become my own lists. "Seguir" buttons follow the
same rules as M3-03.
**Covers:** R3.6.
**Depends on:** M3-02, M3-03.
**Done when:** any user's lists are alphabetical and paginated, and reachable from that user's
counters.

### M3-07 · Final UX/UI polish
**Description:** Loading skeletons, empty states, error states with retry, consistent toasts,
subtle page transitions, a favicon and page titles per route, a final check against the
mockup and `design-system.md` in both themes and both languages. The PDF rewards creativity:
this is the differentiator.
**Covers:** G-08.
**Depends on:** M3-01 … M3-06.
**Done when:** no page shows a blank area while loading or a raw Firebase error.

### M3-08 · Final quality gate
**Description:** Lint with no errors, tests green, no hard-coded colors or copy, every name and
comment in English, consistent Airbnb style, README and docs updated, security rules reviewed,
`bitacora.md` complete with a history spread across the whole project, and a Git history with
feature branches, descriptive commits and reviewed PRs.
**Covers:** G-01 … G-12.
**Depends on:** M3-07.
**Done when:** each G-xx rule in `CLAUDE.md` has been checked one by one and the result noted
below.

### M3-09 · Final delivery release
**Description:** Merge `develop` → `main` through a PR, tag `v1.0.0` and (optionally) deploy to
Firebase Hosting for the demo. Run the whole flow once in production: register → login → tweet →
follow by username → lists → feeds → logout, in both languages and themes.
**Covers:** all R1.x, R2.x, R3.x and G-xx.
**Depends on:** M3-08, M1-21, M2-14.
**Done when:** the tag exists, the full flow works, and every tracking table in the three
milestone files is complete.

---

## Tracking

Mark a task with `X` when it is done and write the date (`YYYY-MM-DD`). Notes are optional.

| Done | ID | Task | Date | Notes |
|:----:|----|------|------|-------|
| [ ] | M3-01 | Server-side paginated query hook | | |
| [ ] | M3-02 | Following list with real data | | |
| [ ] | M3-03 | Followers list with real data and follow-back | | |
| [ ] | M3-04 | Counters on the user tweets page | | |
| [ ] | M3-05 | Follow from the user tweets page | | |
| [ ] | M3-06 | Followers and following lists of any user | | |
| [ ] | M3-07 | Final UX/UI polish | | |
| [ ] | M3-08 | Final quality gate | | |
| [ ] | M3-09 | Final delivery release | | |
