# Agaram: IAS Officer Portal (front end)

One portal for an IAS officer, built from two older systems: **Agaram** (the department's service record) and **Agaram dev** (the officers' community). It has two sections, **Records & Requests** and **Community**, joined by a shared **Home**. Everything runs on fictional mock data behind a thin repository layer. No real sign-in, back end, email or SMS.

> **Demo only.** The mock session and mock data are kept in browser storage (`localStorage`). Do not use real credentials or real personal data.

The interface is built on the **UX4G** design system (default theme, `ux4g-web-components` from npm). English with a Tamil-ready catalogue. Mobile first (320 px) up to wide desktop (1440 px).

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

Sign in with any non-empty email or officer ID and any password.

| Command                | What it does                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `npm run check`        | Lint, format check, typecheck and all tests (one command)                                  |
| `npm test`             | Tests only                                                                                 |
| `npm run build`        | Production build into `dist/` (clean URLs, needs a host that serves `index.html` for 404s) |
| `npm run build:static` | Production build into `dist-static/` with hash URLs. Works from any static host or folder  |
| `npm run preview`      | Serves `dist/` (default port 4173). Needed for the browser tests                           |
| `npm run e2e`          | The 14 browser flows (needs Playwright; `VIEWPORT=390x800 npm run e2e` for a phone)        |
| `npm run i18n:missing` | Lists message keys that have no Tamil value yet                                            |

## Routes

`/login`, `/home`, `/records` (home, `/profile`, `/services`, `/services/:card`, `/services/:card/new`, `/services/:card/add-past`, `/downloads`, `/requests/:id`), `/community` (home, `/proposals`, `/discourse`, `/colleagues`, `/capacity-building`, `/beyond-the-file`, `/awards` and their detail and new pages), `/notifications`, `/search`. Any other path shows the friendly 404 page. The list is `src/config/routes.ts`.

## Demo controls and test switches

- `?demo=1` opens the floating **Demo controls** panel (remembered for the tab): language, **Reset demo data**, **Force loading / empty / error**, and the Under Secretary's decision on a request waiting for approval: **Approve**, **Return (with a reason)**, **Reject (with a reason)**, plus **Create sample returned request**.
- `/dev/components?demo=1` is the component gallery.
- `?pseudo=1` stretches every string by about 35 percent and wraps it in brackets to check layouts.

## How the portal is built

```
src/app          shell (accessibility bar, top bar, bottom bar, Me sheet, footer), router, auth guard, demo controls
src/features     auth, home, records, community, people, learn, notifications, search, requests (shared form pieces)
src/components   shared components written as UX4G markup, and form fields
src/domain       types, statuses, dates, request rules, sanitiser (pure, tested)
src/data         repository (api.ts), seed data, in-browser store, query hooks
src/config       routes, nav, labels, feature flags, request types, service cards
src/i18n         en and ta catalogues, one file per namespace
src/styles       app.css: the small set of rules UX4G does not provide (each is commented)
src/test         unit, component, route, accessibility and copy tests
e2e              the 14 flows as browser tests
```

### The request and approval engine

Every change an officer makes to their record is a **request**, approved by one person: the Under Secretary. There are 8 types, each one entry in `src/config/requests.ts`: `leave`, `ltc`, `medical`, `gpf`, `posting`, `promotion`, `profile-edit`, `correction`. A request has a mode (`apply`, `past`, `record`) and a source (`portal` or `paper`), and moves through 6 statuses: draft, submitted ("Waiting for approval"), returned, approved, rejected, withdrawn. **Nothing changes the record until approval.** Approval effects (add the leave and reduce the balance, add a career entry, write a profile field, and so on) are in `applyApproval` in `src/data/api.ts`. While a profile, posting, promotion or correction request is waiting, the page keeps the old value and shows **Change pending** with "You asked for: ...".

Locked fields are enforced in the data layer, not only in the interface: a `profile-edit` that names a locked field is refused (`locked-field`), and only one pending change per field is allowed. See `features.profile.fieldAccess` and the tests in `src/test/domain.test.ts`.

### Adding a service card (config only)

