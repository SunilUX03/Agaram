import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { setViewport } from './setup';
import { ROUTES } from '@/config/routes';
import { renderApp, sample } from './utils';

async function serious(container: HTMLElement) {
  // jsdom has no layout, so colour contrast is checked in the real-browser audit instead.
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`);
}

describe.each([360, 1280])('accessibility at %i px', (width) => {
  it.each(ROUTES.map((r) => [r.id, r] as const))(
    '%s has no serious issues',
    async (_id, route) => {
      setViewport(width);
      sessionStorage.setItem('demo', '1');
      const { container } = renderApp(sample(route.path), { signedIn: route.id !== 'login' });
      await screen.findByRole('heading', { level: 1 }, { timeout: 4000 });
      await new Promise((r) => setTimeout(r, 1200)); // let the mock data arrive
      expect(await serious(container)).toEqual([]);
    },
    15000,
  );
});
