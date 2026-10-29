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
  login: L(() => import('@/features/auth/LoginPage')),
};

/** Prefetch a feature when the pointer is over a menu item. */
export const prefetch = (id: string) =>
  void (PAGES[id] as unknown as { _payload?: unknown } | undefined);
