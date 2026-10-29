import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@/i18n';
import { App } from '@/app/App';
import { resetDb, session } from '@/data/store';

/** Renders the whole app at a path, signed in, with a fresh mock database. */
export function renderApp(path: string, opts: { signedIn?: boolean } = {}) {
  resetDb();
  if (opts.signedIn === false) session.end();
  else session.start();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** A real id for every route that has a parameter. */
export const sample = (path: string) =>
  path
    .replace('/requests/new/:type', '/requests/new/leave')
    .replace('/requests/:id', '/requests/req-2')
    .replace('/community/ideas/:id', '/community/ideas/idea-1')
    .replace('/community/discussions/:id', '/community/discussions/post-1')
    .replace('/community/knowledge/:id', '/community/knowledge/art-1')
    .replace('/people/colleagues/:id', '/people/colleagues/col-1')
    .replace(':departmentId', 'dep-1')
    .replace(':postId', 'post-1-1');

/** Pages whose H1 comes from data (name, title, greeting) rather than the catalogue. */
export const DYNAMIC_H1 = new Set([
  'home',
  'requests.form',
  'requests.detail',
  'community.idea',
  'community.discussion',
  'community.article',
  'people.colleague',
  'people.section',
]);
