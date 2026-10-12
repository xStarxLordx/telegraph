# Telegraph — Design System

Visual reference for every UI task. Mockup (palettes, Feed and Login in both themes):
<https://claude.ai/artifact/HUXCqN3qrhiKpUyy8mtbP3>

**Brand:** Telegraph, a social network of short "dispatches", with a steampunk retro look.

## One app, two palettes

There is **one** visual language: the same layout, gear logo, icons, typefaces, radii, rivets,
frames, pressure-gauge counters and dashed tweet rules in both themes. **A theme only changes
the values of the color tokens below.** If a component needs a different shape, icon or font
per theme, the design is wrong: add or change a token instead.

- **Brass & Soot** (dark, default): brass and copper on soot, gaslight glow.
- **Ivory Wash** (light): indigo and sienna ink on ivory paper, with watercolor washes.

## Color tokens

| Token | Brass & Soot (dark) | Ivory Wash (light) | Use |
|-------|--------------------|--------------------|-----|
| `--color-bg` | `#14100C` Soot | `#FBF6EC` Ivory | Page background |
| `--color-surface` | `#1F1913` Walnut | `#FFFDF7` Cotton Paper | Cards, panels |
| `--color-surface-raised` | `#2B2219` Oiled Leather | `#F4ECDD` Cream Wash | Active nav item, secondary buttons |
| `--color-surface-sunken` | `#0E0B08` Coal | `#F7F1E5` Linen | Inputs, gauge faces |
| `--color-border` | `#5A4630` Tarnished Bronze | `#D9C7AA` Antique Edge | Borders, dividers, dashed tweet rules, small rivets |
| `--color-border-soft` | `#3A2D1F` | `#EADFCB` | Outer frame line, disabled borders |
| `--color-text` | `#F0E4CC` Parchment | `#2F2A25` Sepia Ink | Body text |
| `--color-text-muted` | `#B9A684` Faded Ledger | `#6E6357` Graphite | Labels, metadata, timestamps |
| `--color-text-disabled` | `#6E5E48` | `#A99C8C` | Disabled controls |
| `--color-primary` | `#D4A64A` Polished Brass | `#3D5A8C` Indigo Wash | Primary buttons, links, headings, logo |
| `--color-primary-hover` | `#F2C46D` Gaslight | `#2F4A75` Deep Indigo | Hover / focus, primary button edge |
| `--color-on-primary` | `#1A130C` | `#FFFDF7` | Text on primary fills |
| `--color-accent` | `#C9733C` Copper | `#B4532E` Burnt Sienna | `@username`, gauge needles |
| `--color-success` | `#5FA39A` Verdigris | `#4F7A55` Sap Green | Success notice border |
| `--color-success-bg` | `#15211F` | `#E3EDE1` | Success notice fill |
| `--color-success-text` | `#9FD3CB` | `#3B5E40` | Success notice text |
| `--color-danger` | `#E0674F` Furnace | `#A63D40` Madder Rose | Errors, over-limit counter |
| `--color-rivet` | `#D4A64A` | `#B89A6E` | Corner rivets on frames |
| `--color-gauge-ticks` | `#5A4630` | `#D2C0A3` | Gauge tick ring |
| `--color-header-stripe-a` / `-b` | `#2B2219` / `#271F17` | `#FFFDF7` / `#F8F1E3` | Brushed header texture |
| `--color-watermark` | `#2B2219` | `#EFE5D3` | Large background gears (auth pages) |
| `--color-wash-1/2/3` | `#D4A64A` / `#C9733C` / `#5FA39A` | `#C9D6EA` / `#EFC9B4` / `#D6E3CF` | Ambient blurred blobs behind content |
| `--wash-opacity` | `0.08` (gaslight glow) | `0.5` (watercolor) | Opacity of those blobs |

Contrast: text, muted text, primary and accent meet ≥ 4.5:1 on their theme's background and
surface. Keep that when adding a token.

## Typography (same in both themes)

| Role | Font | Notes |
|------|------|-------|
| Display / headings / buttons | **Cinzel** 500/700, letter-spacing 0.04–0.08em | Logo "TELEGRAPH", page titles |
| Body | **Lora** 400/600 | Tweets, forms, lists (16–17 px) |
| Meta / mono | **Special Elite** | `@username - date` lines, page counter, ES/EN switch |

Google Fonts: `Cinzel:wght@500;700`, `Lora:ital,wght@0,400;0,600;1,400`, `Special+Elite`.

## Shared details

- Gear logo, stroke icons (24 px grid, 1.8 px stroke), 6 px radii (8 px for panels).
- Frames: a hairline border plus an outer `outline` with `outline-offset`, with rivets in the corners.
- Brushed header: fine vertical stripes from `--color-header-stripe-a/-b`.
- **Pressure-gauge** counters for followers / following.
- **Tweet card:** dashed top and bottom rules, a nod to the `------` lines of the required format
  (G-06). The meta line uses Special Elite and the body uses Lora.
- Theme toggle: shows a sun in dark mode and a moon in light mode. It is the only icon that changes.

## Layout

- App shell: header + three columns (nav 200–240 px · main flexible · aside 260–320 px) in a
  1200 px max-width container; columns wrap on narrow screens.
- Touch targets ≥ 44 px; inputs ≥ 44 px high; visible focus ring in `--color-primary-hover`.
