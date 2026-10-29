# Agaram: IAS Officer Portal (front end)

A clickable front end for the Tamil Nadu IAS officer portal, driven by mock data. No real authentication, back end, email or SMS.

> **Demo only.** The mock session and mock data will be kept in browser storage. Do not use real credentials or real personal data.

## Status

Phase 0 (scaffold) is done: every route shows its exact headline as a placeholder. See `DECISIONS.md`.

## Run, test, build

```bash
npm install
npm run dev        # start the dev server
npm run check      # lint, format check, typecheck and tests, in one command
npm test           # tests only
npm run build      # production build into dist/
npm run i18n:missing   # list message keys with no Tamil value
```

## Demo controls and test switches

- `?demo=1` opens the floating demo panel (language switch now; reset, force loading/empty/error and Advance request arrive in later phases).
- `?pseudo=1` stretches every string by about 35 percent and wraps it in brackets, to check layouts.

## Structure

```
src/app         shell, router, 404
src/features    home, file, requests, community, people, learn, library, desk, notifications, search, account, auth
src/components  shared components
src/domain      types, enums, pure helpers
src/data        repositories, mock implementation, seed data
src/config      routes, feature flags
src/i18n        en and ta catalogues, one file per namespace
src/styles      tokens and global styles from design.md
```

## Feature flags (`src/config/features.ts`)

`nav.items`, `home.quickActions`, `home.heroImage`, `features.anonymousPosts`, `features.askSeniors`, `privacy.sharePhoneDefault`, `privacy.shareEmailDefault`, `pages.awards`, `pages.experts`, `pages.resources`, `pages.knowledge`, `i18n.defaultLocale`, `i18n.enabledLocales`, `knowledge.handoverNotesVisibility`, `uploads.maxSizeMB`, `uploads.accept`, `session.idleMinutes`, `ideas.statuses`, `requests.uploadOnlyOption`.

## Swapping the mock data layer for a real API

Added in phase 2. Pages call repository interfaces in `src/data` only through hooks, so a real API means writing a second implementation of each interface and changing the one place that picks the implementation.
