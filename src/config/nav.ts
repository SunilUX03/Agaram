import { features } from './features';

export interface NavLinkDef {
  /** common.json key under nav.* (filled from config/labels.ts). */
  label: string;
  /** Shorter wording for the phone tab row. */
  tab?: string;
  to: string;
  /** Match only this exact path when highlighting. */
  end?: boolean;
  /** Feature flag (community.pages key) that switches the page off. */
  flag?: string;
}
export interface NavItem {
  id: string;
  label: string;
  /** Route the item opens. */
  to: string;
  /** Path prefixes that mark this section as current. */
  match: string[];
  links: NavLinkDef[];
}

const l = (label: string, to: string, extra: Partial<NavLinkDef> = {}): NavLinkDef => ({
  label: `nav.${label}`,
  to,
  ...extra,
});

/** The two sections (v2, section 2). Each opens its home page and has a dropdown. */
const SECTIONS: NavItem[] = [
  {
    id: 'records',
    label: 'nav.records',
    to: '/records',
    match: ['/records'],
    links: [
      l('recordsHome', '/records', { tab: 'nav.home', end: true }),
      l('profile', '/records/profile'),
      l('services', '/records/services'),
      l('downloads', '/records/downloads'),
    ],
  },
  {
    id: 'community',
    label: 'nav.community',
    to: '/community',
    match: ['/community'],
    links: [
      l('communityHome', '/community', { tab: 'nav.home', end: true }),
      l('proposals', '/community/proposals', { flag: 'proposals' }),
      l('discourse', '/community/discourse', { flag: 'discourse' }),
      l('colleagues', '/community/colleagues', { flag: 'colleagues' }),
      l('capacity', '/community/capacity-building', { flag: 'capacity' }),
      l('beyond', '/community/beyond-the-file', { flag: 'beyond' }),
      l('awards', '/community/awards', { flag: 'awards' }),
    ],
  },
];

/** Sections with the pages the community flags have switched off removed. */
export const NAV_ITEMS: NavItem[] = SECTIONS.map((s) => ({
  ...s,
  links: s.links.filter((x) => !x.flag || features.community.pages[x.flag] !== false),
}));

/** Menu items in the top bar: the sections, with an optional visible Home link. */
export const TOP_NAV: NavItem[] = features.nav.showHomeLink
  ? [{ id: 'home', label: 'nav.home', to: '/home', match: ['/home'], links: [] }, ...NAV_ITEMS]
  : NAV_ITEMS;

/** Bottom bar on mobile and tablet: Home, the two sections, and Me (a sheet). */
export const BOTTOM_BAR = [
  { id: 'home', label: 'nav.home', to: '/home', icon: 'home', match: ['/home'] },
  { id: 'records', label: 'nav.records', to: '/records', icon: 'file', match: ['/records'] },
  {
    id: 'community',
    label: 'nav.community',
    to: '/community',
    icon: 'community',
    match: ['/community'],
  },
];

export const FOOTER_LINKS = [
  { label: 'nav.downloads', to: '/records/downloads' },
  { label: 'footer.faqs', to: '/records/downloads?tab=faqs' },
  { label: 'footer.helpDesk' },
  { label: 'footer.accessibility' },
  { label: 'footer.terms' },
];

export const isCurrent = (pathname: string, match: string[]) =>
  match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

export const flattenLinks = (item: NavItem): NavLinkDef[] => item.links;
