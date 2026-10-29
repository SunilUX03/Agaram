export type Namespace =
  | 'auth'
  | 'home'
  | 'file'
  | 'requests'
  | 'community'
  | 'people'
  | 'learn'
  | 'library'
  | 'desk'
  | 'notifications'
  | 'search'
  | 'account';

export interface RouteDef {
  /** Unique id. Dots become underscores in message keys. */
  id: string;
  path: string;
  /** Feature namespace that owns the page and its message catalogue. */
  ns: Namespace;
}

/** Every page in the brief, section 7. */
export const ROUTES: RouteDef[] = [
  { id: 'login', path: '/login', ns: 'auth' },
  { id: 'home', path: '/home', ns: 'home' },
  { id: 'file', path: '/file', ns: 'file' },
  { id: 'file.profile', path: '/file/profile', ns: 'file' },
  { id: 'file.career', path: '/file/career', ns: 'file' },
  { id: 'file.leave', path: '/file/leave', ns: 'file' },
  { id: 'file.training', path: '/file/training', ns: 'file' },
  { id: 'file.travel', path: '/file/travel', ns: 'file' },
  { id: 'file.property', path: '/file/property', ns: 'file' },
  { id: 'file.benefits', path: '/file/benefits', ns: 'file' },
  { id: 'file.documents', path: '/file/documents', ns: 'file' },
  { id: 'requests', path: '/requests', ns: 'requests' },
  { id: 'requests.new', path: '/requests/new', ns: 'requests' },
  { id: 'requests.form', path: '/requests/new/:type', ns: 'requests' },
  { id: 'requests.detail', path: '/requests/:id', ns: 'requests' },
  { id: 'community', path: '/community', ns: 'community' },
  { id: 'community.ideas', path: '/community/ideas', ns: 'community' },
  { id: 'community.idea', path: '/community/ideas/:id', ns: 'community' },
  { id: 'community.ideas.new', path: '/community/ideas/new', ns: 'community' },
  { id: 'community.discussions', path: '/community/discussions', ns: 'community' },
  { id: 'community.discussion', path: '/community/discussions/:id', ns: 'community' },
  { id: 'community.discussions.new', path: '/community/discussions/new', ns: 'community' },
  { id: 'community.knowledge', path: '/community/knowledge', ns: 'community' },
  { id: 'community.article', path: '/community/knowledge/:id', ns: 'community' },
  { id: 'community.knowledge.new', path: '/community/knowledge/new', ns: 'community' },
  { id: 'people.colleagues', path: '/people/colleagues', ns: 'people' },
  { id: 'people.colleague', path: '/people/colleagues/:id', ns: 'people' },
  { id: 'people.whodoeswhat', path: '/people/who-does-what', ns: 'people' },
  { id: 'people.section', path: '/people/who-does-what/:departmentId/:postId', ns: 'people' },
  { id: 'people.experts', path: '/people/experts', ns: 'people' },
  { id: 'learn.trainings', path: '/learn/trainings', ns: 'learn' },
  { id: 'learn.resources', path: '/learn/resources', ns: 'learn' },
  { id: 'learn.awards', path: '/learn/awards', ns: 'learn' },
  { id: 'library.rules', path: '/library/rules', ns: 'library' },
  { id: 'library.circulars', path: '/library/circulars', ns: 'library' },
  { id: 'library.forms', path: '/library/forms', ns: 'library' },
  { id: 'library.faqs', path: '/library/faqs', ns: 'library' },
  { id: 'library.announcements', path: '/library/announcements', ns: 'library' },
  { id: 'desk', path: '/desk', ns: 'desk' },
  { id: 'notifications', path: '/notifications', ns: 'notifications' },
  { id: 'search', path: '/search', ns: 'search' },
  { id: 'account', path: '/account', ns: 'account' },
];

/** Index routes that only redirect (brief, section 4). */
export const REDIRECTS: { from: string; to: string }[] = [
  { from: '/', to: '/home' },
  { from: '/people', to: '/people/colleagues' },
  { from: '/learn', to: '/learn/trainings' },
  { from: '/library', to: '/library/circulars' },
];
