# Decisions

One line of reasoning per choice. Newest at the bottom.

## Stack (none was supplied with the brief, so these are the defaults)

- **React 18 + TypeScript + Vite.** Widely known, fast dev server, route-level code splitting built in.
- **React Router 6.** Deep-linkable URLs, lazy routes, URL-query tabs.
- **TanStack Query 5.** The "small query layer with caching and invalidation" the brief asks for.
- **i18next + react-i18next.** Namespaces per feature plus `common`, empty-string fallback to English, and a post-processor for the pseudo-locale.
- **Vitest + Testing Library.** Same config as Vite; one command runs everything. Playwright is added in phase 4 for the flow tests (brief, section 12).
- **ESLint, Prettier, simple-git-hooks + lint-staged.** Brief requires "lint and format on commit".
- **Plain CSS with tokens, no Tailwind.** design.md defines tokens as CSS custom properties; using them directly avoids a dependency. Revisit if the team prefers Tailwind.
- **@types/node** (dev only) for the Vite config typings.

## Design

- Used the **App design system** from design.md (`navy`/`ink` tokens), not the editorial `ll-*` one: this is the authenticated product. Added `--on-navy` so filled elements flip text colour in dark mode without a per-selector allowlist.
- Dark mode is applied before first paint by `src/theme-init.ts`, as design.md requires.
- Fonts load from Google Fonts as design.md lists (Noto Sans, Noto Sans Tamil, JetBrains Mono).

## Brief

- **The brief says 38 pages but section 7 lists 42** (2 + 9 + 4 + 10 + 5 + 8 + 4). All 42 routes are built. The "38" is likely a stale count.
- Tamil catalogue keys exist with empty values, so the interface falls back to English. `npm run i18n:missing` lists them.
- Pseudo-locale: open any URL with `?pseudo=1`.
- Demo controls: open any URL with `?demo=1` (remembered for the tab session).
- Feature flags and pending decisions live in `src/config/features.ts`.
