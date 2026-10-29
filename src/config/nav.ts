export interface NavLinkDef {
  label: string; // common.json key under nav.*
  to: string;
}
export interface NavGroup {
  label: string;
  items: NavLinkDef[];
}
export interface NavItem {
  id: string;
  label: string;
  /** Route the item opens. Absent means it only opens its dropdown. */
  to?: string;
  /** Path prefixes that mark this section as current. */
  match: string[];
  links?: NavLinkDef[];
  groups?: NavGroup[];
}

const l = (label: string, to: string): NavLinkDef => ({ label: `nav.${label}`, to });

/** Menu structure (brief, section 4). `features.nav.items` picks and orders these ids. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'nav.home', to: '/home', match: ['/home'] },
  {
    id: 'file',
    label: 'nav.file',
    to: '/file',
    match: ['/file'],
    links: [
      l('profile', '/file/profile'),
      l('career', '/file/career'),
      l('leave', '/file/leave'),
      l('training', '/file/training'),
      l('travel', '/file/travel'),
      l('property', '/file/property'),
      l('benefits', '/file/benefits'),
      l('documents', '/file/documents'),
    ],
  },
  {
    id: 'requests',
    label: 'nav.requests',
    to: '/requests',
    match: ['/requests'],
    links: [l('myRequests', '/requests'), l('startRequest', '/requests/new')],
  },
  {
    id: 'community',
    label: 'nav.community',
    to: '/community',
    match: ['/community'],
    links: [
      l('ideas', '/community/ideas'),
      l('discussions', '/community/discussions'),
      l('knowledge', '/community/knowledge'),
    ],
  },
  {
    id: 'people',
    label: 'nav.people',
    to: '/people/colleagues',
    match: ['/people'],
    links: [
      l('colleagues', '/people/colleagues'),
      l('whoDoesWhat', '/people/who-does-what'),
      l('experts', '/people/experts'),
    ],
  },
  {
    id: 'learnLibrary',
    label: 'nav.learnLibrary',
    match: ['/learn', '/library'],
    groups: [
      {
        label: 'nav.learn',
        items: [
          l('trainings', '/learn/trainings'),
          l('resources', '/learn/resources'),
          l('awards', '/learn/awards'),
        ],
      },
      {
        label: 'nav.library',
        items: [
          l('rules', '/library/rules'),
          l('circulars', '/library/circulars'),
          l('forms', '/library/forms'),
          l('faqs', '/library/faqs'),
          l('announcements', '/library/announcements'),
        ],
      },
    ],
  },
];

/** Bottom bar on mobile and tablet (always these five). */
export const BOTTOM_BAR = [
  { id: 'home', label: 'nav.home', to: '/home', icon: 'home', match: ['/home'] },
  { id: 'file', label: 'nav.serviceFile', to: '/file', icon: 'file', match: ['/file'] },
  {
    id: 'requests',
    label: 'nav.requests',
    to: '/requests',
    icon: 'requests',
    match: ['/requests'],
  },
  {
    id: 'community',
    label: 'nav.community',
    to: '/community',
    icon: 'community',
    match: ['/community'],
  },
];

export const FOOTER_LINKS = [
  { label: 'nav.rules', to: '/library/rules' },
  { label: 'nav.circulars', to: '/library/circulars' },
  { label: 'nav.faqs', to: '/library/faqs' },
  { label: 'footer.helpDesk' },
  { label: 'footer.accessibility' },
  { label: 'footer.terms' },
];

export const isCurrent = (pathname: string, match: string[]) =>
  match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

export const flattenLinks = (item: NavItem): NavLinkDef[] =>
  item.links ?? item.groups?.flatMap((g) => g.items) ?? [];