My Services is built from `services.cards` (`src/config/services.ts`). A card needs one entry there and one request type in `src/config/requests.ts`. No page component changes: the page, the history table, the Apply and Add a past forms, the New request menu, the past-record chooser, the request page and the approval effect all read the config. Worked example, a Foreign Visit card:

```ts
// src/config/requests.ts, in REQUEST_TYPES
{
  key: 'foreign-visit', kind: 'service', cardKey: 'foreign-visit',
  label: 'Apply for a foreign visit', cardName: 'Foreign Visit', icon: 'plane',
  modes: ['apply', 'past'], orderBlock: true, proofRequiredFor: ['past'],
  fields: [
    { name: 'country', kind: 'text', label: 'Country', required: true },
    { name: 'dates', kind: 'dateRange', label: 'From and to', required: true },
  ],
  documents: [], rules: ['noOverlap'],
  title: (v) => `Foreign visit, ${rangeTitle(v.dates)}`,
},

// src/config/services.ts, in SERVICE_CARDS
{
  key: 'foreign-visit', title: 'Foreign Visit', headline: 'Foreign Visit',
  tagline: 'Your visits abroad.', icon: 'plane', formKey: 'foreign-visit',
  main: 'Apply for a visit', pastLabel: 'Add a past visit',
  summary: (rows) => `${rows.length} visits recorded`,
  strip: (rows) => `${rows.length} visits recorded.`,
  columns: [
    { key: 'country', header: 'Country', mobile: 'title' },
    { key: 'from', header: 'From', kind: 'date' },
    { key: 'to', header: 'To', kind: 'date' },
    { key: 'status', header: 'Status', kind: 'status' },
    { key: 'source', header: 'Source', kind: 'source' },
  ],
},
```

`src/test/services.test.tsx` adds exactly this card at run time and checks it end to end. Entries of a card without a list of its own are kept in `db.serviceRecords[card]` and read with `api.cardRows(card)`.

### Rearranging Home

Home is provisional. Its sections come from `features.home.sections` in `src/config/features.ts`: an ordered list of `{ key, enabled }`. To reorder, move entries; to hide one, set `enabled: false`. The keys map to components in `HOME_SECTIONS` (`src/features/home/HomePage.tsx`); a new section is one component plus one entry. `src/test/home.test.tsx` shows the reorder.

## Switchable options (`src/config/features.ts`)

| Setting                                          | Default                  | What it controls                                                             |
| ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------- |
| `LABELS` (`src/config/labels.ts`)                | the official names       | Every menu, page and tab name. Merged into the English catalogue as `nav.*`  |
| `nav.showHomeLink`                               | `false`                  | A visible "Home" link next to the two sections                               |
| `home.sections`, `home.quickActions`             | the seven sections       | Order, visibility of Home sections and the six tiles                         |
| `services.pastRecords`                           | leave, medical, GPF only | Which cards offer "Add a past ..."                                           |
| `profile.fieldAccess`                            | the lists in the spec    | Which profile fields are locked and which are editable                       |
| `requests.officerOrderDetails`                   | `optional`               | The order-details block on service forms: `optional`, `hidden` or `required` |
| `uploads.maxSizeMB`, `uploads.accept`            | `10`, pdf/jpg/png        | File limits for proofs. Community attachments keep 25 MB                     |
| `features.anonymousPosts`, `features.askSeniors` | `true`, `true`           | The two Discourse options                                                    |
| `community.pages`                                | all on                   | A page switched off leaves the menu and its route shows the 404 page         |
| `medical.concurrenceLabel`                       | "Medical concurrence"    | Label of the read-only column in Medical history                             |
| `i18n.defaultLocale`, `i18n.enabledLocales`      | `en`, `[en, ta]`         | Default language and whether the Tamil switch shows                          |
| `session.idleMinutes`                            | `20`                     | Time before the session warning                                              |

## Swapping the mock data layer for a real API

Pages never import mock data. They call hooks in `src/data/hooks.ts` (`useQ('requests')`, `useMut('saveRequest')`), which call the single object `api` in `src/data/api.ts`. To use a real back end:

