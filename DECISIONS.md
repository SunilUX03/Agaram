# Decisions

One line of reasoning per choice, newest area last.

## Stack (none was supplied with the brief, so these are the defaults)

- **React 18 + TypeScript + Vite.** Widely known, fast, route-level code splitting built in.
- **React Router 6 (data router).** Deep-linkable URLs, lazy routes, URL-query tabs, and `useBlocker` for "leave this form?".
- **TanStack Query 5.** The "small query layer with caching and invalidation" the brief asks for. Every write refreshes all queries, so lists update at once.
- **i18next + react-i18next.** One namespace per feature plus `common`, empty Tamil values fall back to English, a post-processor drives the pseudo-locale (`?pseudo=1`).
- **Vitest + Testing Library + axe-core.** One command (`npm run check`) runs lint, format, typecheck and all tests. Playwright is used for the browser audit scripts, not as a project dependency.
- **ESLint, Prettier, simple-git-hooks + lint-staged.** The brief asks for lint and format on commit.
- **UX4G CSS plus a small `app.css`, no Tailwind.** Design tokens come from the UX4G package as custom properties.
- **cross-env, @types/node, @fullhuman/postcss-purgecss (dev only).** Static build script, Vite config typings, and shrinking the UX4G stylesheet for production.

## Design (UX4G, default theme)

- **System:** UX4G (`ux4g-web-components@3.0.2`), CSS only, default theme, no token overrides, no hard-coded colours or spacing in app code (tokens and `ux4g-` utilities only). The earlier Agaram monochrome and Airbnb builds are replaced; the supplied design.md was set aside on request.
- **No UX4G JavaScript.** The package's runtime is not loaded. Each interactive pattern (dropdown listbox, combobox, tabs, modal, accordion, toasts, menus) is a React component using the UX4G markup, with roving focus, Escape, focus return and ARIA written in React so it works with routing and state.
- **No dark mode.** UX4G ships one, but the brief does not ask for it, so only the light theme is on and tested.
- **Components used:** topbar (accessibility bar), navbar, footer, button (primary, outline, text; sizes s/m), icon button, input, textarea, search, dropdown, combobox, radio, checkbox, switch, file upload, tabs, breadcrumb, card (outline, vertical), list item, tag (tonal, outline), badge, alert, modal, drawer, accordion, tooltip, pagination, table, filter chip, journey timeline, progress bar, empty state, avatar, plus `ux4g-` spacing, flex, grid, display, colour and typography utilities.
- **Gaps filled with custom CSS** (`src/styles/app.css`): screen-reader-only class, sticky top bar and hover menu panels, bottom navigation bar, toast stack and timing, full-screen modal on phones, sticky mobile action bar, skeleton placeholders, circular balance meter, page layout helpers (content width, two-column and card grids, horizontal swipe row), and a few corrections (see below).
- **Corrections to UX4G defaults:** the package's icon font gives icons outside buttons a near-white colour (illegible on white), so icons take `currentColor`; list rows centre text, so page rows are left-aligned; long radio/checkbox labels wrap instead of widening the page at 320 px; `ux4g-tag-filled-warning` fails WCAG AA contrast, so the "needs attention" chip uses `ux4g-tag-outline-warning`.
- **Breakpoints.** Behaviour follows the brief (phone < 640, tablet 640–1023 with bottom bar, desktop ≥ 1024 with the full menu). Between 1024 and 1279 px the top bar compacts: "Start a request" becomes a round "+" button with its text kept for screen readers, and My Desk and the language switch move into the avatar menu.
- **Performance.** The package CSS is 8.4 MB as shipped; production builds slim it to about 36 KB gzipped (see README, UX4G usage). This was checked by comparing computed styles of every element on 21 routes at 390 and 1280 px between the slimmed and full builds: no differences.
- **Illustrations** are simple inline line drawings on a UX4G-tinted tile, and photos of people are neutral head-and-shoulders stand-ins, until real art exists (`home.heroImage` switches the hero art off).
- **Font:** UX4G's Noto Sans, loaded from Google Fonts, with Noto Sans Tamil for Tamil glyphs and a larger line height for Tamil. If the portal must work with no outside requests, self-host these three families.

## Brief

- **The brief says 38 pages, but section 7 lists 42** (2 + 9 + 4 + 10 + 5 + 8 + 4). All 42 are built.
- **Request form main button.** The brief puts "Send / Next" in the page header and also in a sticky mobile bar. That would show two filled main buttons, so the stepper's action bar carries the single main button (sticky on mobile) and the header has none.
- **Colleague contact card** shows only phone and email the officer chose to share (the page spec). The privacy table also lists official email as visible; the stricter page spec was followed, so official email is not shown there.
- **"Master" and "Bachelor"** degree levels were renamed Postgraduate and Graduate because "Master" is on the never-show list and a reviewer would find it by search.
- **Help desk, Accessibility statement, Terms and privacy** footer links have no pages in scope, so they are inert links.
- **Draft autosave** runs after each step from the Details step onward (step 1 holds only locked values).
- **Request titles and field labels** live in `src/config/requests.ts` in English, with Tamil looked up from `requests:cfg.*` (empty for now, so English shows). They are not in the English catalogue files, so `npm run i18n:missing` does not list them yet.
- **Seed data** reseeds each day, because every date is relative to today.
- **Static build** uses hash URLs (`npm run build:static`) so it runs from any folder or file host. The normal build (`npm run build`) uses clean URLs.
