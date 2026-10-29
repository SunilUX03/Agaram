import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import en from '@/i18n/en/common.json';
import { REDIRECTS, ROUTES } from '@/config/routes';
import { DYNAMIC_H1, renderApp, sample } from './utils';

const load = (ns: string) =>
  import(`../i18n/en/${ns}.json`).then(
    (m) => m.default as { routes: Record<string, { headline: string }> },
  );
const wait = { timeout: 4000 };

describe('every route in section 7', () => {
  it.each(ROUTES.map((r) => [r.id, r] as const))(
    '%s renders with its exact headline',
    async (_id, route) => {
      const cat = await load(route.ns);
      const expected = cat.routes[route.id.replaceAll('.', '_')].headline;
      renderApp(sample(route.path), { signedIn: route.id !== 'login' });
      const h1 = await screen.findByRole('heading', { level: 1 }, wait);
      if (!DYNAMIC_H1.has(route.id)) expect(h1).toHaveTextContent(expected);
      expect(document.title).toMatch(/ \| Agaram$/);
    },
  );

  it.each(REDIRECTS.filter((r) => r.from !== '/'))('redirects $from to $to', async ({ to }) => {
    const target = ROUTES.find((r) => r.path === to)!;
    const cat = await load(target.ns);
    renderApp(REDIRECTS.find((r) => r.to === to)!.from);
    expect(await screen.findByRole('heading', { level: 1 }, wait)).toHaveTextContent(
      cat.routes[target.id.replaceAll('.', '_')].headline,
    );
  });

  it('shows the 404 page for unknown URLs', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(en.notFound.title);
  });

  it('sends a signed-out visitor to /login', async () => {
    renderApp('/requests', { signedIn: false });
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Sign in to Agaram');
  });
});
