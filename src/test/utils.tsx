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
    .replace('/records/services/:card/add-past', '/records/services/leave/add-past')
    .replace('/records/services/:card/new', '/records/services/leave/new')
    .replace('/records/services/:card', '/records/services/leave')
    .replace('/records/requests/:id', '/records/requests/req-2')
    .replace('/community/proposals/:id', '/community/proposals/idea-1')
    .replace('/community/discourse/:id', '/community/discourse/post-1')
    .replace(
      '/community/colleagues/subject/:departmentId/:postId',
      '/community/colleagues/subject/dep-1/post-1-1',
    )
    .replace('/community/colleagues/:id', '/community/colleagues/col-1');

/** Pages whose H1 comes from data (name, title, greeting) rather than the catalogue. */
export const DYNAMIC_H1 = new Set([
  'home',
  'records.service',
  'records.service.new',
  'records.service.past',
  'records.request',
  'community.proposal',
  'community.post',
  'community.colleague',
  'community.subject',
]);
