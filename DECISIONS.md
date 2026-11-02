# Decisions

One line of reasoning per choice, newest area last.

## Stack (none was supplied with the brief, so these are the defaults)

- **React 18 + TypeScript + Vite.** Widely known, fast, route-level code splitting built in.
- **React Router 6 (data router).** Deep-linkable URLs, lazy routes, URL-query tabs, and `useBlocker` for "leave this form?".
- **TanStack Query 5.** The "small query layer with caching and invalidation" the brief asks for. Every write refreshes all queries, so lists update at once.
- **i18next + react-i18next.** One namespace per feature plus `common`, empty Tamil values fall back to English, a post-processor drives the pseudo-locale (`?pseudo=1`).
- **Vitest + Testing Library + axe-core.** One command (`npm run check`) runs lint, format, typecheck and all tests. Playwright is used for the browser flows, not as a project dependency.
- **ESLint, Prettier, simple-git-hooks + lint-staged.** The brief asks for lint and format on commit.
- **UX4G CSS plus a small `app.css`, no Tailwind.** Design tokens come from the UX4G package as custom properties.
- **cross-env, @types/node, @fullhuman/postcss-purgecss (dev only).** Static build script, Vite config typings, and shrinking the UX4G stylesheet for production.

## Design (UX4G, default theme)

- **System:** UX4G (`ux4g-web-components@3.0.2`), CSS only, default theme, no token overrides, no hard-coded colours or spacing in app code. The UX4G package and docs are the design source.
- **No UX4G JavaScript.** Each interactive pattern (dropdown listbox, combobox, tabs, modal, accordion, toasts, menus) is a React component using the UX4G markup, with roving focus, Escape, focus return and ARIA written in React so it works with routing and state.
- **No dark mode.** UX4G ships one, but the brief does not ask for it.
- **Layout.** Every page sits in UX4G's `ux4g-container`. The accessibility bar, navbar, main and footer all use it, so their edges line up. Page headers put the title on the left and the page's actions on the right (below the text when the page has an image). Section titles use `ux4g-heading-m-strong`, card titles `-s-strong` or `-xs-strong`, body `ux4g-body-m-default`, field labels `ux4g-label-l-default`; spacing comes from `ux4g-m*/p*` utilities and tokens, with no inline pixel styles. Element gaps use the `gap-*` classes, because UX4G's `ux4g-gap-*` utilities are the section scale.
- **Breakpoints.** Phone and tablet (below 1024 px) get a bottom bar and a sideways-scrolling section tab row; desktop gets the top menu. The UX4G container is narrower than the window (71 rem at 1200 px), which is why the top bar has room for only the two sections, the bell and the avatar.
- **Performance.** The package CSS is 8.4 MB as shipped; production builds slim it to about 36 KB gzipped. Checked by comparing computed styles of every element on 21 routes at two widths: no differences.
- **Font:** UX4G's Noto Sans, loaded from Google Fonts, with Noto Sans Tamil for Tamil glyphs. If the portal must work with no outside requests, self-host these three families.
- **Fixes to UX4G defaults:** icons outside buttons take `currentColor`; list rows are left-aligned; long radio and checkbox labels wrap at 320 px; the filled warning tag fails contrast, so "needs attention" uses the outline warning tag; wide tables scroll inside their own box.

## v2 concept (this build)

- **v2 wins over v1.** The two-section structure, the 28 routes, the 8 request types and the 6 statuses replace the first build's 42 pages, 17 types and 8 statuses. Anything not in the v2 route table was deleted: `/file`, `/requests`, `/people`, `/learn`, `/library`, `/desk`, `/account`.
- **Old v1 links show the 404 page.** There are no redirects, as the spec says a v1 route that is not listed is removed.
- **One approver, the Under Secretary.** The title is one config value (`approver.title` in `src/config/features.ts`, internal role id `approver`) and is read everywhere: catalogue strings use `{{approver}}` (an i18next default variable), and the repository and seed use the config directly. A rename is one line. No desk or section-officer stages.
- **Nothing changes the record until approval.** Profile edits, Career entries, past entries and service entries all create requests. A pending change shows the old value, a "Change pending" chip and "You asked for: ...".
- **Locked fields are enforced in the data layer** (`api.saveRequest` refuses a `profile-edit` that names one), and only a `correction` request can change one. One pending change per field or entry.
- **Edit panels are large dialogs.** The spec says "side panel on desktop, full-screen sheet on mobile"; the shared full-size UX4G modal does both. Change it in `Dialog` if a true side panel is wanted.
- **"Class (Pay Scale)" is one field** (`classPayScale`, for example "Level 13"). The seed no longer carries separate class and pay level.
- **Religion and caste** exist only on the signed-in officer's own record; the colleague type has no such fields, so they cannot reach the directory or search.
- **Chip wording.** `submitted` reads "Waiting for approval" and "Not approved" is used only for rejected. Proposals keep "Submitted" (`status.ideaSubmitted`).
- **Past records.** A request made from an "Add a past ..." form has `mode: past` and `source: paper`; so does an LTC trip whose end date has passed. Both require the proof file ("Scan of the paper record or order"). Overlap is blocked in both Apply and Add a past leave; a balance shortfall blocks Apply (a remark is needed) but only warns on a past leave.
- **LTC has no `/add-past` route.** The path shows the 404 page. LTC records past trips with its normal form.
- **Service cards are config.** `services.cards` plus a request type, no page changes, proven by a test that adds a fifth card at run time. A card without a list of its own keeps approved entries in `db.serviceRecords[card]`.
- **Home is a config list** (`features.home.sections`), because the product owner will finalise it.
- **Capacity Building's "Request training" is a direct post**, not a request: it appears at once under Requested by officers with a count of 1.
- **"Notifications"** stays as the bell page's name; the forbidden word is for an approval inbox.
- **Downloads** holds eight lists; DRO and Important Updates have sample rows until the department says what they contain.
- **Names live in `config/labels.ts`** and are merged into the English catalogue as `nav.*`, so a rename is one file. Page headlines stay in each namespace's `routes.*` entries.

## Brief

- **Colleague contact card** shows only the official email (v2 section 4.4). No phone numbers, no personal emails, no sharing settings.
- **"Master" and "Bachelor"** degree levels are Postgraduate and Graduate, because "Master" is on the never-show list.
- **Help desk, Accessibility statement, Terms and privacy** footer links have no pages in scope, so they are inert links.
- **Seed data** reseeds each day, because every date is relative to today.
- **Static build** uses hash URLs (`npm run build:static`) so it runs from any folder or file host.
