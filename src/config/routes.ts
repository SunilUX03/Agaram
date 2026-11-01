export type Namespace =
  'auth' | 'home' | 'records' | 'community' | 'people' | 'learn' | 'notifications' | 'search';

export interface RouteDef {
  /** Unique id. Dots become underscores in message keys. */
  id: string;
  path: string;
  /** Feature namespace that owns the page and its message catalogue. */
  ns: Namespace;
}

/** Every page in v2, section 2. Anything not listed here does not exist. */
export const ROUTES: RouteDef[] = [
  { id: 'login', path: '/login', ns: 'auth' },
  { id: 'home', path: '/home', ns: 'home' },
  { id: 'records', path: '/records', ns: 'records' },
  { id: 'records.profile', path: '/records/profile', ns: 'records' },
  { id: 'records.services', path: '/records/services', ns: 'records' },
  { id: 'records.service', path: '/records/services/:card', ns: 'records' },
  { id: 'records.service.new', path: '/records/services/:card/new', ns: 'records' },
  { id: 'records.service.past', path: '/records/services/:card/add-past', ns: 'records' },
  { id: 'records.downloads', path: '/records/downloads', ns: 'records' },
  { id: 'records.request', path: '/records/requests/:id', ns: 'records' },
  { id: 'community', path: '/community', ns: 'community' },
  { id: 'community.proposals', path: '/community/proposals', ns: 'community' },
  { id: 'community.proposals.new', path: '/community/proposals/new', ns: 'community' },
  { id: 'community.proposal', path: '/community/proposals/:id', ns: 'community' },
  { id: 'community.discourse', path: '/community/discourse', ns: 'community' },
  { id: 'community.discourse.new', path: '/community/discourse/new', ns: 'community' },
  { id: 'community.post', path: '/community/discourse/:id', ns: 'community' },
  { id: 'community.colleagues', path: '/community/colleagues', ns: 'people' },
  { id: 'community.colleague', path: '/community/colleagues/:id', ns: 'people' },
  {
    id: 'community.subject',
    path: '/community/colleagues/subject/:departmentId/:postId',
    ns: 'people',
  },
  { id: 'community.capacity', path: '/community/capacity-building', ns: 'learn' },
  { id: 'community.beyond', path: '/community/beyond-the-file', ns: 'people' },
  { id: 'community.awards', path: '/community/awards', ns: 'learn' },
  { id: 'notifications', path: '/notifications', ns: 'notifications' },
  { id: 'search', path: '/search', ns: 'search' },
];

/** Index routes that only redirect. */
export const REDIRECTS: { from: string; to: string }[] = [{ from: '/', to: '/home' }];
