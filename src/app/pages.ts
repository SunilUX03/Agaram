import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Page = LazyExoticComponent<ComponentType>;
const L = (loader: () => Promise<{ default: ComponentType }>): Page => lazy(loader);

/** Route id to page. Anything missing here shows the placeholder. Each page loads on demand. */
export const PAGES: Record<string, Page> = {
  home: L(() => import('@/features/home/HomePage')),
  file: L(() => import('@/features/file/FilePage')),
  'file.profile': L(() => import('@/features/file/ProfilePage')),
  'file.career': L(() => import('@/features/file/CareerPage')),
  'file.leave': L(() => import('@/features/file/LeavePage')),
  'file.training': L(() => import('@/features/file/TrainingPage')),
  'file.travel': L(() => import('@/features/file/TravelPage')),
  'file.property': L(() => import('@/features/file/PropertyPage')),
  'file.benefits': L(() => import('@/features/file/BenefitsPage')),
  'file.documents': L(() => import('@/features/file/DocumentsPage')),
  requests: L(() => import('@/features/requests/RequestsPage')),
  'requests.new': L(() => import('@/features/requests/NewRequestPage')),
  'requests.form': L(() => import('@/features/requests/RequestFormPage')),
  'requests.detail': L(() => import('@/features/requests/RequestPage')),
  community: L(() => import('@/features/community/CommunityPage')),
  'community.ideas': L(() => import('@/features/community/IdeasPage')),
  'community.idea': L(() => import('@/features/community/IdeaPage')),
  'community.ideas.new': L(() => import('@/features/community/NewIdeaPage')),
  'community.discussions': L(() => import('@/features/community/DiscussionsPage')),
  'community.discussion': L(() => import('@/features/community/DiscussionPage')),
  'community.discussions.new': L(() => import('@/features/community/NewPostPage')),
  'community.knowledge': L(() => import('@/features/community/KnowledgePage')),
  'community.article': L(() => import('@/features/community/ArticlePage')),
  'community.knowledge.new': L(() => import('@/features/community/NewArticlePage')),
  'people.colleagues': L(() => import('@/features/people/ColleaguesPage')),
  'people.colleague': L(() => import('@/features/people/ColleaguePage')),
  'people.whodoeswhat': L(() => import('@/features/people/WhoDoesWhatPage')),
  'people.section': L(() => import('@/features/people/SectionPage')),
  'people.experts': L(() => import('@/features/people/ExpertsPage')),
  'learn.trainings': L(() => import('@/features/learn/TrainingsPage')),
  'learn.resources': L(() => import('@/features/learn/ResourcesPage')),
  'learn.awards': L(() => import('@/features/learn/AwardsPage')),
  'library.rules': L(() => import('@/features/library/RulesPage')),
  'library.circulars': L(() => import('@/features/library/CircularsPage')),
  'library.forms': L(() => import('@/features/library/FormsPage')),
  'library.faqs': L(() => import('@/features/library/FaqsPage')),
  'library.announcements': L(() => import('@/features/library/AnnouncementsPage')),
  desk: L(() => import('@/features/desk/DeskPage')),
  notifications: L(() => import('@/features/notifications/NotificationsPage')),
  search: L(() => import('@/features/search/SearchPage')),
  account: L(() => import('@/features/account/AccountPage')),
  login: L(() => import('@/features/auth/LoginPage')),
};

/** Prefetch a feature when the pointer is over a menu item. */
export const prefetch = (id: string) =>
  void (PAGES[id] as unknown as { _payload?: unknown } | undefined);