1. Write a second object with the same method names and return types (the types are in `src/domain/types.ts`).
2. Point `api` at it (one import in `src/data/hooks.ts`).
3. Move the rules that `api.ts` enforces to the server: locked fields, one pending change per field, anonymous authors, the colleague privacy filtering (religion and caste never leave the signed-in officer's own record), and the approval effects.
4. Replace `src/data/store.ts` session handling with real authentication.

## Tamil

Every key in `src/i18n/en/*.json` has a matching key in `src/i18n/ta/*.json` with an empty value, so the interface falls back to English. The department supplies the Tamil text. Do not machine-translate it. Official documents (circulars, GOs, rules) stay in their original language.

## UX4G usage

- **Delivery:** the npm package `ux4g-web-components@3.0.2`, CSS only (`import 'ux4g-web-components/styles.css'` in `src/main.tsx`). Its JavaScript is not used: dropdowns, tabs, dialogs, accordions, toasts and menus are React components that render the UX4G classes and add keyboard and focus behaviour.
- **Theme:** the default UX4G theme. No colour overrides. UX4G's dark theme exists but is not switched on.
- **Build size:** the package stylesheet is 8.4 MB as shipped because it embeds seven fonts as base64. `vite.config.ts` slims it for production only (unused rules purged, text fonts dropped, the one icon font served from `public/fonts`): about 220 KB CSS (36 KB gzip) plus a 339 KB cached icon font. Noto Sans, Noto Sans Display and Noto Sans Tamil load from Google Fonts (`index.html`). If you build classes from parts (`` `ux4g-x-${y}` ``), add the pattern to the safelist in `vite.config.ts`.
- **Custom CSS:** `src/styles/app.css` holds only what UX4G has no class or utility for. Each block has a comment saying why.
- **Docs vs package:** where the UX4G README markup and the shipped CSS differ, the CSS decided. Things that bit: sizes are `-s/-m/-l` (not `-sm/-md`); `ux4g-gap-*` utilities are the section scale (24 px and up), so element gaps use the `gap-*` classes in `app.css`; checkboxes use `ux4g-checkbox-control`; the accordion header is a wrapper around `ux4g-accordion__button`; the grid display class is `ux4g-grid`.

## Browser tests (the fourteen flows)

```bash
npm run build && npm run preview -- --port 4173   # one terminal
npm run e2e                                         # another (needs Playwright installed)
VIEWPORT=390x800 npm run e2e                        # same flows at phone width
```

The flows follow section 8 of the v2 spec: apply for leave, add a past leave, edit a profile field, Career, LTC, medical and GPF, fix a returned request, withdraw, submit a proposal, start a discussion anonymously, find a person or a subject, Capacity Building, Home and search and the bell, Downloads and password and sign-out.

## Tests

`npm run check` runs 150+ tests: every route renders with its exact headline; WCAG checks (axe) on every page at 360 and 1280 px; the request lifecycle through the repository (approval effects, locked fields, pending changes, past records); the config-only card and the Home reorder; overlap, balance, title and transition rules; the privacy rules; and a scan for every forbidden word.

## Stubbed or simulated

- **The Under Secretary's decision** (approve, return, reject) is simulated with the demo controls.
- **Targeted delivery of "Ask my seniors"** is a flag on the post; nobody is notified.
- **File storage:** uploads keep only file names and sizes; "View" opens a sample PDF.
- **Email, SMS and real notifications:** the bell reads the mock store.
- **Sign-in and Change Password:** checked in the browser, nothing is stored.
- **Sharing settings** and the Knowledge hub, My Desk, Account page: removed in this version.

## Questions for the product owner

1. What exactly do the Downloads lists **DRO** and **Important Updates** contain, and who needs to see them? (They hold sample rows for now.)
2. Should officers ever be able to change their mobile number or the spelling of their name themselves, or should that stay with the department?
3. Should Home show circulars (Downloads) or Community highlights first?
4. Which services should become the next cards after Leave, LTC, Medical and GPF (for example Foreign Visit, House Building Advance, Property)?
5. Should a second approval stage (for example a section officer) be added later, before the Under Secretary?
6. Is the "Medical concurrence" column to be kept, and what is its right name?
