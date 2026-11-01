import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { ROUTES } from '@/config/routes';

type Page = LazyExoticComponent<ComponentType>;
const loaders = new Map<Page, () => Promise<{ default: ComponentType }>>();
const L = (loader: () => Promise<{ default: ComponentType }>): Page => {
  const page = lazy(loader);
  loaders.set(page, loader);
  return page;
};

/** Route id to page. Anything missing here shows the placeholder. Each page loads on demand. */
export const PAGES: Record<string, Page> = {
  home: L(() => import('@/features/home/HomePage')),
  records: L(() => import('@/features/records/RecordsHome')),
  'records.profile': L(() => import('@/features/records/ProfilePage')),
  'records.services': L(() => import('@/features/records/ServicesPage')),
  'records.service': L(() => import('@/features/records/ServiceCardPage')),
  'records.service.new': L(() => import('@/features/records/ServiceFormPage')),
  'records.service.past': L(() => import('@/features/records/ServiceFormPast')),
  'records.downloads': L(() => import('@/features/records/DownloadsPage')),
  'records.request': L(() => import('@/features/records/RequestPage')),
  community: L(() => import('@/features/community/CommunityPage')),
  'community.proposals': L(() => import('@/features/community/IdeasPage')),
  'community.proposal': L(() => import('@/features/community/IdeaPage')),
  'community.proposals.new': L(() => import('@/features/community/NewIdeaPage')),
  'community.discourse': L(() => import('@/features/community/DiscussionsPage')),
  'community.post': L(() => import('@/features/community/DiscussionPage')),
  'community.discourse.new': L(() => import('@/features/community/NewPostPage')),
  'community.colleagues': L(() => import('@/features/people/ColleaguesPage')),
  'community.colleague': L(() => import('@/features/people/ColleaguePage')),
  'community.subject': L(() => import('@/features/people/SectionPage')),
  'community.capacity': L(() => import('@/features/learn/CapacityPage')),
  'community.beyond': L(() => import('@/features/people/ExpertsPage')),
  'community.awards': L(() => import('@/features/learn/AwardsPage')),
  notifications: L(() => import('@/features/notifications/NotificationsPage')),
  search: L(() => import('@/features/search/SearchPage')),
  login: L(() => import('@/features/auth/LoginPage')),
};

/** Warm a page's code when the pointer is over a menu item that leads to it. */
export function prefetchPath(path: string) {
  const route = ROUTES.find((r) => r.path === path.split('?')[0]);
  const page = route && PAGES[route.id];
  if (page) void loaders.get(page)?.();
}
