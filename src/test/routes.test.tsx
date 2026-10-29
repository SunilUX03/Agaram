import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import en from '@/i18n/en/common.json';
import { App } from '@/app/App';
import { REDIRECTS, ROUTES } from '@/config/routes';

const sample = (path: string) =>
  path
    .replace(':type', 'leave')
    .replace(':departmentId', 'd1')
    .replace(':postId', 'p1')
    .replace(':id', '1');

const load = (ns: string) =>
  import(`../i18n/en/${ns}.json`).then(
    (m) => m.default as { routes: Record<string, { headline: string }> },
  );

describe('routes', () => {
  it.each(ROUTES.map((r) => [r.id, r] as const))(
    '%s renders its exact headline',
    async (_id, route) => {
      const cat = await load(route.ns);
      const expected = cat.routes[route.id.replaceAll('.', '_')].headline;
      render(
        <MemoryRouter initialEntries={[sample(route.path)]}>
          <App />
        </MemoryRouter>,
      );
      expect(await screen.findByRole('heading', { level: 1, name: expected })).toBeInTheDocument();
    },
  );

  it.each(REDIRECTS)('redirects $from to $to', async ({ from, to }) => {
    const target = ROUTES.find((r) => r.path === to)!;
    const cat = await load(target.ns);
    render(
      <MemoryRouter initialEntries={[from]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: cat.routes[target.id.replaceAll('.', '_')].headline,
      }),
    ).toBeInTheDocument();
  });

  it('shows the 404 page for unknown URLs', async () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: en.notFound.title }),
    ).toBeInTheDocument();
  });
});
