# Agaram: IAS Officer Portal (front end)

A working, clickable front end for the Tamil Nadu IAS officer portal. Everything runs on fictional mock data behind a thin repository layer. No real sign-in, back end, email or SMS.

> **Demo only.** The mock session and mock data are kept in browser storage (`localStorage`). Do not use real credentials or real personal data.

42 pages, one app shell, eight end-to-end flows, English with a Tamil-ready catalogue, built mobile first (320 px) up to wide desktop (1440 px). The interface is built on the **UX4G** (Government of India) design system, default theme, delivered from the `ux4g-web-components` npm package (see [UX4G usage](#ux4g-usage)).

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

Sign in with any non-empty email or officer ID and any password.

| Command                | What it does                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run check`        | Lint, format check, typecheck and all tests (one command)                                           |
| `npm test`             | Tests only                                                                                          |
| `npm run build`        | Production build into `dist/` (clean URLs, needs a host that serves `index.html` for unknown paths) |
| `npm run build:static` | Production build into `dist-static/` using hash URLs. Works from any static host or folder          |
| `npm run i18n:missing` | Lists message keys that have no Tamil value yet                                                     |

## Hosting

The normal build (`npm run build`, output `dist/`) uses clean URLs such as `/login`, so the host must serve `index.html` for any unknown path. `vercel.json` does this for Vercel (framework preset Vite, build command `npm run build`, output `dist`). On other hosts add the same rewrite, or use `npm run build:static`, which uses `#/` URLs and needs no setup.

## Demo controls and test switches

- `?demo=1` opens the floating **Demo controls** panel (remembered for the tab): language switch, **Reset demo data**, **Force loading / empty / error**, and **Advance request** (move any request to With the desk, Ready for approval, Returned, Approved or Not approved, with the matching notification).
- `/dev/components?demo=1` is the component gallery.
- `?pseudo=1` stretches every string by about 35 percent and wraps it in brackets to check layouts.

## Structure

```
src/app          shell (top bar, bottom bar, More sheet, footer), router, auth guard, demo controls
src/features     auth, home, file, requests, community, people, learn, library, desk, notifications, search, account
src/components   shared components (section 5 of the brief) written as UX4G markup, and form fields
src/domain       types, status enums, dates, request rules, sanitiser (pure, tested)
src/data         repository (api.ts), seed data, in-browser store, query hooks
src/config       routes, navigation, feature flags, request-type config, options
src/i18n         en and ta catalogues, one file per namespace
src/styles       app.css: the small set of rules UX4G does not provide (each is commented with its reason)
src/test         unit, component, route, accessibility and copy tests
```

## The request engine

All 17 request forms are generated from `src/config/requests.ts`: fields, files, rules, title templates. The engine builds the four steps (About you, Details, Documents, Review and send), validates, autosaves drafts, creates the request, and renders the review step and request page from the same config. Add a request type by adding one entry.

## Feature flags (`src/config/features.ts`)

`nav.items`, `home.quickActions`, `home.heroImage`, `features.anonymousPosts`, `features.askSeniors`, `privacy.sharePhoneDefault`, `privacy.shareEmailDefault`, `pages.awards`, `pages.experts`, `pages.resources`, `pages.knowledge`, `i18n.defaultLocale`, `i18n.enabledLocales`, `knowledge.handoverNotesVisibility`, `uploads.maxSizeMB`, `uploads.accept`, `session.idleMinutes`, `ideas.statuses`, `requests.uploadOnlyOption`.

## Swapping the mock data layer for a real API

Pages never import mock data. They call hooks in `src/data/hooks.ts` (`useQ('requests')`, `useMut('saveRequest')`), which call the single object `api` in `src/data/api.ts`. To use a real back end:

1. Write a second object with the same method names and return types (the types are in `src/domain/types.ts`).
2. Point `api` at it (one import in `src/data/hooks.ts`).
3. Move the privacy filtering in `api.ts` (colleagues, anonymous authors, search) to the server. The brief requires it be enforced in the data layer, not only hidden in pages.
4. Replace `src/data/store.ts` session handling with real authentication.

## UX4G usage

- **Delivery:** the npm package `ux4g-web-components@3.0.2`, CSS only (`import 'ux4g-web-components/styles.css'` in `src/main.tsx`). Its JavaScript is not used: dropdowns, tabs, dialogs, accordions, toasts and menus are React components that render the UX4G classes and add the keyboard and focus behaviour.
- **Theme:** the default UX4G theme. No colour overrides. `data-theme="light"` is set on `<html>`; UX4G's dark theme exists but is not switched on (the brief does not ask for it).
- **Build size:** the package stylesheet is 8.4 MB because it embeds seven fonts as base64. `vite.config.ts` slims it for production only: it removes unused rules with PurgeCSS (class names found in `src/` and `index.html`; rules with no class, or using `:is/:where/:not/:has`, are always kept), drops the embedded text fonts and four unused icon fonts, and serves the one icon font in use as `public/fonts/ux4g-material-icons-outlined.otf`. Result: about 220 KB CSS (36 KB gzip) plus a 339 KB cached icon font. Noto Sans, Noto Sans Display and Noto Sans Tamil load from Google Fonts (`index.html`). If you build classes from parts (`` `ux4g-x-${y}` ``), add the pattern to the safelist in `vite.config.ts`.
- **Custom CSS:** `src/styles/app.css` holds only what UX4G has no class or utility for (screen-reader-only text, sticky top bar and menu panels, bottom navigation, toasts stack, full-screen modal on phones, skeletons, balance ring, page-level layout helpers). Each block has a comment saying why.
- **Docs vs package:** the UX4G README markup is incomplete in places (input, textarea, search, breadcrumb, progress bar, journey timeline, filter chip). Where they differ, the shipped CSS decided the class names.

## Tamil

Every key in `src/i18n/en/*.json` has a matching key in `src/i18n/ta/*.json` with an empty value, so the interface falls back to English. The department supplies the Tamil text. Do not machine-translate it. Official documents (circulars, GOs, rules) stay in their original language.

## Browser tests (the eight flows)

```bash
npm run build && npm run preview -- --port 4173   # one terminal
npm run e2e                                         # another (needs Playwright installed)
VIEWPORT=390x800 npm run e2e                        # same flows at phone width
```

## Tests

`npm run check` runs 400+ tests: every route renders with its exact headline; WCAG checks (axe) on all 42 pages at 360 and 1280 px; overlap, balance, title, transition and privacy rules; the request lifecycle through the repository; and a scan for every "never show" word in section 10.
